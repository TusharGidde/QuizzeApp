const express = require('express');
const { body, param, query } = require('express-validator');
const leaderboardController = require('../controllers/leaderboardController');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Validation middleware
const validateQuizId = [
  param('quizId')
    .isInt({ min: 1 })
    .withMessage('Quiz ID must be a positive integer')
];

const validateUserId = [
  param('userId')
    .isInt({ min: 1 })
    .withMessage('User ID must be a positive integer')
];

const validatePagination = [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Offset must be a non-negative integer')
];

const validateGlobalLeaderboardQuery = [
  ...validatePagination,
  query('category')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Category must be between 2 and 100 characters'),
  query('timeframe')
    .optional()
    .isIn(['week', 'month', 'year'])
    .withMessage('Timeframe must be one of: week, month, year')
];

const validateQuizLeaderboardQuery = [
  ...validatePagination,
  query('includeUserRank')
    .optional()
    .isBoolean()
    .withMessage('includeUserRank must be a boolean')
];

/**
 * @route   GET /api/leaderboard/quiz/:quizId
 * @desc    Get leaderboard for a specific quiz
 * @access  Public (but enhanced with user data if authenticated)
 */
router.get('/quiz/:quizId', 
  validateQuizId,
  validateQuizLeaderboardQuery,
  optionalAuth, // Optional authentication for enhanced features
  leaderboardController.getQuizLeaderboard
);

/**
 * @route   GET /api/leaderboard/quiz/:quizId/user/:userId/rank
 * @desc    Get user's rank in a specific quiz
 * @access  Private (user can only access their own rank)
 */
router.get('/quiz/:quizId/user/:userId/rank',
  validateQuizId,
  validateUserId,
  authenticateToken,
  leaderboardController.getUserRankInQuiz
);

/**
 * @route   GET /api/leaderboard/global
 * @desc    Get global leaderboard across all quizzes
 * @access  Public
 */
router.get('/global',
  validateGlobalLeaderboardQuery,
  leaderboardController.getGlobalLeaderboard
);

/**
 * @route   GET /api/leaderboard/quiz/:quizId/stats
 * @desc    Get leaderboard statistics for a quiz
 * @access  Public
 */
router.get('/quiz/:quizId/stats',
  validateQuizId,
  leaderboardController.getQuizLeaderboardStats
);

/**
 * @route   GET /api/leaderboard/recent-high-scores
 * @desc    Get recent high scores across all quizzes
 * @access  Public
 */
router.get('/recent-high-scores',
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50'),
  leaderboardController.getRecentHighScores
);

/**
 * @route   POST /api/leaderboard/quiz/:quizId/refresh
 * @desc    Refresh leaderboard cache for a quiz
 * @access  Private (admin only in production)
 */
router.post('/quiz/:quizId/refresh',
  validateQuizId,
  authenticateToken,
  leaderboardController.refreshQuizLeaderboard
);

module.exports = router;