const express = require("express")
const { register, login, logout, getMe, updatePassword } = require("../controllers/authController")
const { validateRegister, validateLogin, validateUpdatePassword } = require("../middleware/validation")
const { protect } = require("../middleware/auth")

const router = express.Router()

router.post("/register", validateRegister, register)
router.post("/login", validateLogin, login)
router.post("/logout", logout)
router.get("/me", protect, getMe)
router.patch("/update-password", protect, validateUpdatePassword, updatePassword)

module.exports = router
