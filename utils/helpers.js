const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next)
  }
}

const successResponse = (res, statusCode, message, data = null) => {
  const response = {
    success: true,
    message,
  }

  if (data) {
    response.data = data
  }

  return res.status(statusCode).json(response)
}

class AppError extends Error {
  constructor(message, statusCode) {
    super(message)
    this.statusCode = statusCode
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error"
    this.isOperational = true

    Error.captureStackTrace(this, this.constructor)
  }
}

const errorResponse = (message, statusCode) => {
  return new AppError(message, statusCode)
}

module.exports = {
  catchAsync,
  errorResponse,
  successResponse,
  AppError,
}
