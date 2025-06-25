import gDB from './InitDataSource';
import { Province } from './common/Province';
import { logger } from './LoggerHelper';
import { TaxMaster } from './entity/TaxMaster.entity';
import './products.json';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { Inventory } from './entity/Inventory.entity';
import { Product } from './entity/Product.entity';
import { ProductJson } from './entity/ProductJson.entity';

const provinceTaxes = [
	new TaxMaster(Province.AB, 5, null, null),
	new TaxMaster(Province.BC, 5, 7, null),
	new TaxMaster(Province.MB, 5, 7, null),
	new TaxMaster(Province.NB, null, null, 5),
	new TaxMaster(Province.NL, null, null, 15),
	new TaxMaster(Province.NS, null, null, 15),
	new TaxMaster(Province.ON, null, null, 13),
	new TaxMaster(Province.PE, null, null, 15),
	new TaxMaster(Province.QC, 5, 9.975, null),
	new TaxMaster(Province.SK, 5, 6, null),
];

const getRandomInt = (max: number) => {
	return Math.floor(Math.random() * max);
};

export const initTaxMaster = async () => {
	const queryRunner = gDB.createQueryRunner();
	await queryRunner.connect();
	await queryRunner.startTransaction();
	logger.info('db connection created and transaction started');
	try {
		logger.info(`saving ${provinceTaxes.length} records to tax master`);
		for (let i = 0; i < provinceTaxes.length; i++) {
			await queryRunner.manager.save(provinceTaxes[i]);
		}

		await queryRunner.commitTransaction();
		logger.info(`transaction committed`);
	} catch (e) {
		logger.error(`Exception saving tax master, rollback`, e);
		await queryRunner.rollbackTransaction();
	} finally {
		await queryRunner.release();
		logger.info(`connection releaed`);
	}
};

const saveInventory = async (inventoryArr: Inventory[]) => {
	const queryRunner = gDB.createQueryRunner();
	await queryRunner.connect();
	await queryRunner.startTransaction();
	logger.info('db connection created and transaction started');
	try {
		logger.info(`saving ${inventoryArr.length} records to inventory`);
		for (let i = 0; i < inventoryArr.length; i++) {
			await queryRunner.manager.save(inventoryArr[i]);
		}

		await queryRunner.commitTransaction();
		logger.info(`transaction committed`);
	} catch (e) {
		logger.error(`Exception saving inventory, rollback`, e);
		await queryRunner.rollbackTransaction();
	} finally {
		await queryRunner.release();
		logger.info(`connection releaed`);
	}
};

export const initInventory = async () => {
	const products: any[] = loadProductsfromJson();
	logger.info(`Initializing random inventory for ${products.length} products`);

	let productIdsArr: string[] = new Array();
	for (let i = 0; i < products.length; i++) {
		let product: any = products[i];
		let productId: string = product.productId;
		if (productIdsArr.includes(productId)) {
			logger.info(`${productId} is a duplicate product, skip`);
			continue;
		}
		productIdsArr.push(productId);

		let colorsArr: string[] = new Array();
		for (let j = 0; j < product.swatches.length; j++) {
			colorsArr.push(product.swatches[j].colorId);
		}
		let sizesArr: string[] = product.sizes[0].details;
		if (sizesArr.length == 0) {
			sizesArr.push('ONE SIZE');
		}

		let inventoryArr: Inventory[] = new Array();
		for (let k = 0; k < colorsArr.length; k++) {
			for (let j = 0; j < sizesArr.length; j++) {
				inventoryArr.push(new Inventory(productId, colorsArr[k], sizesArr[j], getRandomInt(20)));
			}
		}

		await saveInventory(inventoryArr).then(() => {
			logger.info(`random initializing inventory for ${productId}, ${inventoryArr.length} records inserted`);
		});
	}
	logger.info(`random inventory for ${productIdsArr.length} products completed`);
};

function loadProductsfromJson(): any[] {
	const jsonData = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'products.json'), 'utf8'));
	return jsonData.products;
}

function loadMockProductsfromJson(i): any[] {
	const jsonData = JSON.parse(fs.readFileSync(path.resolve(__dirname, `mock_allproducts_${i}.json`), 'utf8'));
	return jsonData.rs.products;
}

export const initProduct = async () => {
	const products: any[] = loadProductsfromJson();

	let productIdsArr: string[] = new Array();

	for (let i = 0; i < products.length; i++) {
		let product: any = products[i];
		let productId: string = product.productId;
		if (productIdsArr.includes(productId)) {
			logger.info(`${productId} is a duplicate product, skip`);
			continue;
		}
		if (!product.name || product.name.trim() == '') {
			logger.info(`${productId} empty product name, skip`);
		}
		productIdsArr.push(productId);

		let productArr: Product[] = new Array();
		for (let j = 0; j < product.images.length; j++) {
			let prodEntity = new Product(product.productId, product.images[j].colorId);
			prodEntity.productName = product.name;
			prodEntity.colorAlt = product.images[j].colorAlt;
			prodEntity.fullnameWithColor = product.images[j].mainCarousel.alt;
			prodEntity.imageUrls = product.images[j].mainCarousel.media;

			productArr.push(prodEntity);
		}
		await saveProduct(productArr).then(() => {
			logger.info(`initializing products ${productArr.length} records inserted`);
		});

		productArr = new Array();
	}
	logger.info(`initializing ${productIdsArr.length} products completed`);
};

export const initProductJson = async () => {
	const products: any[] = loadMockProductsfromJson(5);
	// console.log(products[0])
	let productIdsArr: string[] = [];
	let productJsonArr: ProductJson[] = [];

	for (let i = 0; i < 50; i++) {
		let product: any = products[i];
		if (!product || !product.name || product.name.trim() == '') {
			continue;
		}
		let productId: string = product.productId;
		if (productIdsArr.includes(productId)) {
			logger.info(`${productId} is a duplicate product, skip`);
			continue;
		}
		if (!product.name || product.name.trim() == '') {
			logger.info(`${productId} empty product name, skip`);
		}
		productIdsArr.push(productId);
		productJsonArr.push(new ProductJson(product.productId, JSON.stringify(product)));

		await saveProductJson(productJsonArr).then(() => {
			logger.info(`initializing product_json ${productJsonArr.length} records inserted`);
		});
	}

	// console.log(productJsonArr[0])
	logger.info(`initializing ${productIdsArr.length} products completed`);
};

const saveProduct = async (productArr: Product[]) => {
	const queryRunner = gDB.createQueryRunner();
	await queryRunner.connect();
	await queryRunner.startTransaction();
	logger.info('db connection created and transaction started');
	try {
		logger.info(`saving ${productArr.length} records to inventory`);
		for (let i = 0; i < productArr.length; i++) {
			await queryRunner.manager.save(productArr[i]);
		}

		await queryRunner.commitTransaction();
		logger.info(`transaction committed`);
	} catch (e) {
		logger.error(`Exception saving product, rollback`, e);
		await queryRunner.rollbackTransaction();
	} finally {
		await queryRunner.release();
		logger.info(`connection releaed`);
	}
};

const saveProductJson = async (productJsonArr: ProductJson[]) => {
	const queryRunner = gDB.createQueryRunner();
	await queryRunner.connect();
	await queryRunner.startTransaction();
	logger.info('db connection created and transaction started');
	try {
		logger.info(`saving ${productJsonArr.length} records to tbl_product_json`);
		for (let i = 0; i < productJsonArr.length; i++) {
			await queryRunner.manager.save(productJsonArr[i]);
		}

		await queryRunner.commitTransaction();
		logger.info(`transaction committed`);
	} catch (e) {
		logger.error(`Exception saving product, rollback`, e);
		await queryRunner.rollbackTransaction();
	} finally {
		await queryRunner.release();
		logger.info(`connection released`);
	}
};

async function execute() {
	await gDB.initialize();
	// await initTaxMaster();
	// await initInventory();
	// await initProduct();
	// await initProductJson();
}

// execute().then(() => {
// 	logger.info('data initialization completed!!');
// 	process.exit(0);
// });
