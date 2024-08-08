import 'reflect-metadata';

import 'reflect-metadata';
import * as express from 'express';
import * as bodyParser from 'body-parser';
import gDB from './InitDataSource';
const cors = require('cors');
import rootRouter from './route';
import { logger } from './LoggerHelper';

const MAX_UPLOAD_FILE_SIZE = 50;
const SERVER_PORT = process.env.PORT;

const startServer = async () => {
	try {
		await gDB.initialize();
		logger.info('Data Source has been initialized!');

		// create express app
		const app = express(); // http server
		app.disable('x-powered-by');
		app.use(bodyParser.json());
		app.use(cors());
		app.use(rootRouter);

		// setup express app here
		// ...

		// start express server
		const server = app.listen(SERVER_PORT);

		// socket io
		logger.info(`NODE_ENV is: ${process.env.NODE_ENV}. Express server has started on port ${SERVER_PORT}.\n`);
	} catch (err) {
		logger.error('Error Server Initializing...', err);
		process.exit(1);
	}
};

startServer();
