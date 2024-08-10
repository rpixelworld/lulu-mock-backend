import { Request, Response } from 'express';
import gDB from '../InitDataSource';
import { Order } from '../entity/Order.entity';
import { logger } from '../LoggerHelper';
import ResponseHelper from './ResponseHelper';
import { ErrorCode } from '../common/ErrorCode';
import { validate } from 'class-validator';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { User } from '../entity/User.entity';
import { ShippingAddress } from '../entity/ShippingAddress.entity';
import { OrderStatus } from '../common/OrderStatus';

class OrderController {
	static async getUserOrders(req: Request, resp: Response) {
		const validationMsg = validateQueryOrder(req);
		if (validationMsg) {
			return resp
				.status(400)
				.send(ResponseHelper.generateFailureResult(ErrorCode.VALIDATION_ERROR, validationMsg));
		}

		const repo = gDB.getRepository(Order);
		try {
			const { pageNo = '1', pageSize = '5' } = req.query;
			const queryBuilder: SelectQueryBuilder<Order> = createQueryBuilder(repo, req);
			const [orders, total] = await queryBuilder.getManyAndCount();

			return resp.status(200).send(
				ResponseHelper.generateSuccessResult({
					pagination: ResponseHelper.generatePaginationParams(
						Number(pageNo),
						Number(pageSize),
						total,
						orders.length
					),
					orders: orders,
				})
			);
		} catch (e) {
			logger.error('Exception find orders', e);
			return resp.status(500).send(ResponseHelper.generateFailureResult(ErrorCode.DB_ERROR, e.driverError));
		}
	}

	static async getAllOrders(req: Request, resp: Response) {
		const validationMsg = validateQueryOrder(req);
		if (validationMsg) {
			return resp
				.status(400)
				.send(ResponseHelper.generateFailureResult(ErrorCode.VALIDATION_ERROR, validationMsg));
		}

		const repo = gDB.getRepository(Order);
		try {
			const { pageNo = '1', pageSize = '5' } = req.query;
			const queryBuilder: SelectQueryBuilder<Order> = createQueryBuilder(repo, req);
			const [orders, total] = await queryBuilder.getManyAndCount();

			return resp.status(200).send(
				ResponseHelper.generateSuccessResult({
					pagination: ResponseHelper.generatePaginationParams(
						Number(pageNo),
						Number(pageSize),
						total,
						orders.length
					),
					orders: orders,
				})
			);
		} catch (e) {
			logger.error('Exception find orders', e);
			return resp.status(500).send(ResponseHelper.generateFailureResult(ErrorCode.DB_ERROR, e.driverError));
		}
	}

	static async placeOrder(req: Request, resp: Response) {
		logger.info('placing order');
		try {
			const { userId, shippingAddressId } = req.body;

			if (userId && !Number.isInteger(Number(userId))) {
				return resp
					.status(400)
					.send(ResponseHelper.generateFailureResult(ErrorCode.VALIDATION_ERROR, 'Invalid user id'));
			}
			if (shippingAddressId && !Number.isInteger(Number(shippingAddressId))) {
				return resp
					.status(400)
					.send(
						ResponseHelper.generateFailureResult(ErrorCode.VALIDATION_ERROR, 'Invalid shippingAddress id')
					);
			}

			const user: User = await gDB.getRepository(User).findOne({ where: { id: userId } });
			if (!user) {
				return resp
					.status(400)
					.send(ResponseHelper.generateFailureResult(ErrorCode.USER_NOT_EXIST, 'User not exist'));
			}
			const shippingAddress = await gDB
				.getRepository(ShippingAddress)
				.findOne({ where: { id: shippingAddressId } });
			if (!shippingAddress) {
				return resp
					.status(400)
					.send(
						ResponseHelper.generateFailureResult(ErrorCode.ADDRESS_NOT_EXIST, 'Shipping address not exist')
					);
			}

			let order: Order = Object.assign(new Order(), req.body);
			const errors = await validate(order);
			if (errors.length > 0) {
				return resp.status(400).send(ResponseHelper.generateFailureResult(ErrorCode.VALIDATION_ERROR, errors));
			}
			order.user = user;
			order.shippingAddress = shippingAddress;
			order.status = OrderStatus.CREATED;

			await gDB.getRepository(Order).save(order);

			return resp.status(200).send(ResponseHelper.generateSuccessResult(order));
		} catch (error) {
			logger.error('error place order', error);
			return resp
				.status(500)
				.send(ResponseHelper.generateFailureResult(ErrorCode.DB_ERROR, 'internal server error'));
		}
	}

	static async getOneOrder(req: Request, resp: Response) {
		const { orderId } = req.params;
		if (!Number.isInteger(Number(orderId))) {
			return resp
				.status(400)
				.send(ResponseHelper.generateFailureResult(ErrorCode.VALIDATION_ERROR, 'Invalid order id'));
		}

		try {
			const order: Order = await gDB.getRepository(Order).findOne({
				where: { id: Number(orderId) },
				relations: ['orderItems'],
			});
			return resp.status(200).send(ResponseHelper.generateSuccessResult(order));
		} catch (e) {
			logger.error('Exception find orders', e);
			return resp.status(500).send(ResponseHelper.generateFailureResult(ErrorCode.DB_ERROR, e.driverError));
		}
	}

	static async download(req: Request, resp: Response) {}

	static async payOrder(req: Request, resp: Response) {
		const { orderId } = req.params;
		if (!Number.isInteger(Number(orderId))) {
			return resp
				.status(400)
				.send(ResponseHelper.generateFailureResult(ErrorCode.VALIDATION_ERROR, 'Invalid order id'));
		}
		try {
			const repo = gDB.getRepository(Order);
			const order = await repo.findOne({ where: { id: Number(orderId) } });
			if (!order) {
				return resp
					.status(404)
					.send(ResponseHelper.generateFailureResult(ErrorCode.ORDER_NOT_FOUND, 'order not found'));
			}
			order.status = OrderStatus.PAID;
			order.paymentMethod = req.body.paymentMethod;
			order.paymentComment = req.body.paymentComment

			await repo.save(order);
			return resp.status(200).send(ResponseHelper.generateSuccessResult(order));
		} catch (e) {
			logger.error('Exception while paying for order', e);
			return resp.status(500).send(ResponseHelper.generateFailureResult(ErrorCode.DB_ERROR, e.driverError));
		}
	}

	static async cancelOrder(req: Request, resp: Response) {
		const { orderId } = req.params;
		if (!Number.isInteger(Number(orderId))) {
			return resp
				.status(400)
				.send(ResponseHelper.generateFailureResult(ErrorCode.VALIDATION_ERROR, 'Invalid order id'));
		}
		try {
			const repo = gDB.getRepository(Order);
			const order = await repo.findOneOrFail({ where: { id: Number(orderId) } });
			if (!order) {
				return resp
					.status(404)
					.send(ResponseHelper.generateFailureResult(ErrorCode.ORDER_NOT_FOUND, 'order not found'));
			}
			order.status = OrderStatus.CANCELLED;
			await repo.save(order);
			return resp.status(200).send(ResponseHelper.generateSuccessResult(order));
		} catch (e) {
			logger.error('Exception while paying for order', e);
			return resp.status(500).send(ResponseHelper.generateFailureResult(ErrorCode.DB_ERROR, e.driverError));
		}
	}

	static async shipOrder(req: Request, resp: Response) {
		const { orderId } = req.params;
		if (!Number.isInteger(Number(orderId))) {
			return resp
				.status(400)
				.send(ResponseHelper.generateFailureResult(ErrorCode.VALIDATION_ERROR, 'Invalid order id'));
		}
		try {
			const repo = gDB.getRepository(Order);
			const order = await repo.findOneOrFail({ where: { id: Number(orderId) } });
			if (!order) {
				return resp
					.status(404)
					.send(ResponseHelper.generateFailureResult(ErrorCode.ORDER_NOT_FOUND, 'order not found'));
			}
			order.status = OrderStatus.SHIPPED;
			await repo.save(order);
			return resp.status(200).send(ResponseHelper.generateSuccessResult(order));
		} catch (e) {
			logger.error('Exception while paying for order', e);
			return resp.status(500).send(ResponseHelper.generateFailureResult(ErrorCode.DB_ERROR, e.driverError));
		}
	}
}

export default OrderController;

function validateQueryOrder(req: Request): string {
	const { userId } = req.params;
	logger.info('find orders by userId=', userId, Number.isInteger(userId));
	if (userId && !Number.isInteger(Number(userId))) {
		return 'Invalid user id';
	}

	const { email, orderNumber, orderStatus } = req.body;
	if (orderNumber && !Number.isInteger(Number(orderNumber))) {
		return 'Invalid order number';
	}

	if (orderStatus && (!Number.isInteger(Number(orderStatus)) || !Object.values(OrderStatus).includes(orderStatus))) {
		return 'Invalid order status';
	}

	const { pageNo = '1', pageSize = '5' } = req.query;
	if (!Number.isInteger(Number(pageNo)) || !Number.isInteger(Number(pageSize))) {
		return 'Invalid page number or page size';
	}
}

function createQueryBuilder(repo: Repository<Order>, req: Request): SelectQueryBuilder<Order> {
	let queryBuilder: SelectQueryBuilder<Order> = repo.createQueryBuilder('order');

	const { userId } = req.params;
	const { email, orderNumber, orderStatus } = req.body;
	if (userId || email) {
		queryBuilder.innerJoin('order.user', 'user');
		if (userId) {
			queryBuilder.where('user.id=:userId', { userId: Number(userId) });
		} else {
			queryBuilder.where('user.email=:email', { email: email });
		}
	}
	if (orderNumber) {
		queryBuilder.where('id=:orderId', { orderId: Number(orderNumber) });
	}
	if (orderStatus) {
		queryBuilder.where('status=:orderStatus', { orderStatus: Number(orderStatus) });
	}

	const { pageNo = '1', pageSize = '5' } = req.query;
	queryBuilder.skip((Number(pageNo) - 1) * Number(pageSize));
	queryBuilder.take(Number(pageSize));

	return queryBuilder;
}
