import { Request, Response } from 'express';
import gDB from '../InitDataSource';
import ResponseHelper from './ResponseHelper';
import { logger } from '../LoggerHelper';
import { Inventory } from '../entity/Inventory.entity';
import { ErrorCode } from '../common/ErrorCode';
import { validate } from 'class-validator';

class InventoryController {
	// public static get repo() {
	// 	return gDB.getRepository(Inventory);
	// }
	// find all products with productId
	static async getProductInventory(req: Request, resp: Response) {
		try {
			const products = await gDB.getRepository(Inventory).find({ where: { productId: req.params.productId } });
			if (!products || products.length === 0) {
				logger.error('product is not found');
				return resp
					.status(400)
					.send(ResponseHelper.generateFailureResult(ErrorCode.PRODUCT_NOT_FOUND, 'product is not found'));
			}
			return resp.status(200).json(ResponseHelper.generateSuccessResult(products));
		} catch (error) {
			logger.error('error getting product', error);
			return resp
				.status(500)
				.send(ResponseHelper.generateFailureResult(ErrorCode.DB_ERROR, 'internal server error'));
		}
	}

	// find product and its color and size
	static async getInventory(req: Request, resp: Response) {
		const { productId, colorId, size } = req.params;
		try {
			const product = await gDB.getRepository(Inventory).find({
				where: {
					productId: productId,
					colorId: colorId,
					size: size,
				},
			});
			// verify params
			// if(!product || product.length==0) {
			// 	const emptyIntentory = [{
			// 		productId: productId,
			// 		colorId: colorId,
			// 		size: size,
			// 		stock: 0
			// 	}]
			// 	return resp.status(200).json(ResponseHelper.generateSuccessResult(emptyIntentory));
			// }
			// if (!product || product.length === 0 || !colorId || colorId.length === 0 || !size || size.length === 0) {
			// 	logger.error('product is not found');
			// 	return resp
			// 		.status(400)
			// 		.send(ResponseHelper.generateFailureResult(ErrorCode.PRODUCT_NOT_FOUND, 'product is not found'));
			// }
			return resp.status(200).json(ResponseHelper.generateSuccessResult(product));
		} catch (error) {
			logger.error('error getting product', error);
			return resp
				.status(500)
				.send(ResponseHelper.generateFailureResult(ErrorCode.DB_ERROR, 'internal server error'));
		}
	}

	static async updateInventory(req: Request, resp: Response) {
		const { productId, colorId, size } = req.params;
		const { stock } = req.body;
		// verify params
		if (!productId || !colorId || !size || stock === undefined) {
			logger.error('Invalid request parameters');
			return resp
				.status(400)
				.send(ResponseHelper.generateFailureResult(ErrorCode.INVALID_REQUEST, 'Invalid request parameters'));
		}
		// verify type of params
		if (typeof stock !== 'number') {
			logger.error('Stock is not a number');
			return resp
				.status(400)
				.send(ResponseHelper.generateFailureResult(ErrorCode.VALIDATION_ERROR, 'Stock must be a number'));
		}

		try {
			// begin looking and comparing
			const product = await gDB.getRepository(Inventory).findOne({
				where: {
					productId: productId,
					colorId: colorId,
					size: size,
				},
			});
			if (!product) {
				logger.error('product is not found');
				return resp
					.status(400)
					.send(ResponseHelper.generateFailureResult(ErrorCode.PRODUCT_NOT_FOUND, 'product is not found'));
			}
			// update data
			product.stock = stock;
			// verify type of data after update
			const err = await validate(product);
			if (err.length > 0) {
				logger.error('stock is not number');
				return resp
					.status(400)
					.send(ResponseHelper.generateFailureResult(ErrorCode.VALIDATION_ERROR, 'stock is not number'));
			}
			// save to the entity
			await gDB.getRepository(Inventory).save(product);
			return resp.status(200).send(ResponseHelper.generateSuccessResult(product));
		} catch (error) {
			logger.error('error getting product', error);
			return resp
				.status(500)
				.send(ResponseHelper.generateFailureResult(ErrorCode.DB_ERROR, 'internal server error'));
		}
	}

	static async getInventoryOfProductAndColor(req: Request, resp: Response) {
		const { productId, colorId } = req.params;
		try {
			const product = await gDB.getRepository(Inventory).find({
				where: {
					productId: productId,
					colorId: colorId,
				},
			});
			// verify params
			// if (!product || product.length === 0 || !colorId || colorId.length === 0) {
			// 	logger.error('product is not found');
			// 	return resp
			// 		.status(400)
			// 		.send(ResponseHelper.generateFailureResult(ErrorCode.PRODUCT_NOT_FOUND, 'product is not found'));
			// }

			return resp.status(200).json(ResponseHelper.generateSuccessResult(product));
		} catch (error) {
			logger.error('error getting product', error);
			return resp
				.status(500)
				.send(ResponseHelper.generateFailureResult(ErrorCode.DB_ERROR, 'internal server error'));
		}
	}
}

export default InventoryController;
