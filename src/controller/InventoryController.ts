import { Request, Response } from 'express';
import gDB from '../InitDataSource';
import ResponseHelper from './ResponseHelper';
import { logger } from '../LoggerHelper';
import { Inventory } from '../entity/Inventory.entity';
import { ErrorCode } from '../common/ErrorCode';
import { validate } from 'class-validator';

class InventoryController {
	public static get repo() {
		return gDB.getRepository(Inventory);
	}
	// find all products with productId
	static async getProductInventory(req: Request, resp: Response) {
		try {
			const products = await InventoryController.repo.find({ where: { productId: req.params.productId } });
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
			const product = await InventoryController.repo.find({
				where: {
					productId: productId,
					colorId: colorId,
					size: size,
				},
			});

			if (!product || product.length === 0) {
				logger.error('product is not found');
				return resp
					.status(400)
					.send(ResponseHelper.generateFailureResult(ErrorCode.PRODUCT_NOT_FOUND, 'product is not found'));
			}

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

		try {
			const product = await InventoryController.repo.findOne({
				where: {
					productId: productId,
					colorId: colorId,
					size: size,
				},
			});
			const err = await validate(product);
			if (!product) {
				logger.error('product is not found');
				return resp
					.status(400)
					.send(ResponseHelper.generateFailureResult(ErrorCode.PRODUCT_NOT_FOUND, 'product is not found'));
			}
			if (err.length > 0) {
				logger.error('stock is not number');
				return resp
					.status(400)
					.send(ResponseHelper.generateFailureResult(ErrorCode.VALIDATION_ERROR, 'stock is not number'));
			}
			// save update
			product.stock = stock;
			await InventoryController.repo.save(product);
			return resp.status(200).send(ResponseHelper.generateSuccessResult(product));
		} catch (error) {
			logger.error('error getting product', error);
			return resp
				.status(500)
				.send(ResponseHelper.generateFailureResult(ErrorCode.DB_ERROR, 'internal server error'));
		}
	}
}

export default InventoryController;
