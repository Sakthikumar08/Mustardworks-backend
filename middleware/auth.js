const { verifyToken } = require("../config/jwt")
const User = require("../models/User")
const { catchAsync } = require("../utils/helpers")

const protect = catchAsync(async (req, res, next) => {
  let token

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1]
  } else if (req.cookies.jwt) {
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

    console.log("[v0] Token decoded:", { id: decoded.id, iat: decoded.iat })
    console.log("[v0] User found:", { id: currentUser._id, email: currentUser.email, role: currentUser.role })
    console.log("[v0] Password changed at:", currentUser.passwordChangedAt)

    // Check if user changed password after the token was issued
    if (currentUser.changedPasswordAfter(decoded.iat)) {
      console.log("[v0] Password was changed after token was issued")
      return res.status(401).json({
        success: false,
        message: "User recently changed password! Please log in again.",
      })
    }

    req.user = currentUser
    next()
  } catch (error) {
    console.log("[v0] Token verification error:", error.message)
    return res.status(401).json({
      success: false,
      message: "Invalid token. Please log in again.",
    })
  }
})

const restrictTo = (...roles) => {
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

const adminOnly = restrictTo("admin")

module.exports = {
  protect,
  restrictTo,
  adminOnly,
}
