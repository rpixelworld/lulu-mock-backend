import { Request, Response } from "express";
import gDB from "../InitDataSource";
import { User } from "../entity/User.entity";
import { validate } from "class-validator";
import ResponseHelper from "./ResponseHelper";
import user from "../route/user";
import { logger } from "../LoggerHelper";

class InventoryController {

  static async getProductInventory(req: Request, resp: Response) {

  }

  static async getInventory(req: Request, resp: Response) {

  }

  static async updateInventory(req: Request, resp: Response) {

  }


}

export default InventoryController;
