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

const ALLOWED_GALLERY_CATEGORIES = ["iot", "e-vehicles", "ai", "hardware", "software", "vlsi"]

const CATEGORY_ALIASES = {
  iot: ["iot", "i.o.t", "internet of things"],
  "e-vehicles": ["e-vehicles", "e vehicles", "ev", "electric vehicles", "evehicle", "e_vehicle", "e-vehicle"],
  ai: ["ai", "a.i", "artificial intelligence"],
  hardware: ["hardware"],
  software: ["software"],
  vlsi: ["vlsi"],
}

function normalizeText(input) {
  if (input == null) return input
  return String(input).toLowerCase().replace(/[_-]/g, " ").replace(/\s+/g, " ").trim()
}

function normalizeCategory(input) {
  const s = normalizeText(input)
  if (!s) return input
  for (const [canon, list] of Object.entries(CATEGORY_ALIASES)) {
    if (list.includes(s)) return canon
  }
  // fallback to lowercase if already canonical
  return ALLOWED_GALLERY_CATEGORIES.includes(s) ? s : input
}

function coalesceImage(val, { req }) {
  // Accept either "image" or "imageUrl" from client
  return val || req.body.imageUrl || ""
}

const ALLOWED_PROJECT_TYPES = ["hardware", "embedded", "iot", "ev", "ai", "vlsi", "app", "web", "laptop", "other"]

function normalizeProjectType(input) {
  const s = normalizeText(input)
  if (!s) return input
  // map common synonyms to allowed enums
  if (["internet of things"].includes(s)) return "iot"
  if (["e vehicles", "e-vehicles", "electric vehicles", "ev", "e vehicle"].includes(s)) return "ev"
  if (["artificial intelligence", "ml", "machine learning", "a.i"].includes(s)) return "ai"
  if (["mobile", "mobile app", "android", "ios"].includes(s)) return "app"
  if (["web app", "website", "webapp"].includes(s)) return "web"
  if (["prototype", "proof of concept", "poc"].includes(s)) return "other"
  // passthrough if already allowed
  return ALLOWED_PROJECT_TYPES.includes(s) ? s : input
}

const ALLOWED_BUDGETS = ["<1000", "1000-5000", "5000-10000", "10000-25000", ">25000", ""]

function normalizeBudget(input) {
  if (input == null) return input
  let s = String(input).toLowerCase().replace(/\s+/g, "")
  // quick direct matches
  if (ALLOWED_BUDGETS.includes(s)) return s
  // normalize "k" notation and ranges like "0-10k"
  s = s.replace(/k/g, "000").replace(/to|–|—/g, "-")
  const m = s.match(/^(\d+)-(\d+)$/)
  if (m) {
    const low = Number.parseInt(m[1], 10)
    const high = Number.parseInt(m[2], 10)
    if (isFinite(low) && isFinite(high)) {
      if (high <= 1000) return "<1000"
      if (high <= 5000) return "1000-5000"
      if (high <= 10000) return "5000-10000"
      if (high <= 25000) return "10000-25000"
      return ">25000"
    }
  }
  // single bound like ">25000"
  const gt = s.match(/^>(\d+)$/)
  if (gt && Number.parseInt(gt[1], 10) >= 25000) return ">25000"
  return input
}

const ALLOWED_TIMELINES = ["<1month", "1-3months", "3-6months", "6-12months", ">12months", ""]

function normalizeTimeline(input) {
  if (input == null) return input
  const s = String(input).toLowerCase().replace(/\s+/g, "")
  // direct matches
  if (ALLOWED_TIMELINES.includes(s)) return s
  // parse like "3months", "3m", "3"
  const m = s.match(/^(\d+)(m|mo|mon|month|months)?$/)
  if (m) {
    const months = Number.parseInt(m[1], 10)
    if (!isNaN(months)) {
      if (months < 1) return "<1month"
      if (months <= 3) return "1-3months"
      if (months <= 6) return "3-6months"
      if (months <= 12) return "6-12months"
      return ">12months"
    }
  }
  // phrases like "3months", "3-months", "3 months"
  const n = s.replace(/[^0-9]/g, "")
  if (n) {
    const months = Number.parseInt(n, 10)
    if (!isNaN(months)) {
      if (months < 1) return "<1month"
      if (months <= 3) return "1-3months"
      if (months <= 6) return "3-6months"
      if (months <= 12) return "6-12months"
      return ">12months"
    }
  }
  return input
}

const validateRegister = [
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

const validateLogin = [
  body("email").trim().isEmail().withMessage("Please provide a valid email").normalizeEmail(),

  body("password").notEmpty().withMessage("Password is required"),

  handleValidationErrors,
]

const validateUpdatePassword = [
  body("currentPassword").notEmpty().withMessage("Current password is required"),

  body("newPassword").isLength({ min: 6 }).withMessage("New password must be at least 6 characters long"),

  handleValidationErrors,
]

const validateProject = [
  body("projectType")
    .trim()
    .notEmpty()
    .withMessage("Project type is required")
    .customSanitizer(normalizeProjectType)
    .isIn(ALLOWED_PROJECT_TYPES)
    .withMessage("Invalid project type"),

  body("budget")
    .optional()
    .trim()
    .customSanitizer(normalizeBudget)
    .isIn(ALLOWED_BUDGETS)
    .withMessage("Invalid budget range"),

  body("timeline")
    .optional()
    .trim()
    .customSanitizer(normalizeTimeline)
    .isIn(ALLOWED_TIMELINES)
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

const validateProjectStatus = [
  body("status")
    .trim()
    .notEmpty()
    .withMessage("Status is required")
    .isIn(["pending", "in-review", "approved", "rejected", "in-progress", "completed"])
    .withMessage("Invalid status value"),

  handleValidationErrors,
]

const validateGalleryItem = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Title is required")
    .isLength({ min: 1, max: 100 })
    .withMessage("Title must be between 1 and 100 characters")
    .escape(),

  body("description")
    .trim()
    .notEmpty()
    .withMessage("Description is required")
    .isLength({ min: 10, max: 500 })
    .withMessage("Description must be between 10 and 500 characters")
    .escape(),

  body("category")
    .trim()
    .notEmpty()
    .withMessage("Category is required")
    .customSanitizer(normalizeCategory)
    .isIn(ALLOWED_GALLERY_CATEGORIES)
    .withMessage("Invalid category. Must be one of: iot, e-vehicles, ai, hardware, software, vlsi"),

  body("image")
    .customSanitizer(coalesceImage)
    .trim()
    .notEmpty()
    .withMessage("Image URL is required")
    .isURL()
    .withMessage("Please provide a valid image URL"),

  handleValidationErrors,
]

const validateGalleryUpdate = [
  body("title")
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Title must be between 1 and 100 characters")
    .escape(),

  body("description")
    .optional()
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage("Description must be between 10 and 500 characters")
    .escape(),

  body("category")
    .optional()
    .trim()
    .customSanitizer(normalizeCategory)
    .isIn(ALLOWED_GALLERY_CATEGORIES)
    .withMessage("Invalid category. Must be one of: iot, e-vehicles, ai, hardware, software, vlsi"),

  body("image")
    .optional()
    .customSanitizer(coalesceImage)
    .trim()
    .isURL()
    .withMessage("Please provide a valid image URL"),

  body("isActive").optional().isBoolean().withMessage("isActive must be a boolean value"),

  handleValidationErrors,
]

module.exports = {
  validateRegister,
  validateLogin,
  validateUpdatePassword,
  validateProject,
  validateProjectStatus,
  validateGalleryItem,
  validateGalleryUpdate,
  handleValidationErrors,
}
