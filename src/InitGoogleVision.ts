import vision = require('@google-cloud/vision');
import { Product } from './entity/Product.entity';
import gDB from './InitDataSource';
import { logger } from './LoggerHelper';
import * as fs from 'node:fs';
import axios from 'axios';
import path = require('node:path');
import { Storage } from '@google-cloud/storage';
import { google } from '@google-cloud/vision/build/protos/protos';
import IProduct = google.cloud.vision.v1.IProduct;
import IEmpty = google.protobuf.IEmpty;
import IReferenceImage = google.cloud.vision.v1.IReferenceImage;
import Type = google.cloud.vision.v1.Feature.Type;

if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
	require('dotenv-flow').config();
}

const client = new vision.ProductSearchClient();
const imageAnnotatorClient = new vision.ImageAnnotatorClient();

const projectId = process.env.GOOGLE_PROJECT_ID;
const location = process.env.GOOGLE_LOCATION;
const productSetId = 'lulu-product-set';
const productSetDisplayName = 'LuLu Product Set';
const locationPath = client.locationPath(projectId, location);

async function createProductSet() {
	const productSet = {
		displayName: productSetDisplayName,
	};

	const request = {
		parent: locationPath,
		productSet: productSet,
		productSetId: productSetId,
	};

	const [createdProductSet] = await client.createProductSet(request);
	logger.log(`Product Set name: ${createdProductSet.name}`);
}

async function getProductsFromDB(): Promise<Product[]> {
	await gDB.initialize();
	return await gDB.getRepository(Product).find({});
}

async function createProduct(productFromDB: Product): Promise<IProduct> {
	const product = {
		displayName: productFromDB.fullnameWithColor,
		productCategory: 'apparel',
	};

	const request = {
		parent: locationPath,
		product: product,
		productId: productFromDB.productId + '__' + productFromDB.colorId,
	};

	const [createdProduct] = await client.createProduct(request);

	return createdProduct;
}

async function addProductToSet(productFromDB: Product): Promise<IEmpty> {
	const productPath = client.productPath(projectId, location, productFromDB.productId + '__' + productFromDB.colorId);
	const productSetPath = client.productSetPath(projectId, location, productSetId);
	const addToSetRequest = {
		name: productSetPath,
		product: productPath,
	};

	return await client.addProductToProductSet(addToSetRequest);
}

async function createProductImageReference(productFromDB: Product, imageUrl: string): Promise<IReferenceImage> {
	const filename = imageUrl.substring(imageUrl.lastIndexOf('/') + 1, imageUrl.length);
	const formattedParent = client.productPath(
		projectId,
		location,
		productFromDB.productId + '__' + productFromDB.colorId
	);
	const referenceImage = {
		uri: `gs://lulu-product-images/${productFromDB.productId}/${productFromDB.colorId}/${filename}`,
	};
	const request = {
		parent: formattedParent,
		referenceImage: referenceImage,
		referenceImageId: filename,
	};

	const [response] = await client.createReferenceImage(request);
	return response;
}

//gs://lulu-product-images/prod10080329/0001/prod10080329_0001_img0.jpg
async function createProductIncludingAddToSetAndAddReferenceImage() {
	const productsFromDB = await getProductsFromDB();
	for (let i = 0; i < productsFromDB.length; i++) {
		if (i < 668) {
			continue;
		}
		const createdProduct = await createProduct(productsFromDB[i]);
		logger.log(`${i}. Product created name: ${createdProduct.name}`);

		await addProductToSet(productsFromDB[i]);
		logger.log(`${i}. Product ${createdProduct.name} added to product set.`);

		const images = productsFromDB[i].imageUrls.split(' | ');
		for (let j = 0; j < images.length; j++) {
			const refImg: IReferenceImage = await createProductImageReference(productsFromDB[i], images[j]);
			logger.log(`${i}.${j}-reference image created. ${refImg.uri}`);
		}
	}
}

async function deleteProduct(productId: string) {
	const productPath = client.productPath(projectId, location, productId);

	await client.deleteProduct({ name: productPath });
}

async function deleteAllProducts() {
	const productsFromDB = await getProductsFromDB();
	for (let i = 0; i < productsFromDB.length; i++) {
		await deleteProduct(productsFromDB[i].productId + '__' + productsFromDB[i].colorId);
		logger.log(`${i}. Product ${productsFromDB[i].productId} deleted.`);
	}
}

async function downloadAndUploadAllImages() {
	const productsFromDB = await getProductsFromDB();
	for (let i = 0; i < productsFromDB.length; i++) {
		const imageUrls: string[] = productsFromDB[i].imageUrls.split(' | ');
		for (let j = 0; j < imageUrls.length; j++) {
			const url = imageUrls[j];
			const filename = imageUrls[j].substring(imageUrls[j].lastIndexOf('/') + 1, imageUrls[j].length);
			const savePath = path.resolve(
				__dirname,
				'../downloaded_images/',
				productsFromDB[i].productId,
				productsFromDB[i].colorId,
				filename
			);

			await downloadImage(url, savePath);
			logger.log(`${i}.${j}-Image downloaded successfully, ${savePath}`);

			const storage = new Storage();
			const destinationPath = `${productsFromDB[i].productId}/${productsFromDB[i].colorId}/${filename}`;
			await storage.bucket('lulu-product-images').upload(savePath, {
				destination: destinationPath,
			});
			logger.log(`${i}.${j}-Image uploaded to GCS, ${destinationPath}`);
		}
	}
}

async function downloadImage(url: string, savePath: string): Promise<void> {
	ensureDirectoryExists(savePath);
	const writer = fs.createWriteStream(savePath);

	const response = await axios({
		url,
		method: 'GET',
		responseType: 'stream',
	});

	response.data.pipe(writer);

	return new Promise((resolve, reject) => {
		writer.on('finish', resolve);
		writer.on('error', reject);
	});
}

function ensureDirectoryExists(filePath: string) {
	const dir = path.dirname(filePath);
	if (!fs.existsSync(dir)) {
		fs.mkdirSync(dir, { recursive: true });
	}
}

async function getSimilarProductsFile() {
	const productSetPath = client.productSetPath(projectId, location, productSetId);
	const filePath = path.resolve(
		__dirname,
		'../downloaded_images',
		'prod11190042',
		'48440',
		'prod11190042_48440_img5.jpg'
	);
	const content = fs.readFileSync(filePath, 'base64');
	const request = {
		image: { content: content },
		features: [{ type: Type.PRODUCT_SEARCH }],
		imageContext: {
			productSearchParams: {
				productSet: productSetPath,
				productCategories: ['apparel'],
				filter: '',
			},
		},
	};
	const [response] = await imageAnnotatorClient.batchAnnotateImages({
		requests: [request],
	});

	logger.log('Search Image:', filePath);
	const results = response['responses'][0]['productSearchResults']['results'];
	logger.log('\nSimilar product information:');
	results.forEach(result => {
		logger.log('score:', result.score);
		logger.log('Product id:', result['product'].name.split('/')[5]);
		logger.log('Product display name:', result['product'].displayName);
		logger.log('Product description:', result['product'].description);
		logger.log('Product category:', result['product'].productCategory);
	});
}

// createProductSet();
// deleteAllProducts()
// createProductIncludingAddToSetAndAddReferenceImage()
getSimilarProductsFile();
