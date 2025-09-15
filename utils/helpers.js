const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next)
  }
}

const errorResponse = (message, statusCode) => {
  const error = new Error(message)
  error.statusCode = statusCode
  return error
}

module.exports = {
  catchAsync,
  errorResponse,
}
