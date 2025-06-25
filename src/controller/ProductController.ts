import { Request, Response } from 'express';
import * as path from 'node:path';
import * as multer from 'multer';
import { logger } from '../LoggerHelper';
import ResponseHelper from './ResponseHelper';
import { ErrorCode } from '../common/ErrorCode';
import { Storage } from '@google-cloud/storage';
import vision = require('@google-cloud/vision');
import { google } from '@google-cloud/vision/build/protos/protos';
import Type = google.cloud.vision.v1.Feature.Type;
import axios from 'axios';
import * as fs from 'node:fs';
import { User } from '../entity/User.entity';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Order } from '../entity/Order.entity';
import { ProductJson } from '../entity/ProductJson.entity';
import gDB from '../InitDataSource';

const client = new vision.ProductSearchClient();
const imageAnnotatorClient = new vision.ImageAnnotatorClient();
const projectId = process.env.GOOGLE_PROJECT_ID;
const location = process.env.GOOGLE_LOCATION;
const productSetId = process.env.GOOGLE_VISION_PRODUCTSET_ID;

class ProductController {
	static getStorage() {
		return multer.diskStorage({
			destination: (req, file, cb) => {
				cb(null, path.resolve(__dirname, '../../uploads/')); // Destination folder
			},
			filename: (req, file, cb) => {
				cb(null, Date.now() + '_' + file.originalname); // File name
			},
			// + Date.now() + path.extname(file.originalname)
		});
	}

	static async uploadSearch(req: Request, resp: Response) {
		if (!req.file) {
			return resp
				.status(500)
				.send(ResponseHelper.generateFailureResult(ErrorCode.FILE_UPLOAD_ERROR, 'file upload error'));
		}
		logger.info(`${req.file.filename} uploaded to ${path.resolve(__dirname, '../../uploads/')}`);

		const filename = req.file.filename;
		const ext = filename.substring(filename.lastIndexOf('.') + 1, filename.length);
		if (ext.toLowerCase() != 'jpg' && ext.toLowerCase() != 'png') {
			return resp
				.status(400)
				.send(
					ResponseHelper.generateFailureResult(
						ErrorCode.EXTENTION_NOT_SUPPORTED,
						'Only jpg and png files are supported'
					)
				);
		}

		const remoteUrl = await uploadToGcs(`${path.resolve(__dirname, '../../uploads/')}/${filename}`, filename);
		logger.log(remoteUrl);

		// const recomendations:{score: number, productId:string}[] = await getVisionSimilars(filename)
		return resp.status(200).send(ResponseHelper.generateSuccessResult(filename));
		// recomendations.forEach(r => {
		// 	logger.log(`${r.score}: ${r.productId}`)
		// })
	}

	static async getSimilarProducts(req: Request, resp: Response) {
		const { filename } = req.body;
		console.log(req.body);
		logger.log(filename);
		if (!filename || filename == 'undefined') {
			return resp.redirect('/whatsnew');
		}
		const similars: { score: number; productId: string }[] = await getVisionSimilars(filename);
		logger.log(`searching for similar products, ${similars.length} found.`);
		if (similars.length < 1) {
			return;
		}

		let productsArr = new Array();
		for (let i = 0; i < similars.length; i++) {
			const productId = similars[i].productId.split('__')[0];
			const colorId = similars[i].productId.split('__')[1];
			const url = `${process.env.ITLAB_API_BASE_URL}/product/${productId}?mykey=${process.env.ITLAB_API_KEY}`;
			const response = await axios.get(url);
			if (response.status != 200) {
				logger.info(`${productId} not found`);
				continue;
			}
			const productJson = response.data.rs;
			productJson.colorId = colorId;
			productJson.score = similars[i].score;
			productsArr.push(productJson);
		}
		return resp.status(200).send(
			ResponseHelper.generateSuccessResult({
				uploadedImage: `${process.env.GOOGLE_STORAGE_UPLOAD_REMOTE_BASE}/${process.env.GOOGLE_STORAGE_UPLOAD_BUCKET}/${filename}?authuser=2`,
				similars: productsArr,
			})
		);
	}

	static getFilters(req: Request, resp: Response) {
		const filters = fs.readFileSync(__dirname + '/../data/filters.json').toString();
		return resp.status(200).send(ResponseHelper.generateMockSuccessResult(JSON.parse(filters)));
	}

	static async searchProduct(req: Request, resp: Response) {
		const repo = gDB.getRepository(ProductJson);
		try {
			const { page = '1', pageSize = '20' } = req.query;
			const queryBuilder: SelectQueryBuilder<ProductJson> = createQueryBuilder(repo, req);
			const [products, total] = await queryBuilder.getManyAndCount();
			const productJsonArr: string[] = products.map(prod => prod.productDetail);

			const filters = JSON.parse(fs.readFileSync(__dirname + '/../data/filters.json').toString());
			// console.log(req.body)
			if (req.body && req.body.Activity) {
				const { Activity, Category, Collection, Colour, Fabric, Features, Gender, Size, SizeType, Type } =
					req.body;
				for (let i = 0; i < Gender.length; i++) {
					filters['Gender'][i].isChecked = Gender[i].isChecked;
				}
				for (let i = 0; i < Category.length; i++) {
					filters['Category'][i].isChecked = Category[i].isChecked;
				}
				for (let i = 0; i < Type.length; i++) {
					filters['Type'][i].isChecked = Type[i].isChecked;
				}
				for (let i = 0; i < Activity.length; i++) {
					filters['Activity'][i].isChecked = Activity[i].isChecked;
				}
				for (let i = 0; i < Size.length; i++) {
					filters['Size'][i].isChecked = Size[i].isChecked;
				}
				for (let i = 0; i < SizeType.length; i++) {
					filters['SizeType'][i].isChecked = SizeType[i].isChecked;
				}
				for (let i = 0; i < Collection.length; i++) {
					filters['Collection'][i].isChecked = Collection[i].isChecked;
				}
				for (let i = 0; i < Features.length; i++) {
					filters['Features'][i].isChecked = Features[i].isChecked;
				}
				for (let i = 0; i < Fabric.length; i++) {
					filters['Fabric'][i].isChecked = Fabric[i].isChecked;
				}
			}

			return resp.status(200).send(
				ResponseHelper.generateMockSuccessResult({
					filters: filters,
					pageParams: {
						totalProducts: total,
						perPage: Number(pageSize),
						curPage: Number(page),
						totalPage: Math.ceil(total / Number(pageSize)),
					},
					products: productJsonArr,
				})
			);
		} catch (err) {}
	}

	static async searchProductById(req: Request, resp: Response) {
		const { productId } = req.params;
		try {
			const product: ProductJson = await gDB.getRepository(ProductJson).findOne({
				where: { productId: productId },
			});
			return resp.status(200).send(ResponseHelper.generateMockSuccessResult(product.productDetail));
		} catch (e) {
			logger.error('Exception find orders', e);
			return resp.status(500).send(ResponseHelper.generateFailureResult(ErrorCode.DB_ERROR, e.driverError));
		}
	}
}
export default ProductController;

async function uploadToGcs(savePath: string, filename: string): Promise<string> {
	const storage = new Storage();
	const destinationPath = `${filename}`;
	await storage.bucket(process.env.GOOGLE_STORAGE_UPLOAD_BUCKET).upload(savePath, {
		destination: destinationPath,
	});
	logger.log(`Image uploaded to GCS, ${destinationPath}`);

	const remoteUrl = `${process.env.GOOGLE_STORAGE_UPLOAD_REMOTE_BASE}/${process.env.GOOGLE_STORAGE_UPLOAD_BUCKET}/${filename}`;
	return remoteUrl;
}

async function getVisionSimilars(filename: string) {
	const productSetPath = client.productSetPath(projectId, location, productSetId);
	//gs://searching-uploads/1724447160808_LW5FN6S_067584_1.png
	const request = {
		image: {
			source: {
				gcsImageUri: `gs://${process.env.GOOGLE_STORAGE_UPLOAD_BUCKET}/${filename}`,
			},
		},
		features: [{ type: Type.PRODUCT_SEARCH }],
		imageContext: {
			productSearchParams: {
				productSet: productSetPath,
				productCategories: ['apparel'],
				filter: '',
			},
		},
	};
	try {
		const [response] = await imageAnnotatorClient.batchAnnotateImages({
			requests: [request],
		});
		let recomendations: { score: number; productId: string }[] = new Array();
		const results = response['responses'][0]['productSearchResults']['results'];
		results.forEach(result => {
			recomendations.push({
				score: result.score,
				productId: result['product'].name.split('/')[5],
			});
		});
		return recomendations;
	} catch (e) {
		logger.error(e);
	}
}

function createQueryBuilder(repo: Repository<ProductJson>, req: Request): SelectQueryBuilder<ProductJson> {
	let queryBuilder: SelectQueryBuilder<ProductJson> = repo.createQueryBuilder('productJson');

	const { pageNo = '1', pageSize = '10' } = req.query;
	queryBuilder.skip((Number(pageNo) - 1) * Number(pageSize));
	queryBuilder.take(Number(pageSize));

	return queryBuilder;
}
