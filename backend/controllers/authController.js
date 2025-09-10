const User = require('../models/User');
const { generateToken } = require('../middleware/auth');
const { 
  asyncHandler, 
  ConflictError, 
  AuthenticationError,
  NotFoundError 
} = require('../middleware/errors');
const logger = require('../services/loggerService');

// Register new user
const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ where: { email } });
  if (existingUser) {
    throw new ConflictError('User with this email already exists');
  }

  // Create new user (password will be hashed by the model hook)
  const user = await User.create({
    name,
    email,
    password
  });

  // Generate JWT token
  const token = generateToken(user.id);

  // Log successful registration
  logger.logAuth('user_registered', user.id, { email });

  res.status(201).json({
    success: true,
    data: {
      user: user.toJSON(),
      token
    },
    message: 'User registered successfully'
  });
});

// Login user
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Find user by email
  const user = await User.findOne({ where: { email } });
  if (!user) {
    logger.logSecurity('failed_login_attempt', { email, reason: 'user_not_found' });
    throw new AuthenticationError('Invalid email or password');
  }

  // Check password
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    logger.logSecurity('failed_login_attempt', { email, userId: user.id, reason: 'invalid_password' });
    throw new AuthenticationError('Invalid email or password');
  }

  // Generate JWT token
  const token = generateToken(user.id);

  // Log successful login
  logger.logAuth('user_login', user.id, { email });

  res.json({
    success: true,
    data: {
      user: user.toJSON(),
      token
    },
    message: 'Login successful'
  });
});

// Get current user profile
const getProfile = asyncHandler(async (req, res) => {
  // User is already attached to req by authenticateToken middleware
  res.json({
    success: true,
    data: {
      user: req.user.toJSON()
    }
  });
});

// Refresh token
const refreshToken = asyncHandler(async (req, res) => {
  // User is already authenticated by middleware
  const newToken = generateToken(req.user.id);

  // Log token refresh
  logger.logAuth('token_refreshed', req.user.id);

  res.json({
    success: true,
    data: {
      token: newToken,
      user: req.user.toJSON()
    },
    message: 'Token refreshed successfully'
  });
});

module.exports = {
  register,
  login,
  getProfile,
  refreshToken
};