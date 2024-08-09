import * as log4js from 'log4js';

const logPattern = '%d %[[%p]%]\t [%f{2}:%l %M] %m';
log4js.configure({
	appenders: {
		console: {
			type: 'console',
			layout: {
				type: 'pattern',
				pattern: logPattern,
			},
		},
		file: {
			type: 'dateFile',
			filename: 'logs/lulu-backend.log',
			compress: true,
			keepFileExt: true,
			layout: {
				type: 'pattern',
				pattern: logPattern,
			},
		},
	},
	categories: {
		default: {
			appenders: ['console', 'file'],
			level: 'debug',
			enableCallStack: true,
		},
	},
});

export const logger = log4js.getLogger();
logger.level = 'debug';
