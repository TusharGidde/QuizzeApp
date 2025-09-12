const express = require('express');
const router = express.Router();

// Import controllers and middleware
const {
  register,
  login,
  getProfile,
} = require('../controllers/authController');

const { authenticateToken } = require('../middleware/auth');
const { authRateLimit } = require('../middleware/rateLimiter');

const {
  validateRegistration,
  validateLogin
} = require('../middleware/validation');

// Public routes
router.post('/register', authRateLimit, validateRegistration, register);
router.post('/login', authRateLimit, validateLogin, login);

// Protected routes (require authentication)
router.get('/profile', authenticateToken, getProfile);

module.exports = router;