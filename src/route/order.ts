import { Router } from "express";
import UserController from "../controller/UserController";
import OrderController from "../controller/OrderController";
import {validateAdminJwt, validateJwt} from "../middleware/JwtValidator";

const orderRouter = Router();
orderRouter.post("/:userId", [validateJwt], OrderController.getUserOrders);
orderRouter.post("/", [validateAdminJwt], OrderController.getAllOrders);
orderRouter.get("/:orderId/download/:type", [validateJwt], OrderController.download);
orderRouter.post("/", [validateJwt], OrderController.placeOrder);
orderRouter.post("/:orderId/pay", [validateJwt], OrderController.payOrder);
orderRouter.post("/:orderId/cancel", [validateJwt], OrderController.cancelOrder);
orderRouter.post("/:orderId/ship", [validateAdminJwt],OrderController.shipOrder);

export default orderRouter;
