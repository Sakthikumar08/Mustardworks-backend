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

// Admin-only login endpoint
exports.adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body

    console.log("[v0] Admin login attempt:", { email, password: "***" })

    // Check if user exists first
    const user = await User.findOne({ email }).select("+password")
    console.log("[v0] User found:", user ? { email: user.email, role: user.role } : "No user found")

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid admin credentials - User not found",
      })
    }

    // Check if user is admin
    if (user.role !== "admin") {
      return res.status(401).json({
        success: false,
        message: "Invalid admin credentials - Not an admin user",
      })
    }

    // Check password
    const isPasswordCorrect = await user.correctPassword(password, user.password)
    console.log("[v0] Password check result:", isPasswordCorrect)

    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: "Invalid admin credentials - Incorrect password",
      })
    }

    // Generate token
    const token = generateToken(user._id)

    // Remove password from output
    user.password = undefined

    // Send token in response body
    res.status(200).json({
      success: true,
      token,
      data: {
        user: {
          _id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          name: user.name,
        },
      },
      message: "Admin logged in successfully",
    })
  } catch (error) {
    console.error("[v0] Admin login error:", error)
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

// Register admin user (one-time setup)
exports.adminRegister = async (req, res) => {
  try {
    const { firstName, lastName, email, password, confirmPassword, adminSecret } = req.body

    // Check admin secret (optional security measure)
    if (adminSecret !== "mustard@admin2024") {
      return res.status(401).json({
        success: false,
        message: "Invalid admin secret key",
      })
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match",
      })
    }

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email })
    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        message: "Admin user already exists with this email",
      })
    }

    // Create admin user
    const adminUser = await User.create({
      firstName,
      lastName,
      email,
      password,
      role: "admin",
    })

    // Generate token
    const token = generateToken(adminUser._id)

    // Remove password from output
    adminUser.password = undefined

    res.status(201).json({
      success: true,
      token,
      data: {
        user: {
          _id: adminUser._id,
          firstName: adminUser.firstName,
          lastName: adminUser.lastName,
          email: adminUser.email,
          role: adminUser.role,
          name: adminUser.name,
        },
      },
      message: "Admin registered successfully",
    })
  } catch (error) {
    console.error("[v0] Admin registration error:", error)
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

// In your login function in authController.js
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body

    // Check if user exists and password is correct
    const user = await User.findOne({ email }).select("+password")

    if (!user || !(await user.correctPassword(password, user.password))) {
      return res.status(401).json({
        success: false,
        message: "Incorrect email or password",
      })
    }

    // Generate token
    const token = generateToken(user._id)

    // Remove password from output
    user.password = undefined

    // Send token in response body with role information
    res.status(200).json({
      success: true,
      token,
      data: {
        user: {
          _id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          name: user.name,
        },
      },
      message: "Logged in successfully",
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

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

module.exports = {
  register: exports.register,
  login: exports.login,
  adminLogin: exports.adminLogin,
  adminRegister: exports.adminRegister,
  logout: exports.logout,
  getMe: exports.getMe,
  updatePassword: exports.updatePassword,
}
