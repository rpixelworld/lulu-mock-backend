import { Request, Response } from "express";
import gDB from "../InitDataSource";
import { User } from "../entity/User.entity";
import { validate } from "class-validator";
import ResponseHelper from "./ResponseHelper";
import user from "../route/user";
import { logger } from "../LoggerHelper";

class OrderController {

  static async getUserOrders(req: Request, resp: Response) {

  }

  static async download(req: Request, resp: Response) {

  }

  static async placeOrder(req: Request, resp: Response) {

  }

  static async payOrder(req: Request, resp: Response) {

  }

  static async cancelOrder(req: Request, resp: Response) {

  }

  static async shipOrder(req: Request, resp: Response) {

  }

}

export default OrderController;
