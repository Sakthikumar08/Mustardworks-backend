const express = require('express');
const {
  signup,
  login,
  getMe
} = require('../controllers/authController');
const { validateSignup, validateLogin } = require('../middleware/validation');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/signup', validateSignup, signup);
router.post('/login', validateLogin, login);
router.get('/me', protect, getMe);

module.exports = router;