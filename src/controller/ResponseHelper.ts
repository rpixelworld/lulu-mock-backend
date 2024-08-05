import {ErrorCode} from "../common/ErrorCode";

class ResponseHelper {
  static generateSuccessResult(data: any) {
    return {
      status: "success",
      data: data,
    };
  }

  static generateFailureResult(errorCode: ErrorCode, error: any) {
    return {
      status: "failed",
      errorCode: errorCode,
      error: error,
    };
  }
}

export default ResponseHelper;
