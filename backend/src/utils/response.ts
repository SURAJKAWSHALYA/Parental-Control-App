export const sendSuccess = (res: any, data: any, message: string = 'Operation successful', statusCode: number = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

export const sendError = (res: any, message: string = 'Something went wrong', errorCode: string = 'SERVER_ERROR', statusCode: number = 500) => {
  return res.status(statusCode).json({
    success: false,
    message,
    errorCode,
  });
};
