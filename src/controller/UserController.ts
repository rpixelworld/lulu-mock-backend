import { Request, Response } from 'express';
import gDB from '../InitDataSource';
import { User } from '../entity/User.entity';
import { validate } from 'class-validator';
import ResponseHelper from './ResponseHelper';
import { logger } from '../LoggerHelper';
import { ErrorCode } from '../common/ErrorCode';
import * as jwt from 'jsonwebtoken';
import { Order } from '../entity/Order.entity';
import { ShippingAddress } from '../entity/ShippingAddress.entity';

class UserController {
	static async all(req: Request, resp: Response) {
		const db = gDB.getRepository(User);
		try {
			let users = await db.find();
			return resp.status(200).send(ResponseHelper.generateSuccessResult(users));
		} catch (e) {
			resp.status(500).send(ResponseHelper.generateFailureResult(ErrorCode.DB_ERROR, e.driverError));
		}
	}

	//API – registration (add user)
	static async add(req: Request, resp: Response) {
		const { firstName, lastName, age, email, password } = req.body;
		let user = new User(firstName, lastName, age, email, password);
		let errors = await validate(user);
		if (errors.length > 0) {
			logger.error('Validation error', errors);
			return resp.status(400).send(ResponseHelper.generateFailureResult(ErrorCode.VALIDATION_ERROR, errors));
		}

		const db = gDB.getRepository(User);
		try {
			await db.save(user);
			user.password = password.substring(0, 3) + '********';
			return resp.status(200).send(ResponseHelper.generateSuccessResult(user));
		} catch (e) {
			logger.error('create a user failed', e);
			resp.status(500).send(ResponseHelper.generateFailureResult(ErrorCode.DB_ERROR, e.driverError));
		}
	}

	static async one(req: Request, resp: Response) {
		const { userId } = req.params;
		logger.info('find user with id=', userId, Number.isInteger(userId));
		if (!Number.isInteger(Number(userId))) {
			return resp
				.status(400)
				.send(ResponseHelper.generateFailureResult(ErrorCode.VALIDATION_ERROR, 'Invalid user id'));
		}

		const db = gDB.getRepository(User);
		try {
			let user = await db.findOne({ where: { id: Number(userId) }, relations: ['shippingAddresses'] });
			if (!user) {
				return resp
					.status(400)
					.send(
						ResponseHelper.generateFailureResult(
							ErrorCode.USER_NOT_EXIST,
							`User with id=${userId} not found`
						)
					);
			}
			user.password = '********';
			return resp.status(200).send(ResponseHelper.generateSuccessResult(user));
		} catch (e) {
			logger.error('find a user failed', e);
			resp.status(500).send(ResponseHelper.generateFailureResult(ErrorCode.DB_ERROR, e.driverError));
		}
	}

	static async login(req: Request, resp: Response) {
		const { email, password } = req.body;
		logger.info(`User ${email} trying to login.`);
		const db = gDB.getRepository(User);
		try {
			let user = await db.findOneBy({ email: email });
			if (!user) {
				return resp
					.status(400)
					.send(ResponseHelper.generateFailureResult(ErrorCode.USER_NOT_EXIST, `User not exist.`));
			}
			let loginSuccess = await user.comparePassword(password);
			if (!loginSuccess) {
				return resp
					.status(400)
					.send(ResponseHelper.generateFailureResult(ErrorCode.PASSWORD_INCORRECT, `Password Incorrect.`));
			}

			logger.info(`user ${email} login successfullym generating jwt token`);
			const token = jwt.sign({ uid: user.id, email: user.email, isAdmin: user.isAdmin }, process.env.JWT_SECRET, {
				expiresIn: '2h',
			});

			return resp.status(200).send(
				ResponseHelper.generateSuccessResult({
					userId: user.id,
					firstName: user.firstName,
					email: user.email,
					isAdmin: user.isAdmin,
					token: token,
				})
			);
		} catch (e) {
			logger.error('find a user failed', e);
			resp.status(500).send(ResponseHelper.generateFailureResult(ErrorCode.DB_ERROR, e.driverError));
		}
	}

	static async adminLogin(req: Request, resp: Response) {
		const { email, password } = req.body;
		logger.info(`User ${email} trying to login.`);
		const db = gDB.getRepository(User);
		try {
			let user = await db.findOneBy({ email: email });
			if (!user) {
				return resp
					.status(400)
					.send(ResponseHelper.generateFailureResult(ErrorCode.USER_NOT_EXIST, `User not exist.`));
			}
			let loginSuccess = await user.comparePassword(password);
			if (!loginSuccess) {
				return resp
					.status(400)
					.send(ResponseHelper.generateFailureResult(ErrorCode.PASSWORD_INCORRECT, `Password Incorrect.`));
			}

			if (!user.isAdmin) {
				return resp
					.status(403)
					.send(ResponseHelper.generateFailureResult(ErrorCode.NOT_ADMIN, 'Not admin user.'));
			}

			logger.info(`user ${email} login successfullym generating jwt token`);
			const token = jwt.sign({ uid: user.id, email: user.email, isAdmin: user.isAdmin }, process.env.JWT_SECRET, {
				expiresIn: '2h',
			});

			return resp.status(200).send(
				ResponseHelper.generateSuccessResult({
					userId: user.id,
					firstName: user.firstName,
					email: user.email,
					isAdmin: user.isAdmin,
					token: token,
				})
			);
		} catch (e) {
			logger.error('find a user failed', e);
			resp.status(500).send(ResponseHelper.generateFailureResult(ErrorCode.DB_ERROR, e.driverError));
		}
	}

	static async resetPassword(req: Request, resp: Response) {
		const { email, password } = req.body;
		logger.info(`User ${email} trying to reset password.`);
		const db = gDB.getRepository(User);
		try {
			let user = await db.findOneBy({ email: email });
			if (!user) {
				return resp
					.status(400)
					.send(ResponseHelper.generateFailureResult(ErrorCode.USER_NOT_EXIST, `User ${email} not found`));
			}
			user.password = password;
			await db.save(user);

			logger.info(`user ${email} password reset successfully`);
			return resp.status(200).send(
				ResponseHelper.generateSuccessResult({
					email: user.email,
					password: password.substring(0, 3) + '********',
				})
			);
		} catch (e) {
			logger.error('reset password failed', e);
			resp.status(500).send(ResponseHelper.generateFailureResult(ErrorCode.DB_ERROR, e.driverError));
		}
	}

	static async getAllShippingAddresses(req: Request, resp: Response) {}

	static async addShippingAddress(req: Request, resp: Response) {
		const { userId } = req.body;

		if (userId && !Number.isInteger(Number(userId))) {
			return resp
				.status(400)
				.send(ResponseHelper.generateFailureResult(ErrorCode.VALIDATION_ERROR, 'Invalid user id'));
		}
		try {
			const user: User = await gDB.getRepository(User).findOne({ where: { id: userId } });
			if (!user) {
				return resp
					.status(400)
					.send(ResponseHelper.generateFailureResult(ErrorCode.USER_NOT_EXIST, 'User not exist'));
			}

			let shippingAddress: ShippingAddress = Object.assign(new ShippingAddress(), req.body);
			shippingAddress.user = user;
			shippingAddress.countryCode = 'CA';
			const errors = await validate(shippingAddress);
			if (errors.length > 0) {
				return resp.status(400).send(ResponseHelper.generateFailureResult(ErrorCode.VALIDATION_ERROR, errors));
			}

			await gDB.getRepository(ShippingAddress).save(shippingAddress);
			return resp.status(200).send(ResponseHelper.generateSuccessResult(shippingAddress));
		} catch (e) {
			logger.error('error place order', e);
			return resp
				.status(500)
				.send(ResponseHelper.generateFailureResult(ErrorCode.DB_ERROR, 'internal server error'));
		}
	}

	static async deleteShippingAddress(req: Request, resp: Response) {}
}

export default UserController;
