import { DataSource, DataSourceOptions } from 'typeorm';
import * as path from 'path';
import { logger } from './LoggerHelper';

if (!process.env.PORT) {
	require('dotenv-flow').config();
}

// alert only
const entityPath =
	process.env.ENV === 'production'
		? path.join(__dirname + '/../../build/src/entity/**/*.entity.js')
		: path.join(__dirname + '/../src/entity/**/*.entity.ts');
logger.info(`Env is: --> ${process.env.NODE_ENV}`);
logger.info(`Server Path--> ${__dirname}`);
logger.info(`Entity Path: --> ${entityPath}`);
logger.info(
	`DB Info: --> mysql://${process.env.MYSQL_USERNAME}:*****@${process.env.MYSQL_DB_HOST}:${process.env.MYSQL_DB_PORT}/${process.env.MYSQL_DB_NAME}`
);

// logger.info(`Seed info: ${process.env.TYPEORM_SEEDING_SEEDS}`)

const options: DataSourceOptions = {
	type: 'mysql',
	host: process.env.MYSQL_DB_HOST,
	port: Number(process.env.MYSQL_DB_PORT),
	username: process.env.MYSQL_USERNAME,
	password: process.env.MYSQL_PASSWORD,
	database: process.env.MYSQL_DB_NAME,
	synchronize: process.env.MYSQL_DB_SYNC.toLowerCase() === 'true',
	extra: { connectionLimit: 50 },
	logging: true,
	maxQueryExecutionTime: 3000, //logging query executing 1 second

	// "keepConnectionAlive":true,
	// "[__for typeORM seeding": null,

	// "__for typeORM seeding": null,
	entities: [entityPath],
	migrations: [process.env.MYSQL_MIGRATIONS],
	subscribers: [process.env.MYSQL_SUBSCRIBERS],
	// seeds: [
	//     //process.env.TYPEORM_SEEDING_SEEDS
	//     // MainSeed
	// ],
	// "cli": {
	//     "entitiesDir": process.env.MYSQL_ENTITIESDIR,
	//     "migrationsDir": process.env.MYSQL_MIGRATIONSDIR,
	//     "subscribersDir": process.env.MYSQL_SUBSCRIBERSDIR
	// }
};
const gDB = new DataSource(options);
export default gDB;
