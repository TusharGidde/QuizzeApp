const express = require('express');
const router = express.Router();

// Import controllers and middleware
const {
  register,
  login,
  getProfile,
  me,
} = require('../controllers/authController');

const { authenticateToken } = require('../middleware/auth');

const {
  validateRegistration,
  validateLogin
} = require('../middleware/validation');

// Public routes
router.post('/register', validateRegistration, register);
router.post('/login', validateLogin, login);

// Protected routes (require authentication)
router.get('/profile', authenticateToken, getProfile);


module.exports = router;