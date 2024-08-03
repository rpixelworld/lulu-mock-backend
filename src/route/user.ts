import { Router } from "express";
import UserController from "../controller/UserController";

const userRouter = Router();
userRouter.post("/user", UserController.add);
userRouter.get("/user/:userId", UserController.one);
userRouter.put("/user/:userId", UserController.update);
userRouter.delete("/user/:userId", UserController.delete);
userRouter.get("/user", UserController.all);

export default userRouter;
