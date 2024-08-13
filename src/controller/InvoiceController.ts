import { Request, Response } from 'express';
import gDB from '../InitDataSource';
import { Order } from '../entity/Order.entity';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import ResponseHelper from './ResponseHelper';
import { ErrorCode } from '../common/ErrorCode';

export class InvoiceController {
	static async getInvoicePDF(req: Request, res: Response): Promise<Response> {
		try {
			const id = parseInt(req.params.orderId);

			if (isNaN(id)) {
				return res
					.status(400)
					.send(ResponseHelper.generateFailureResult(ErrorCode.ORDER_NOT_FOUND, 'Order not found'));
			}

			const db = gDB.getRepository(Order);
			const order = await db.findOne({
				where: { id: id },
				relations: ['user', 'shippingAddress', 'orderItems'],
			});

			if (!order) {
				return res
					.status(400)
					.send(ResponseHelper.generateFailureResult(ErrorCode.ORDER_NOT_FOUND, 'Order not found'));
			}

			const pdfDoc = await PDFDocument.create();
			const page = pdfDoc.addPage([600, 800]);
			const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

			page.drawText(`INVOICE`, {
				x: 250,
				y: 750,
				font,
				size: 18,
			});

			page.drawText(`Order Number: ${order.id}`, {
				x: 50,
				y: 700,
				font,
				size: 15,
			});

			const pacificTime = new Date().toLocaleString('en-US');
			page.drawText(`Date: ${pacificTime}`, {
				x: 50,
				y: 670,
				size: 15,
				font,
			});

			page.drawText(`Customer Name: ${order.user.firstName} ${order.user.lastName}`, {
				x: 50,
				y: 640,
				font,
				size: 15,
			});

			const { addressLine, city, province, postalCode } = order.shippingAddress;
			page.drawText(`Shipping Address:`, {
				x: 50,
				y: 610,
				font,
				size: 15,
			});
			page.drawText(`${addressLine}`, {
				x: 180,
				y: 610,
				font,
				size: 15,
			});
			page.drawText(`${city}, ${province} ${postalCode}`, {
				x: 400,
				y: 610,
				font,
				size: 15,
			});
			page.drawText(`Delivery Fee: $${order.deliveryFee.toFixed(2)}`, {
				x: 50,
				y: 580,
				font,
				size: 15,
			});
			page.drawText(`Tax: $${order.tax.toFixed(2)}`, {
				x: 50,
				y: 550,
				font,
				size: 15,
			});

			page.drawText(`Total Amount: $${order.orderTotalAmount.toFixed(2)}`, {
				x: 50,
				y: 520,
				font,
				size: 15,
			});

			// Loop through order items
			page.drawText(`Items details:`, {
				x: 50,
				y: 460,
				font,
				size: 18,
			});

			let currentItemY = 480;
			order.orderItems.forEach((item, index) => {
				currentItemY -= 60;
				page.drawText(`Item ${index + 1}: ${item.productName}`, {
					x: 50,
					y: currentItemY,
					font,
					size: 15,
				});

				page.drawText(`Quantity: ${item.quantity}`, {
					x: 50,
					y: currentItemY - 30,
					font,
					size: 15,
				})

				page.drawText(`Price: $${item.price.toFixed(2)}`, {
					x: 180,
					y: currentItemY -30,
					font,
					size: 15,
				});

				page.drawText(`Subtotal: $${(item.price * item.quantity).toFixed(2)}`, {
					x: 350,
					y: currentItemY -30,
					font,
					size: 15,
				});
			});
			// Finalize and send the PDF
			const pdfBytes = await pdfDoc.save();

			res.setHeader('Content-Type', 'application/pdf');
			res.setHeader('Content-Disposition', `attachment; filename="receipt_${order.id}.pdf"`);
			res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
			res.setHeader('Pragma', 'no-cache');
			res.setHeader('Expires', '0');
			return res.end(pdfBytes);
		} catch (error) {
			res.status(500).send(ResponseHelper.generateFailureResult(ErrorCode.DB_ERROR, error.driverError));
		}
	}
}
