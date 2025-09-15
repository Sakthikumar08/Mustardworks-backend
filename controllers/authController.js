const User = require("../models/User")
const { generateToken } = require("../config/jwt")
const { catchAsync, errorResponse } = require("../utils/helpers")

const createSendToken = (user, statusCode, res, rememberMe = false) => {
  const token = generateToken(user._id)

  // Calculate cookie expiration
  const cookieExpire = rememberMe ? 30 : Number.parseInt(process.env.JWT_COOKIE_EXPIRE) || 7 // 30 days if remember me, otherwise use env var

  const cookieOptions = {
    expires: new Date(Date.now() + cookieExpire * 24 * 60 * 60 * 1000),
    httpOnly: true,
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  }

  if (process.env.NODE_ENV === "production") {
    cookieOptions.secure = true
  }

  res.cookie("jwt", token, cookieOptions)

  // Remove password from output
  user.password = undefined
  user.passwordChangedAt = undefined

  res.status(statusCode).json({
    status: "success",
    data: {
      user,
    },
  })
}

// Register a new user
exports.register = catchAsync(async (req, res, next) => {
  const { firstName, lastName, email, password, confirmPassword } = req.body

  if (confirmPassword && password !== confirmPassword) {
    return next(errorResponse("Passwords do not match", 400))
  }

  // Check if user already exists
  const existingUser = await User.findOne({ email })
  if (existingUser) {
    return next(errorResponse("User already exists with this email", 400))
  }

  // Create new user
  const user = await User.create({
    firstName,
    lastName,
    email,
    password,
  })

  // Auto-login on successful registration
  createSendToken(user, 201, res)
})

// In your login function in authController.js
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Check if user exists and password is correct
    const user = await User.findOne({ email }).select('+password');
    
    if (!user || !(await user.correctPassword(password, user.password))) {
      return res.status(401).json({
        success: false,
        message: 'Incorrect email or password'
      });
    }
    
    // Generate token
    const token = generateToken(user._id);
    
    // Remove password from output
    user.password = undefined;
    
    // Send token in response body (not just as cookie)
    res.status(200).json({
      success: true,
      token, // Make sure this is included
      data: user,
      message: 'Logged in successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
// Logout user
exports.logout = (req, res) => {
  res.cookie("jwt", "loggedout", {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  })

  res.status(200).json({
    status: "success",
    message: "Logged out successfully",
  })
}

// Get current user
exports.getMe = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user._id)

  res.status(200).json({
    status: "success",
    data: {
      user,
    },
  })
})

// Update password
exports.updatePassword = catchAsync(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body

  // Get user from collection
  const user = await User.findById(req.user._id).select("+password")

  // Check if current password is correct
  if (!(await user.correctPassword(currentPassword, user.password))) {
    return next(errorResponse("Your current password is incorrect", 401))
  }

  // Update password
  user.password = newPassword
  await user.save()

  // Log user in with new password (send new JWT)
  createSendToken(user, 200, res)
})
