const { body, param, query } = require('express-validator');
const { handleValidationErrors } = require('./errors');

// Quiz validation rules
const quizValidation = {
  create: [
    body('title')
      .trim()
      .isLength({ min: 3, max: 255 })
      .withMessage('Title must be between 3 and 255 characters'),
    body('category')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Category must be between 2 and 100 characters'),
    body('description')
      .optional()
      .isLength({ max: 1000 })
      .withMessage('Description cannot exceed 1000 characters'),
    body('timeLimit')
      .optional()
      .isInt({ min: 1, max: 180 })
      .withMessage('Time limit must be between 1 and 180 minutes'),
    body('expiresAt')
      .optional()
      .isISO8601()
      .withMessage('Expiry date must be a valid ISO date')
      .custom((value) => {
        if (new Date(value) <= new Date()) {
          throw new Error('Expiry date must be in the future');
        }
        return true;
      })
  ],

  update: [
    param('id')
      .isInt({ min: 1 })
      .withMessage('Quiz ID must be a positive integer'),
    body('title')
      .optional()
      .trim()
      .isLength({ min: 3, max: 255 })
      .withMessage('Title must be between 3 and 255 characters'),
    body('category')
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Category must be between 2 and 100 characters'),
    body('description')
      .optional()
      .isLength({ max: 1000 })
      .withMessage('Description cannot exceed 1000 characters'),
    body('timeLimit')
      .optional()
      .isInt({ min: 1, max: 180 })
      .withMessage('Time limit must be between 1 and 180 minutes'),
    body('expiresAt')
      .optional()
      .isISO8601()
      .withMessage('Expiry date must be a valid ISO date')
  ],

  getById: [
    param('id')
      .isInt({ min: 1 })
      .withMessage('Quiz ID must be a positive integer')
  ],

  delete: [
    param('id')
      .isInt({ min: 1 })
      .withMessage('Quiz ID must be a positive integer')
  ],

  submit: [
    param('id')
      .isInt({ min: 1 })
      .withMessage('Quiz ID must be a positive integer'),
    body('answers')
      .isObject()
      .withMessage('Answers must be an object'),
    body('startTime')
      .isISO8601()
      .withMessage('Start time must be a valid ISO date'),
    body('timeTaken')
      .isInt({ min: 0 })
      .withMessage('Time taken must be a non-negative integer')
  ]
};

// Question validation rules
const questionValidation = {
  create: [
    body('quizId')
      .isInt({ min: 1 })
      .withMessage('Quiz ID must be a positive integer'),
    body('question')
      .trim()
      .isLength({ min: 10, max: 2000 })
      .withMessage('Question must be between 10 and 2000 characters'),
    body('options')
      .isArray({ min: 2, max: 6 })
      .withMessage('Options must be an array with 2-6 items'),
    body('options.*')
      .trim()
      .isLength({ min: 1 })
      .withMessage('Each option must be a non-empty string'),
    body('correctAnswer')
      .trim()
      .isLength({ min: 1 })
      .withMessage('Correct answer cannot be empty'),
    body('questionType')
      .optional()
      .isIn(['single', 'multiple'])
      .withMessage('Question type must be either single or multiple'),
    body('points')
      .optional()
      .isInt({ min: 1, max: 10 })
      .withMessage('Points must be between 1 and 10')
  ],

  update: [
    param('id')
      .isInt({ min: 1 })
      .withMessage('Question ID must be a positive integer'),
    body('question')
      .optional()
      .trim()
      .isLength({ min: 10, max: 2000 })
      .withMessage('Question must be between 10 and 2000 characters'),
    body('options')
      .optional()
      .isArray({ min: 2, max: 6 })
      .withMessage('Options must be an array with 2-6 items'),
    body('options.*')
      .optional()
      .trim()
      .isLength({ min: 1 })
      .withMessage('Each option must be a non-empty string'),
    body('correctAnswer')
      .optional()
      .trim()
      .isLength({ min: 1 })
      .withMessage('Correct answer cannot be empty'),
    body('questionType')
      .optional()
      .isIn(['single', 'multiple'])
      .withMessage('Question type must be either single or multiple'),
    body('points')
      .optional()
      .isInt({ min: 1, max: 10 })
      .withMessage('Points must be between 1 and 10')
  ],

  getById: [
    param('id')
      .isInt({ min: 1 })
      .withMessage('Question ID must be a positive integer')
  ],

  getByQuiz: [
    param('quizId')
      .isInt({ min: 1 })
      .withMessage('Quiz ID must be a positive integer')
  ],

  delete: [
    param('id')
      .isInt({ min: 1 })
      .withMessage('Question ID must be a positive integer')
  ],

};


// Auth validation rules
const validateRegistration = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .isLength({ min: 6, max: 128 })
    .withMessage('Password must be between 6 and 128 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  handleValidationErrors
];

const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  handleValidationErrors
];

module.exports = {
  quizValidation,
  questionValidation,
  validateRegistration,
  validateLogin
};