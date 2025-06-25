import { ErrorCode } from '../common/ErrorCode';

class ResponseHelper {
	static generateSuccessResult(data: any) {
		return {
			status: 'success',
			data: data,
		};
	}

	static generateFailureResult(errorCode: ErrorCode, error: any) {
		return {
			status: 'failed',
			error: {
				errorCode: errorCode,
				message: error,
			},
		};
	}
	static generateFailureResultWithError(error: { errorCode: ErrorCode; message: any }) {
		return {
			status: 'failed',
			error: error,
		};
	}

	static generatePaginationParams(pageNo: number, pageSize: number, total: number, currentTotal: number): any {
		return {
			pageNo: pageNo,
			pageSize: pageSize,
			total: total,
			currentTotal: currentTotal,
		};
	}

	static generateMockSuccessResult(data: any) {
		return {
			status: 'success',
			message: 'mock response',
			rs: data,
		};
	}
}

export default ResponseHelper;
