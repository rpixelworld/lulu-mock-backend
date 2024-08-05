import { Router } from "express";
import UserController from "../controller/UserController";

const userRouter = Router();
userRouter.post("/", UserController.add);
userRouter.get("/:userId", UserController.one);
userRouter.put("/:userId", UserController.update);
userRouter.delete("/:userId", UserController.delete);
userRouter.get("/", UserController.all);

userRouter.get("/:userId/addresses", UserController.getAllShippingAddresses);
userRouter.post("/:userId/addresses", UserController.addShippingAddress);
userRouter.delete("/:userId/addresses/:addressId", UserController.deleteShippingAddress);

export default userRouter;
