const express = require('express');
const { body, query, param } = require('express-validator');
const { authenticateToken } = require('../middleware/auth');
const {
  getUserProfile,
  updateUserProfile,
  getUserHistory,
  getAttemptDetails,
  getUserStatistics,
  getRecentActivity
} = require('../controllers/userController');

const router = express.Router();

// All user routes require authentication
router.use(authenticateToken);

/**
 * @route   GET /api/users/profile
 * @desc    Get user profile with statistics and recent activity
 * @access  Private
 */
router.get('/profile', getUserProfile);

/**
 * @route   PUT /api/users/profile
 * @desc    Update user profile information
 * @access  Private
 */
router.put('/profile', [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage('Name must be between 2 and 255 characters')
    .matches(/^[a-zA-Z\s'-]+$/)
    .withMessage('Name can only contain letters, spaces, hyphens, and apostrophes'),
  
  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Must be a valid email address')
    .normalizeEmail()
], updateUserProfile);

/**
 * @route   GET /api/users/history
 * @desc    Get user quiz attempt history with filtering and pagination
 * @access  Private
 */
router.get('/history', [
  query('category')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Category must be between 1 and 100 characters'),
  
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid ISO 8601 date'),
  
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid ISO 8601 date'),
  
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50'),
  
  query('sortBy')
    .optional()
    .isIn(['completedAt', 'score', 'timeTaken'])
    .withMessage('Sort by must be one of: completedAt, score, timeTaken'),
  
  query('sortOrder')
    .optional()
    .isIn(['ASC', 'DESC', 'asc', 'desc'])
    .withMessage('Sort order must be ASC or DESC')
], getUserHistory);

/**
 * @route   GET /api/users/attempts/:attemptId
 * @desc    Get detailed information about a specific attempt
 * @access  Private
 */
router.get('/attempts/:attemptId', [
  param('attemptId')
    .isInt({ min: 1 })
    .withMessage('Attempt ID must be a positive integer')
], getAttemptDetails);

/**
 * @route   GET /api/users/statistics
 * @desc    Get user statistics only
 * @access  Private
 */
router.get('/statistics', getUserStatistics);

/**
 * @route   GET /api/users/recent-activity
 * @desc    Get user's recent quiz attempts
 * @access  Private
 */
router.get('/recent-activity', [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 20 })
    .withMessage('Limit must be between 1 and 20')
], getRecentActivity);

module.exports = router;