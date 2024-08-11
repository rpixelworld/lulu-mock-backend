import { Router } from 'express';
import OrderController from '../controller/OrderController';
import { validateAdminJwt, validateJwt } from '../middleware/JwtValidator';
import { ReceiptController } from '../controller/ReceiptController';
import {InvoiceController} from "../controller/InvoiceController";

const orderRouter = Router();

orderRouter.post('/:userId', [validateJwt], OrderController.getUserOrders);
orderRouter.post('/', [validateAdminJwt], OrderController.getAllOrders);
orderRouter.get('/:orderId', [validateJwt], OrderController.getOneOrder);
orderRouter.get('/:orderId/download/:type', [validateJwt], OrderController.download);
orderRouter.post('/', [validateJwt], OrderController.placeOrder);
orderRouter.post('/:orderId/pay', [validateJwt], OrderController.payOrder);
orderRouter.post('/:orderId/cancel', [validateJwt], OrderController.cancelOrder);
orderRouter.post('/:orderId/ship', [validateAdminJwt], OrderController.shipOrder);

orderRouter.get('/:orderId/receipt',[validateJwt], ReceiptController.getReceiptPDF);
orderRouter.get('/:orderId/invoice', [validateJwt],InvoiceController.getInvoicePDF);
export default orderRouter;
