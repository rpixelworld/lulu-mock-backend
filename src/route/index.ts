import {Router} from "express";
import userRouter from "./user" ;



const rootRouter = Router()
rootRouter.use('/auth', userRouter)

export default rootRouter