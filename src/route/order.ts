import { Router } from "express";
import UserController from "../controller/UserController";
import OrderController from "../controller/OrderController";

const orderRouter = Router();
orderRouter.get("/:userId", OrderController.getUserOrders);
orderRouter.get("/:orderId/download/:type", OrderController.download);
orderRouter.post("/", OrderController.placeOrder);
orderRouter.post("/:orderId/pay", OrderController.payOrder);
orderRouter.post("/:orderId/cancel", OrderController.cancelOrder);
orderRouter.post("/:orderId/ship", OrderController.shipOrder);

export default orderRouter;
