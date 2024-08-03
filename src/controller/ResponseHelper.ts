class ResponseHelper {
  static generateSuccessResult(data: any) {
    return {
      status: "success",
      data: data,
    };
  }

  static generateFailureResult(error: any) {
    return {
      status: "failed",
      error: error,
    };
  }
}

export default ResponseHelper;
