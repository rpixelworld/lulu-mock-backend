import { Request, Response } from 'express';
import gDB from "../InitDataSource";
import { Order } from "../entity/Order.entity";
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

export class ReceiptController {
    static async getReceiptPDF(req: Request, res: Response): Promise<Response> {
        try {
            const id = parseInt(req.params.orderId);

            if (isNaN(id)) {
                return res.status(400).send("Invalid Order ID");
            }

            const db = gDB.getRepository(Order);
            const order = await db.findOne({
                where: { id: id },
                relations: ['user', 'shippingAddress', 'orderItems'],
            });

            if (!order) {
                return res.status(404).send("Receipt not found");
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
            let currentItemY = 580;
            order.orderItems.forEach((item, index) => {
                // Update Y position for each item
                currentItemY -= 30;

                page.drawText(`Item ${index + 1}: ${item.productName}`, {
                    x: 50,
                    y: currentItemY,
                    font,
                    size: 15,
                });

                page.drawText(`Quantity: ${item.quantity}`, {
                    x: 230,
                    y: currentItemY,
                    font,
                    size: 15,
                });

                page.drawText(`Price: $${item.price.toFixed(2)}`, {
                    x: 330,
                    y: currentItemY,
                    font,
                    size: 15,
                });

                page.drawText(`Subtotal: $${(item.price * item.quantity).toFixed(2)}`, {
                    x: 450,
                    y: currentItemY,
                    font,
                    size: 15,
                });
            });

            // Add totals and payment details
            page.drawText(`Total Amount:`, {
                x: 300,
                y: 300,
                font,
                size: 14,
            });
            page.drawText(`$${order.totalAmount.toFixed(2)}`, {
                x: 390,
                y: 300,
                font,
                size: 14,
                color: rgb(0, 0, 1),
            });

            page.drawText(`Tax Amount:`, {
                x: 450,
                y: 300,
                font,
                size: 14,
            });
            page.drawText(`$${order.tax.toFixed(2)}`, {
                x: 530,
                y: 300,
                font,
                size: 14,
                color: rgb(0, 0, 1),
            });

            page.drawText(`Payment Method:`, {
                x: 300,
                y: 280,
                font,
                size: 14,
            });
            page.drawText(`${order.paymentMethod}`, {
                x: 410,
                y: 280,
                font,
                size: 14,
                color: rgb(0, 0, 1),
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
            return res.status(500).send(`Error generating PDF: ${error.message}`);
        }
    }
}
