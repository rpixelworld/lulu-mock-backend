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
import { TaxMaster } from '../entity/TaxMaster.entity';
import { Inventory } from '../entity/Inventory.entity';

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
			const user: User = req['loginUser'];
			const queryBuilder: SelectQueryBuilder<Order> = createQueryBuilder(user, repo, req);
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
			const queryBuilder: SelectQueryBuilder<Order> = createQueryBuilder(null, repo, req);
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
		let order: Order;
		try {
			const { isNewShippingAddress, shippingAddress } = req.body;

			const user: User = req['loginUser'];
			if (!user) {
				return resp
					.status(400)
					.send(ResponseHelper.generateFailureResult(ErrorCode.USER_NOT_EXIST, 'User not exist'));
			}

			order = Object.assign(new Order(), req.body);
			logger.debug(order);
			order.user = user;

			if (!shippingAddress.id) {
				logger.info('saving new shipping address to userid=' + user.id);
				shippingAddress.inUsersAddressList = isNewShippingAddress;
				shippingAddress.user = user;
				await gDB.getRepository(ShippingAddress).save(shippingAddress);
				order.shippingAddress = shippingAddress;
			}

			const province = shippingAddress.province;
			const taxRate = await gDB.getRepository(TaxMaster).findOne({ where: { province: province } });
			const totalRate =
				(taxRate.gst ? taxRate.gst : 0) + (taxRate.pst ? taxRate.pst : 0) + (taxRate.hst ? taxRate.hst : 0);
			const tax = ((order.totalAmount + order.deliveryFee) * totalRate) / 100;
			order.tax = tax;
			order.orderTotalAmount = order.totalAmount + tax + order.deliveryFee;

			const errors = await validate(order);
			if (errors.length > 0) {
				return resp.status(400).send(ResponseHelper.generateFailureResult(ErrorCode.VALIDATION_ERROR, errors));
			}

			order.status = OrderStatus.UNPAID;
			const today = new Date();
			today.setDate(today.getDate() + 2);
			order.plannedShipmentDate = today;
		} catch (error) {
			logger.error('error place order', error);
			return resp
				.status(500)
				.send(ResponseHelper.generateFailureResult(ErrorCode.DB_ERROR, 'internal server error'));
		}

		const queryRunner = gDB.createQueryRunner();
		try {
			await queryRunner.connect();
			await queryRunner.startTransaction();
			for (let i = 0; i < order.orderItems.length; i++) {
				let inventory = await queryRunner.manager.findOne(Inventory, {
					where: {
						productId: order.orderItems[i].productId,
						colorId: order.orderItems[i].colorId,
						size: order.orderItems[i].size,
					},
				});
				if (inventory.stock >= order.orderItems[i].quantity) {
					inventory.stock = inventory.stock - order.orderItems[i].quantity;
					await queryRunner.manager.save(inventory);
				} else {
					throw new Error(ErrorCode.STOCK_CHANGE_UNAVILABLE);
				}
			}
			await queryRunner.manager.save(order);
			await queryRunner.commitTransaction();
			logger.info(`order created with id = ${order.id}`);

			return resp.status(200).send(ResponseHelper.generateSuccessResult(order));
		} catch (error) {
			logger.error('error place order, rollback', error);
			await queryRunner.rollbackTransaction();
			if (error.message == ErrorCode.STOCK_CHANGE_UNAVILABLE) {
				return resp
					.status(400)
					.send(
						ResponseHelper.generateFailureResult(
							ErrorCode.STOCK_CHANGE_UNAVILABLE,
							'Stock changed, one or more items in the cart is now unavailable, please review your cart again.'
						)
					);
			}
			return resp
				.status(500)
				.send(ResponseHelper.generateFailureResult(ErrorCode.DB_ERROR, 'internal server error'));
		} finally {
			await queryRunner.release();
			logger.info(`connection releaed`);
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
				relations: ['shippingAddress', 'orderItems'],
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
			order.paymentComment = req.body.paymentComment;

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
	const { orderNumber, orderStatus } = req.body;
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

function createQueryBuilder(user: User, repo: Repository<Order>, req: Request): SelectQueryBuilder<Order> {
	let queryBuilder: SelectQueryBuilder<Order> = repo.createQueryBuilder('order');
	const { email, orderNumber, orderStatus, timeRange } = req.body;
	if (user) {
		queryBuilder.innerJoin('order.user', 'user');
		queryBuilder.where('user.id=:userId', { userId: Number(user.id) });
	} else {
		if (email && email.trim() != '') {
			queryBuilder.innerJoin('order.user', 'user');
			queryBuilder.where('user.email=:email', { email: email });
		}
	}

	if (orderNumber && orderNumber != '') {
		queryBuilder.andWhere('order.id=:orderId', { orderId: Number(orderNumber) });
	}
	if (orderStatus && orderStatus != '0') {
		queryBuilder.andWhere('status=:orderStatus', { orderStatus: Number(orderStatus) });
	}
	if (timeRange && timeRange !== 'ALL') {
		let start = new Date(new Date().setHours(0, 0, 0, 0));
		let end = new Date(new Date().setHours(23, 59, 59, 999));

		switch (timeRange) {
			case 'PAST_1_MONTH':
				start.setMonth(start.getMonth() - 1);
				break;
			case 'PAST_3_MONTHs':
				start.setMonth(start.getMonth() - 3);
				break;
			case 'PAST_6_MONTHs':
				start.setMonth(start.getMonth() - 6);
				break;
			case 'YEAR_2024':
				start.setMonth(1, 1);
				break;
			case 'BEFORE_YEAR_2024':
				start.setFullYear(1970, 1, 1);
				end.setFullYear(2023, 12, 31);
				break;
			default:
				break;
		}
		queryBuilder.andWhere('order.createdAt between :start and :end', {
			start: start,
			end: end,
		});
	}

	queryBuilder.innerJoinAndSelect('order.shippingAddress', 'shippingAddress');
	queryBuilder.leftJoinAndSelect('order.orderItems', 'item');

	const { pageNo = '1', pageSize = '5' } = req.query;
	queryBuilder.skip((Number(pageNo) - 1) * Number(pageSize));
	queryBuilder.take(Number(pageSize));

	return queryBuilder;
}
