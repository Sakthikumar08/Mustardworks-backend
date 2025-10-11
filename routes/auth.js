const express = require("express")
const {
  register,
  login,
  logout,
  getMe,
  updatePassword,
  adminLogin,
  adminRegister,
} = require("../controllers/authController")
const { validateRegister, validateLogin, validateUpdatePassword } = require("../middleware/validation")
const { protect } = require("../middleware/auth")

const router = express.Router()

// Public routes
router.post("/register", validateRegister, register)
router.post("/login", validateLogin, login)
router.post("/admin/login", validateLogin, adminLogin)
router.post("/admin/register", validateRegister, adminRegister)
router.post("/logout", logout)

// Protected routes
router.get("/me", protect, getMe)
router.patch("/update-password", protect, validateUpdatePassword, updatePassword)

module.exports = router