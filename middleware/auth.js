const { verifyToken } = require("../config/jwt")
const User = require("../models/User")
const { catchAsync } = require("../utils/helpers")

exports.protect = catchAsync(async (req, res, next) => {
  let token

  // Check if token exists in cookies
  if (req.cookies.jwt) {
    token = req.cookies.jwt
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "You are not logged in! Please log in to get access.",
    })
  }

  try {
    // Verify token
    const decoded = verifyToken(token)

    // Check if user still exists
    const currentUser = await User.findById(decoded.id)
    if (!currentUser) {
      return res.status(401).json({
        success: false,
        message: "The user belonging to this token no longer exists.",
      })
    }

    // Check if user changed password after the token was issued
    if (currentUser.changedPasswordAfter(decoded.iat)) {
      return res.status(401).json({
        success: false,
        message: "User recently changed password! Please log in again.",
      })
    }

    req.user = currentUser
    next()
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid token. Please log in again.",
    })
  }
})

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to perform this action",
      })
    }
    next()
  }
}
