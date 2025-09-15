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
