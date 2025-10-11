const { verifyToken } = require("../config/jwt")
const User = require("../models/User")
const { catchAsync } = require("../utils/helpers")

const protect = catchAsync(async (req, res, next) => {
  let token

  console.log(`[AUTH] ${req.method} ${req.originalUrl} - Environment: ${process.env.NODE_ENV}`)
  
  // Check Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1]
    console.log("[AUTH] Token from Authorization header:", token ? `${token.substring(0, 20)}...` : 'No token')
  } 
  // Check cookie
  else if (req.cookies.jwt) {
    token = req.cookies.jwt
    console.log("[AUTH] Token from cookie:", token ? `${token.substring(0, 20)}...` : 'No token')
  }
  // Check x-auth-token header (common alternative)
  else if (req.headers['x-auth-token']) {
    token = req.headers['x-auth-token']
    console.log("[AUTH] Token from x-auth-token header:", token ? `${token.substring(0, 20)}...` : 'No token')
  }

  if (!token) {
    console.log("[AUTH] No token found in request")
    return res.status(401).json({
      success: false,
      message: "You are not logged in! Please log in to get access.",
    })
  }

  try {
    console.log("[AUTH] Verifying token...")
    
    // Verify token
    const decoded = verifyToken(token)
    console.log("[AUTH] Token decoded successfully. User ID:", decoded.id)

    // Check if user still exists
    const currentUser = await User.findById(decoded.id)
    if (!currentUser) {
      console.log("[AUTH] User not found for ID:", decoded.id)
      return res.status(401).json({
        success: false,
        message: "The user belonging to this token no longer exists.",
      })
    }

    console.log("[AUTH] User found:", { 
      id: currentUser._id, 
      email: currentUser.email, 
      role: currentUser.role 
    })

    // Check if user changed password after the token was issued
    if (currentUser.changedPasswordAfter && currentUser.changedPasswordAfter(decoded.iat)) {
      console.log("[AUTH] Password was changed after token was issued")
      return res.status(401).json({
        success: false,
        message: "User recently changed password! Please log in again.",
      })
    }

    req.user = currentUser
    console.log("[AUTH] Authentication successful for user:", currentUser.email)
    next()
  } catch (error) {
    console.error("[AUTH] Token verification error:", error.message)
    
    // Provide more specific error messages
    let errorMessage = "Invalid token. Please log in again."
    
    if (error.name === 'TokenExpiredError') {
      errorMessage = "Your token has expired. Please log in again."
    } else if (error.name === 'JsonWebTokenError') {
      errorMessage = "Invalid token. Please log in again."
    } else if (error.message.includes('JWT_SECRET')) {
      errorMessage = "Server configuration error. Please contact administrator."
      console.error("❌ [AUTH] CRITICAL: JWT_SECRET configuration error")
    }
    
    return res.status(401).json({
      success: false,
      message: errorMessage,
    })
  }
})

const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "You must be logged in to access this resource",
      })
    }
    
    if (!roles.includes(req.user.role)) {
      console.log(`[AUTH] Access denied for role: ${req.user.role}, required: ${roles.join(', ')}`)
      return res.status(403).json({
        success: false,
        message: "You do not have permission to perform this action",
      })
    }
    
    console.log(`[AUTH] Access granted for role: ${req.user.role}`)
    next()
  }
}

const adminOnly = restrictTo("admin")

module.exports = {
  protect,
  restrictTo,
  adminOnly,
}