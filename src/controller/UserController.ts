import { Request, Response } from "express";
import gDB from "../InitDataSource";
import { UserEntity } from "../entity/User.entity";
import { validate } from "class-validator";
import ResponseHelper from "./ResponseHelper";
import user from "../route/user";
import { logger } from "../LoggerHelper";

class UserController {
  static async all(req: Request, resp: Response) {
    const db = gDB.getRepository(UserEntity);
    try {
      let users = await db.find();
      return resp.status(200).send(ResponseHelper.generateSuccessResult(users));
    } catch (e) {
      resp
        .status(500)
        .send(ResponseHelper.generateFailureResult(e.driverError));
    }
  }

  static async add(req: Request, resp: Response) {
    const { firstName, lastName, age, email, password } = req.body;
    let user = new UserEntity(firstName, lastName, age, email, password);
    let errors = await validate(user);
    if (errors.length > 0) {
      logger.error("Validation error", errors);
      return resp
        .status(400)
        .send(ResponseHelper.generateFailureResult(errors));
    }

    const db = gDB.getRepository(UserEntity);
    try {
      await db.save(user);
      return resp.status(200).send(ResponseHelper.generateSuccessResult(user));
    } catch (e) {
      logger.error("create a user failed", e);
      resp
        .status(500)
        .send(ResponseHelper.generateFailureResult(e.driverError));
    }
  }

  static async one(req: Request, resp: Response) {
    const { userId } = req.params;
    logger.info("find user with id=", userId, Number.isInteger(userId));
    if (!Number.isInteger(Number(userId))) {
      return resp
        .status(400)
        .send(ResponseHelper.generateFailureResult("Invalid user id"));
    }

    const db = gDB.getRepository(UserEntity);
    try {
      let user = await db.findOneBy({ id: Number(userId) });
      if (!user) {
        return resp
          .status(400)
          .send(
            ResponseHelper.generateFailureResult(
              `User with id=${userId} not found`,
            ),
          );
      }

      return resp.status(200).send(ResponseHelper.generateSuccessResult(user));
    } catch (e) {
      logger.error("find a user failed", e);
      resp
        .status(500)
        .send(ResponseHelper.generateFailureResult(e.driverError));
    }
  }

  static async update(req: Request, resp: Response) {
    const { userId } = req.params;
    logger.info(`updating user with id=${userId}`);

    if (!Number.isInteger(Number(userId))) {
      return resp
        .status(400)
        .send(ResponseHelper.generateFailureResult("Invalid user id"));
    }

    const { firstName, lastName, age, email, password } = req.body;
    let user = new UserEntity(firstName, lastName, age, email, password);
    let errors = await validate(user);
    if (errors.length > 0) {
      logger.error("Validation error", errors);
      return resp
        .status(400)
        .send(ResponseHelper.generateFailureResult(errors));
    }

    const db = gDB.getRepository(UserEntity);
    try {
      let existingUser = await db.findOneBy({ id: Number(userId) });
      if (!existingUser) {
        return resp
          .status(400)
          .send(
            ResponseHelper.generateFailureResult(
              `User with id=${userId} not found`,
            ),
          );
      }
      user = { ...existingUser, ...user, id: existingUser.id };
      await db.save(user);
      return resp.status(200).send(ResponseHelper.generateSuccessResult(user));
    } catch (e) {
      logger.error("update a user failed", e);
      resp
        .status(500)
        .send(ResponseHelper.generateFailureResult(e.driverError));
    }
  }

  static async delete(req: Request, resp: Response) {
    const { userId } = req.params;
    logger.error(`deleting user with id=${userId}`);

    if (!Number.isInteger(Number(userId))) {
      return resp
        .status(400)
        .send(ResponseHelper.generateFailureResult("Invalid user id"));
    }

    const db = gDB.getRepository(UserEntity);
    try {
      let existingUser = await db.findOneBy({ id: Number(userId) });
      if (!existingUser) {
        return resp
          .status(400)
          .send(
            ResponseHelper.generateFailureResult(
              `User with id=${userId} not found`,
            ),
          );
      }

      await db.remove(existingUser);
      return resp.status(200).send(ResponseHelper.generateSuccessResult(user));
    } catch (e) {
      logger.error("delete a user failed", e);
      resp
        .status(500)
        .send(ResponseHelper.generateFailureResult(e.driverError));
    }
  }
}

export default UserController;
