import { Request, Response } from 'express';
import gDB from '../InitDataSource';
import { Order } from '../entity/Order.entity';
import { PDFDocument, StandardFonts } from 'pdf-lib';
import ResponseHelper from './ResponseHelper';
import { ErrorCode } from '../common/ErrorCode';

export class ReceiptController {
	static async getReceiptPDF(req: Request, res: Response): Promise<Response> {
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

			page.drawText(`Lululemon.com`, {
				x: 50,
				y: 750,
				font,
				size: 20,
			});

			page.drawText(`RECEIPT`, {
				x: 400,
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
				x: 250,
				y: 700,
				size: 15,
				font,
			});

			page.drawText(`Customer Name: ${order.user.firstName} ${order.user.lastName}`, {
				x: 50,
				y: 670,
				font,
				size: 15,
			});

			const { addressLine, city, province, postalCode } = order.shippingAddress;
			page.drawText(`Shipping Address:`, {
				x: 50,
				y: 620,
				font,
				size: 15,
			});
			page.drawText(`${addressLine}`, {
				x: 200,
				y: 630,
				font,
				size: 15,
			});
			page.drawText(`${city}, ${province} ${postalCode}`, {
				x: 200,
				y: 600,
				font,
				size: 15,
			});

			// Loop through order items
			page.drawText(`Items details:`, {
				x: 50,
				y: 570,
				font,
				size: 17,
			});

			let currentItemY = 590;
			order.orderItems.forEach((item, index) => {
				// Update Y position for each item
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
				});

				page.drawText(`Price: $${item.price.toFixed(2)}`, {
					x: 180,
					y: currentItemY - 30,
					font,
					size: 15,
				});

				page.drawText(`Subtotal: $${(item.price * item.quantity).toFixed(2)}`, {
					x: 350,
					y: currentItemY - 30,
					font,
					size: 15,
				});
			});

			// Add totals and payment details
			const summaryY = currentItemY - 80;
			page.drawText(`Summary:`, {
				x: 50,
				y: summaryY,
				font,
				size: 17,
			});
			page.drawText(`Delivery Fee: $${order.deliveryFee.toFixed(2)}`, {
				x: 50,
				y: summaryY - 30,
				font,
				size: 15,
			});
			page.drawText(`Tax: $${order.tax.toFixed(2)}`, {
				x: 250,
				y: summaryY - 30,
				font,
				size: 15,
			});

			page.drawText(` Total Amount: $${order.orderTotalAmount.toFixed(2)}`, {
				x: 400,
				y: summaryY - 30,
				font,
				size: 15,
			});

			page.drawText(`Payment Method: ${order.paymentMethod}`, {
				x: 50,
				y: summaryY - 60,
				font,
				size: 15,
			});

			page.drawText(`Payment comment: (${order.paymentComment})`, {
				x: 250,
				y: summaryY - 60,
				font,
				size: 15,
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
