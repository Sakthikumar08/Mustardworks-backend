const { verifyToken } = require("../config/jwt")
const User = require("../models/User")
const { catchAsync, errorResponse } = require("../utils/helpers")

exports.protect = catchAsync(async (req, res, next) => {
  let token

  // Check if token exists in cookies
  if (req.cookies.jwt) {
    token = req.cookies.jwt
  }

  if (!token) {
    return next(errorResponse("You are not logged in! Please log in to get access.", 401))
  }

  // Verify token
  const decoded = verifyToken(token)

  // Check if user still exists
  const currentUser = await User.findById(decoded.id)
  if (!currentUser) {
    return next(errorResponse("The user belonging to this token no longer exists.", 401))
  }

  // Check if user changed password after the token was issued
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(errorResponse("User recently changed password! Please log in again.", 401))
  }

  req.user = currentUser
  next()
})

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(errorResponse("You do not have permission to perform this action", 403))
    }
    next()
  }
}
