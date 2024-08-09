import { NextFunction, Request, Response } from 'express';
import * as jwt from 'jsonwebtoken';
import { logger } from '../LoggerHelper';
import ResponseHelper from '../controller/ResponseHelper';
import { ErrorCode } from '../common/ErrorCode';

export const validateJwt = (req: Request, resp: Response, next: NextFunction) => {
	const authorization = req.header('Authorization');
	if (!authorization) {
		return resp
			.status(403)
			.send(
				ResponseHelper.generateFailureResult(
					ErrorCode.NO_TOKEN_PROVIDED,
					'Authorization header is missing, access denied'
				)
			);
	}
	if (authorization.split(' ').length != 2 || authorization.indexOf('Bearer ') == -1) {
		return resp
			.status(401)
			.send(
				ResponseHelper.generateFailureResult(
					ErrorCode.TOKEN_INVALID,
					'Authorization token invalid, access denied. '
				)
			);
	}

	const token = authorization.split(' ')[1];
	try {
		jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
			if (err) {
				if (err.name == 'TokenExpiredError') {
					return resp
						.status(401)
						.send(ResponseHelper.generateFailureResult(ErrorCode.TOKEN_EXPIRED, 'Token expired'));
				}
				return resp
					.status(403)
					.send(
						ResponseHelper.generateFailureResult(
							ErrorCode.TOKEN_INVALID,
							'Authorization token not verified, access denied. '
						)
					);
			}
			const user = decoded;
			req['user'] = decoded;
			logger.info('Authorization token verified', decoded);
			next();
		});
	} catch (err) {
		logger.error('Exception in jwt token verify!!', err);
		return resp
			.status(401)
			.send(
				ResponseHelper.generateFailureResult(
					ErrorCode.TOKEN_INVALID,
					'Authorization token invalid, access denied. '
				)
			);
	}
};

export const validateAdminJwt = (req: Request, resp: Response, next: NextFunction) => {
	const authorization = req.header('Authorization');
	if (!authorization) {
		return resp
			.status(403)
			.send(
				ResponseHelper.generateFailureResult(
					ErrorCode.NO_TOKEN_PROVIDED,
					'Authorization header is missing, access denied'
				)
			);
	}
	if (authorization.split(' ').length != 2 || authorization.indexOf('Bearer ') == -1) {
		return resp
			.status(401)
			.send(
				ResponseHelper.generateFailureResult(
					ErrorCode.TOKEN_INVALID,
					'Authorization token invalid, access denied. '
				)
			);
	}

	const token = authorization.split(' ')[1];
	try {
		jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
			if (err) {
				if (err.name == 'TokenExpiredError') {
					return resp
						.status(401)
						.send(ResponseHelper.generateFailureResult(ErrorCode.TOKEN_EXPIRED, 'Token expired'));
				}
				return resp
					.status(403)
					.send(
						ResponseHelper.generateFailureResult(
							ErrorCode.TOKEN_INVALID,
							'Authorization token not verified, access denied. '
						)
					);
			}
			const user = decoded;
			if (user['isAdmin'] == false) {
				return resp
					.status(403)
					.send(
						ResponseHelper.generateFailureResult(
							ErrorCode.NOT_ADMIN,
							'only accessible to admin, access denied. '
						)
					);
			}
			req['user'] = decoded;
			logger.info('Authorization token verified', decoded);
			next();
		});
	} catch (err) {
		logger.error('Exception in jwt token verify!!', err);
		return resp
			.status(401)
			.send(
				ResponseHelper.generateFailureResult(
					ErrorCode.TOKEN_INVALID,
					'Authorization token invalid, access denied. '
				)
			);
	}
};
