import {Request, Response} from "express";
import gDB from "../InitDataSource";
import {Order} from "../entity/Order.entity";
import {logger} from "../LoggerHelper";
import ResponseHelper from "./ResponseHelper";
import {ErrorCode} from "../common/ErrorCode";
import {validate} from "class-validator";
import {CheckIdController} from "./CheckIdController";
import {ValidateOrder} from "../common/ValidateOrder";

class OrderController extends CheckIdController{

  public static get repo(){
    return gDB.getRepository(Order);
  }
  static async getUserOrders(req: Request, resp: Response) {}

  static async getAllOrders(req: Request, resp: Response) {}

  static async download(req: Request, resp: Response) {}

  static async placeOrder(req: Request, resp: Response) {

    const order = Object.assign(new Order(), req.body);
    // const {n}
    try {
      const errors = await validate(order)
      if (errors.length>0) {
        return resp.status(400).send(ResponseHelper.generateFailureResult(ErrorCode.VALIDATION_ERROR,errors))
      }
      console.log('userId',req.body.userId);
      const [userIdRes,shippingAddressIdRes]= await ValidateOrder(req.body.userId,req.body.shippingAddressId)
      // console.log('o2')
      // check res
      if (!userIdRes.entities?.length || !shippingAddressIdRes.entities?.length) {
        return resp.status(400).send(ResponseHelper.generateFailureResult(ErrorCode.VALIDATION_ERROR, 'Invalid userId, shipping address, or order items'));
      }
      order.user= userIdRes.entities[0]
      order.shippingAddress= shippingAddressIdRes.entities[0]


      await OrderController.repo.save(order)

      return resp.status(200).send(ResponseHelper.generateSuccessResult(order))

    } catch (error) {
      logger.error('error place order', error);
      return resp.status(500).send(ResponseHelper.generateFailureResult(ErrorCode.DB_ERROR, 'internal server error'))
    }

  }

  static async payOrder(req: Request, resp: Response) {}

  static async cancelOrder(req: Request, resp: Response) {}

  static async shipOrder(req: Request, resp: Response) {}
}

export default OrderController;
