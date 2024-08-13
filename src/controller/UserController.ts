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
			delete user.password;

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
			let user = await db
				.createQueryBuilder('user')
				.leftJoinAndSelect('user.shippingAddresses', 'shippingAddress')
				.where('id=:userId', { userId: Number(userId) })
				.where('shippingAddress.inUsersAddressList=1')
				.getOne();

			// let user = await db.findOne({
			// 	where: { id: Number(userId) },
			// 	relations: ['shippingAddresses'] });
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

			return resp.status(200).send(ResponseHelper.generateSuccessResult(user));
		} catch (e) {
			logger.error('find a user failed', e);
			resp.status(500).send(ResponseHelper.generateFailureResult(ErrorCode.DB_ERROR, e.driverError));
		}
	}

	static async login(req: Request, resp: Response) {
		let result = await validateEmailPassword(req);
		if (!(result instanceof User)) {
			return resp.status(400).send(ResponseHelper.generateFailureResultWithError(result));
		}

		const user: User = result as User;
		delete user.password;

		logger.info(`user email=${user.email} login successfully generating jwt token`);
		const token = generateJwt(user);

		return resp.status(200).send(ResponseHelper.generateSuccessResult({ ...user, token: token }));
	}

	static async adminLogin(req: Request, resp: Response) {
		let result = await validateEmailPassword(req);
		if (!(result instanceof User)) {
			return resp.status(400).send(ResponseHelper.generateFailureResultWithError(result));
		}

		const user: User = result as User;
		if (!user.isAdmin) {
			return resp.status(403).send(ResponseHelper.generateFailureResult(ErrorCode.NOT_ADMIN, 'Not admin user.'));
		}

		delete user.password;
		logger.info(`user email=${user.email} login successfully generating jwt token`);
		const token = generateJwt(user);

		return resp.status(200).send(ResponseHelper.generateSuccessResult({ ...user, token: token }));
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

			delete user.password;
			logger.info(`user ${email} password reset successfully`);
			return resp.status(200).send(ResponseHelper.generateSuccessResult(user));
		} catch (e) {
			logger.error('reset password failed', e);
			resp.status(500).send(ResponseHelper.generateFailureResult(ErrorCode.DB_ERROR, e.driverError));
		}
	}

	static async getAllShippingAddresses(req: Request, resp: Response) {
		try {
			const user: User = req['loginUser'];

			// Retrieve all shipping addresses for the logged-in user
			const addresses = await gDB.getRepository(ShippingAddress).find({
				where: { user: user },
			});

			if (addresses.length === 0) {
				return resp
					.status(404)
					.send(ResponseHelper.generateFailureResult(ErrorCode.DB_ERROR, 'No addresses found'));
			}

			return resp.status(200).send(ResponseHelper.generateSuccessResult(addresses));
		} catch (e) {
			logger.error('Error retrieving addresses', e);
			return resp
				.status(500)
				.send(ResponseHelper.generateFailureResult(ErrorCode.DB_ERROR, 'Internal server error'));
		}
	}



	static async addShippingAddress(req: Request, resp: Response) {
		try {
			const user: User = req['loginUser'];
			logger.debug(user);
			let shippingAddress: ShippingAddress = Object.assign(new ShippingAddress(), req.body);
			shippingAddress.user = user;
			// shippingAddress.countryCode = 'CA';
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

	static async deleteShippingAddress(req: Request, resp: Response) {
		try {
			const user: User = req['loginUser'];
			const { addressId } = req.params;

			if (!Number.isInteger(Number(addressId))) {
				return resp
					.status(400)
					.send(ResponseHelper.generateFailureResult(ErrorCode.VALIDATION_ERROR, 'Invalid address id'));
			}

			const address = await gDB.getRepository(ShippingAddress).findOne({
				where: { id: Number(addressId), user: user },
			});
			if (!address) {
				return resp
					.status(404)
					.send(ResponseHelper.generateFailureResult(ErrorCode.DB_ERROR, 'Address not found'));
			}

			await gDB.getRepository(ShippingAddress).remove(address);
			return resp.status(200).send(ResponseHelper.generateSuccessResult('Address deleted successfully'));
		} catch (e) {
			logger.error('Error deleting address', e);
			return resp
				.status(500)
				.send(ResponseHelper.generateFailureResult(ErrorCode.DB_ERROR, 'Internal server error'));
		}
	}
}

export default UserController;

async function validateEmailPassword(req: Request): Promise<{ errorCode: ErrorCode; message: string } | User> {
	const { email, password } = req.body;
	logger.info(`Validating email=${email}, password=${password.substring(0, 3)}********`);
	const db = gDB.getRepository(User);
	try {
		let user = await db.findOne({
			where: { email: email },
			select: ['id', 'firstName', 'lastName', 'email', 'password', 'isAdmin'],
		});
		if (!user) {
			logger.error(`email=${email} not found`);
			return {
				errorCode: ErrorCode.USER_NOT_EXIST,
				message: `User not exist.`,
			};
		}
		let loginSuccess = await user.comparePassword(password);
		if (!loginSuccess) {
			logger.error(`email=${email} password incorrect`);
			return {
				errorCode: ErrorCode.PASSWORD_INCORRECT,
				message: `Password Incorrect.`,
			};
		}
		return user;
	} catch (e) {
		return {
			errorCode: ErrorCode.DB_ERROR,
			message: e.e.driverError,
		};
	}
}

function generateJwt(user: User): string {
	const token = jwt.sign({ user: user }, process.env.JWT_SECRET, { expiresIn: '2h' });
	return token;
}
