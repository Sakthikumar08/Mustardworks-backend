const User = require("../models/User")
const { generateToken } = require("../config/jwt")
const { catchAsync, errorResponse } = require("../utils/helpers")

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

  // Generate token
  const token = generateToken(user._id)

  // Remove password from output
  user.password = undefined

  // Send token in response body
  res.status(201).json({
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
    message: "User registered successfully",
  })
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

// Login user
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
    success: true, // Changed to consistent format
    message: "Logged out successfully",
  })
}

// Get current user - FIXED
exports.getMe = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user._id)

  res.status(200).json({
    success: true, // Changed from status: "success"
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
    message: "User retrieved successfully",
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

  // Generate new token
  const token = generateToken(user._id)

  // Remove password from output
  user.password = undefined

  // Send new token in response
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
    message: "Password updated successfully",
  })
})

// Get all users (admin only)
exports.getAllUsers = catchAsync(async (req, res, next) => {
  const { page = 1, limit = 10, role, sortBy = "createdAt", sortOrder = "desc" } = req.query

  // Build filter object
  const filter = {}
  if (role) filter.role = role

  // Build sort object
  const sort = {}
  sort[sortBy] = sortOrder === "desc" ? -1 : 1

  // Calculate pagination
  const skip = (Number.parseInt(page) - 1) * Number.parseInt(limit)

  const users = await User.find(filter)
    .sort(sort)
    .skip(skip)
    .limit(Number.parseInt(limit))
    .select("-password -__v")

  // Get total count for pagination
  const totalUsers = await User.countDocuments(filter)
  const totalPages = Math.ceil(totalUsers / Number.parseInt(limit))

  res.status(200).json({
    success: true,
    data: {
      users,
      pagination: {
        currentPage: Number.parseInt(page),
        totalPages,
        totalUsers,
        hasNextPage: Number.parseInt(page) < totalPages,
        hasPrevPage: Number.parseInt(page) > 1,
      },
    },
    message: "Users retrieved successfully",
  })
})

module.exports = {
  register: exports.register,
  login: exports.login,
  adminLogin: exports.adminLogin,
  adminRegister: exports.adminRegister,
  logout: exports.logout,
  getMe: exports.getMe,
  updatePassword: exports.updatePassword,
  getAllUsers: exports.getAllUsers,
}