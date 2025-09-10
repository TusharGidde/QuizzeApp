const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const analyticsController = require('../controllers/analyticsController');
const { authenticateToken: auth } = require('../middleware/auth');

// Validation middleware
const validateQuizId = [
  param('quizId')
    .isInt({ min: 1 })
    .withMessage('Quiz ID must be a positive integer')
];

const validateDateRange = [
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid ISO 8601 date'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid ISO 8601 date')
];

const validateLimit = [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
];

const validateTimeframe = [
  query('timeframe')
    .optional()
    .isIn(['week', 'month', 'year'])
    .withMessage('Timeframe must be week, month, or year')
];

const validateCategory = [
  query('category')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Category must be between 1 and 100 characters')
];

const validateExportType = [
  query('type')
    .optional()
    .isIn(['quiz', 'questions', 'popular'])
    .withMessage('Export type must be quiz, questions, or popular')
];

// Routes

/**
 * @route   GET /api/analytics/dashboard
 * @desc    Get comprehensive dashboard analytics
 * @access  Private
 */
router.get('/dashboard',
  auth,
  [
    ...validateTimeframe,
    ...validateCategory,
    ...validateLimit
  ],
  analyticsController.getDashboardAnalytics
);

/**
 * @route   GET /api/analytics/overview
 * @desc    Get overview statistics
 * @access  Private
 */
router.get('/overview',
  auth,
  [
    ...validateTimeframe,
    ...validateCategory
  ],
  analyticsController.getOverviewStatistics
);

/**
 * @route   GET /api/analytics/trends
 * @desc    Get activity trends over time
 * @access  Private
 */
router.get('/trends',
  auth,
  [
    ...validateTimeframe,
    ...validateCategory
  ],
  analyticsController.getActivityTrends
);

/**
 * @route   GET /api/analytics/quiz/:quizId
 * @desc    Get comprehensive analytics for a specific quiz
 * @access  Private
 */
router.get('/quiz/:quizId',
  auth,
  [
    ...validateQuizId,
    ...validateDateRange,
    query('includeQuestionAnalytics')
      .optional()
      .isBoolean()
      .withMessage('includeQuestionAnalytics must be a boolean')
  ],
  analyticsController.getQuizAnalytics
);

/**
 * @route   GET /api/analytics/quiz/:quizId/questions
 * @desc    Get question-level analytics for a specific quiz
 * @access  Private
 */
router.get('/quiz/:quizId/questions',
  auth,
  [
    ...validateQuizId,
    ...validateDateRange
  ],
  analyticsController.getQuestionAnalytics
);

/**
 * @route   GET /api/analytics/questions/hardest
 * @desc    Get hardest questions based on success rates
 * @access  Private
 */
router.get('/questions/hardest',
  auth,
  [
    ...validateLimit,
    ...validateCategory,
    ...validateDateRange,
    query('minAttempts')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Minimum attempts must be a positive integer')
  ],
  analyticsController.getHardestQuestions
);

/**
 * @route   GET /api/analytics/quizzes/popular
 * @desc    Get most popular quizzes by attempt count
 * @access  Private
 */
router.get('/quizzes/popular',
  auth,
  [
    ...validateLimit,
    ...validateCategory,
    ...validateTimeframe,
    ...validateDateRange
  ],
  analyticsController.getMostPopularQuizzes
);

/**
 * @route   GET /api/analytics/export
 * @desc    Export analytics data
 * @access  Private
 */
router.get('/export',
  auth,
  [
    ...validateExportType,
    ...validateLimit,
    ...validateCategory,
    ...validateDateRange,
    query('quizId')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Quiz ID must be a positive integer')
  ],
  analyticsController.exportAnalyticsData
);

module.exports = router;