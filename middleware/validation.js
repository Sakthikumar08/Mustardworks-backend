const { body, validationResult } = require("express-validator")
const { errorResponse } = require("../utils/helpers")

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((error) => error.msg)
    return next(errorResponse(errorMessages.join(". "), 400))
  }
  next()
}

exports.validateRegister = [
  body("firstName")
    .trim()
    .notEmpty()
    .withMessage("First name is required")
    .isLength({ min: 1, max: 50 })
    .withMessage("First name must be between 1 and 50 characters")
    .escape(),

  body("lastName")
    .trim()
    .notEmpty()
    .withMessage("Last name is required")
    .isLength({ min: 1, max: 50 })
    .withMessage("Last name must be between 1 and 50 characters")
    .escape(),

  body("email").trim().isEmail().withMessage("Please provide a valid email").normalizeEmail(),

  body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters long"),

  body("confirmPassword")
    .optional()
    .custom((value, { req }) => {
      if (value && value !== req.body.password) {
        throw new Error("Passwords do not match")
      }
      return true
    }),

  handleValidationErrors,
]

exports.validateLogin = [
  body("email").trim().isEmail().withMessage("Please provide a valid email").normalizeEmail(),

  body("password").notEmpty().withMessage("Password is required"),

  handleValidationErrors,
]

exports.validateUpdatePassword = [
  body("currentPassword").notEmpty().withMessage("Current password is required"),

  body("newPassword").isLength({ min: 6 }).withMessage("New password must be at least 6 characters long"),

  handleValidationErrors,
]

exports.validateProject = [
  body("projectType")
    .trim()
    .notEmpty()
    .withMessage("Project type is required")
    .isIn(["hardware", "embedded", "iot", "ev", "ai", "vlsi", "app", "web", "laptop", "other"])
    .withMessage("Invalid project type"),

  body("budget")
    .optional()
    .trim()
    .isIn(["<1000", "1000-5000", "5000-10000", "10000-25000", ">25000", ""])
    .withMessage("Invalid budget range"),

  body("timeline")
    .optional()
    .trim()
    .isIn(["<1month", "1-3months", "3-6months", "6-12months", ">12months", ""])
    .withMessage("Invalid timeline"),

  body("description")
    .trim()
    .notEmpty()
    .withMessage("Description is required")
    .isLength({ min: 10, max: 2000 })
    .withMessage("Description must be between 10 and 2000 characters")
    .escape(),

  handleValidationErrors,
]

exports.validateProjectStatus = [
  body("status")
    .trim()
    .notEmpty()
    .withMessage("Status is required")
    .isIn(["pending", "in-review", "approved", "rejected", "in-progress", "completed"])
    .withMessage("Invalid status value"),

  handleValidationErrors,
]

exports.handleValidationErrors = handleValidationErrors
