const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { AuthenticationError, asyncHandler } = require('./errors');
const logger = require('../services/loggerService');

// Generate JWT token
const generateToken = (userId, role) => {
  return jwt.sign({ userId , role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '2d'
  });
};

// Verify JWT token middleware
const authenticateToken = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    logger.logSecurity('missing_auth_token', { 
      url: req.url, 
      method: req.method,
      ip: req.ip 
    });
    throw new AuthenticationError('Access token required');
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const user = await User.findByPk(decoded.userId);

  if (!user) {
    logger.logSecurity('invalid_token_user_not_found', { 
      userId: decoded.userId,
      url: req.url,
      ip: req.ip 
    });
    throw new AuthenticationError('Invalid token - user not found');
  }

  req.user = user;
  next();
});

module.exports = {
  generateToken,
  authenticateToken,
  
};