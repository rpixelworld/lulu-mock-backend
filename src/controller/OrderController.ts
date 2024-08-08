import { Request, Response } from 'express';
import gDB from '../InitDataSource';
import ResponseHelper from './ResponseHelper';
import { logger } from '../LoggerHelper';
import { ErrorCode } from '../common/ErrorCode';
import { FindManyOptions, FindOneOptions, Repository, SelectQueryBuilder } from 'typeorm';
import { Order } from '../entity/Order.entity';
import { OrderStatus } from '../common/OrderStatus';
import user from '../route/user';
import { create } from 'node:domain';

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

	static async placeOrder(req: Request, resp: Response) {}

	static async payOrder(req: Request, resp: Response) {}

	static async cancelOrder(req: Request, resp: Response) {}

	static async shipOrder(req: Request, resp: Response) {}
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
