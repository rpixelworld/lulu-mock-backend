import fetch from 'node-fetch';
import { logger } from '../LoggerHelper';
import { Request, Response } from 'express';
import gDB from '../InitDataSource';
import { Order } from '../entity/Order.entity';
import { PaymentMethod } from '../common/PaymentMethod';
import { OrderStatus } from '../common/OrderStatus';

class PaypalController {
	static async generateAccessToken() {
		try {
			if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET) {
				throw new Error('MISSING_API_CREDENTIALS');
			}
			const auth = Buffer.from(process.env.PAYPAL_CLIENT_ID + ':' + process.env.PAYPAL_CLIENT_SECRET).toString(
				'base64'
			);
			const response = await fetch(`${process.env.PAYPAL_BASE_URL}/v1/oauth2/token`, {
				method: 'POST',
				body: 'grant_type=client_credentials',
				headers: {
					Authorization: `Basic ${auth}`,
				},
			});

			const data = await response.json();
			logger.debug(`Generated access token from paypal: ${data.access_token}`);
			return data['access_token'];
		} catch (error) {
			logger.error('Failed to generate paypal Access Token:', error);
		}
	}

	static async handleResponse(resp: any) {
		try {
			const jsonResponse = await resp.json();
			return {
				jsonResponse,
				httpStatusCode: resp.status,
			};
		} catch (err) {
			const errorMessage = await resp.text();
			throw new Error(errorMessage);
		}
	}

	static async createPaypalOrder(req: Request, resp: Response) {
		const { orderId, totalCost } = req.body;
		try {
			const order: Order = await gDB.getRepository(Order).findOne({where: {id: orderId}})

			const accessToken = await PaypalController.generateAccessToken();
			const url = `${process.env.PAYPAL_BASE_URL}/v2/checkout/orders`;
			const payload = {
				intent: 'CAPTURE',
				purchase_units: [
					{
						reference_id: String(order.id).padStart(10, '0'),
						description: `${order.totalItem} ITEMS FROM LULULEMON`,
						amount: {
							currency_code: 'CAD',
							value: order.orderTotalAmount,
						},
					},
				],
			};
			const response = await fetch(url, {
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${accessToken}`,
					// Uncomment one of these to force an error for negative testing (in sandbox mode only). Documentation:
					// https://developer.paypal.com/tools/sandbox/negative-testing/request-headers/
					// "PayPal-Mock-Response": '{"mock_application_codes": "MISSING_REQUIRED_PARAMETER"}'
					// "PayPal-Mock-Response": '{"mock_application_codes": "PERMISSION_DENIED"}'
					// "PayPal-Mock-Response": '{"mock_application_codes": "INTERNAL_SERVER_ERROR"}'
				},
				method: 'POST',
					body: JSON.stringify(payload),
			});

			const { jsonResponse, httpStatusCode } = await PaypalController.handleResponse(response);
			return resp.status(httpStatusCode).json(jsonResponse);
		} catch (e) {
			logger.error('Failed to create order:', e);
			return resp.status(500).json({ error: 'Failed to create order.' });
		}
	}

	static async capturePaypalOrder(req: Request, resp: Response) {
		const { paypalOrderId } = req.params;
		try {
			const accessToken = await PaypalController.generateAccessToken();
			const url = `${process.env.PAYPAL_BASE_URL}/v2/checkout/orders/${paypalOrderId}/capture`;

			const response = await fetch(url, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${accessToken}`,
					// Uncomment one of these to force an error for negative testing (in sandbox mode only). Documentation:
					// https://developer.paypal.com/tools/sandbox/negative-testing/request-headers/
					// "PayPal-Mock-Response": '{"mock_application_codes": "INSTRUMENT_DECLINED"}'
					// "PayPal-Mock-Response": '{"mock_application_codes": "TRANSACTION_REFUSED"}'
					// "PayPal-Mock-Response": '{"mock_application_codes": "INTERNAL_SERVER_ERROR"}'
				},
			});

			const { jsonResponse, httpStatusCode } = await PaypalController.handleResponse(response);

			if(httpStatusCode=='201') {
				const referenceId = jsonResponse['purchase_units'][0].reference_id;
				const orderId = Number(referenceId)
				const order = await gDB.getRepository(Order).findOne({where: {id: orderId}});
				order.status = OrderStatus.PAID
				order.paymentMethod = PaymentMethod.PAYPAL;
				order.paymentComment = paypalOrderId
				await gDB.getRepository(Order).save(order)
			}

			return resp.status(httpStatusCode).json(jsonResponse);

		} catch (e) {
			console.error('Failed to create order:', e);
			return resp.status(500).json({ error: 'Failed to capture order.' });
		}
	}
}

export default PaypalController;
