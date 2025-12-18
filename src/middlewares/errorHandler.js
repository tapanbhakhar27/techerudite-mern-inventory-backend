const { AppErrorHandler } = require("../common/errorHandler.util");

const globalErrorHandler = (err, req, res, next) => {
  const errorResponse = AppErrorHandler.handle(err, "GlobalErrorHandler");

  res.status(errorResponse.statusCode).json({
    success: errorResponse.success,
    message: errorResponse.message,
    statusCode: errorResponse.statusCode,
    ...(process.env.NODE_ENV === "development" && {
      error: {
        name: err.name,
        message: err.message,
        stack: err.stack,
      },
    }),
  });
};

module.exports = globalErrorHandler;
