import { Router } from 'express';
import PaypalController from '../controller/PaypalController';

const paypalRouter = Router();
paypalRouter.post('/orders', PaypalController.createPaypalOrder);
paypalRouter.post('/orders/:paypalOrderId/capture', PaypalController.capturePaypalOrder);

export default paypalRouter;
