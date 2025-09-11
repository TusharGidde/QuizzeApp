const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { body, param, query } = require('express-validator');
const AdminController = require('../controllers/adminController');

const { authenticateToken: auth } = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    
    // Create uploads directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `questions-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const fileFilter = (req, file, cb) => {
  // Only allow CSV files
  if (file.mimetype === 'text/csv' || path.extname(file.originalname).toLowerCase() === '.csv') {
    cb(null, true);
  } else {
    cb(new Error('Only CSV files are allowed'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1
  }
});

// Validation middleware
const validateQuizId = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Quiz ID must be a positive integer')
];

const validateQuestionId = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Question ID must be a positive integer')
];

const validateExpiryDate = [
  body('expiresAt')
    .isISO8601()
    .withMessage('Expiry date must be a valid ISO 8601 date')
    .custom((value) => {
      const expiryDate = new Date(value);
      if (expiryDate <= new Date()) {
        throw new Error('Expiry date must be in the future');
      }
      return true;
    })
];

const validateBulkDelete = [
  body('questionIds')
    .isArray({ min: 1 })
    .withMessage('Question IDs must be a non-empty array')
    .custom((questionIds) => {
      if (!questionIds.every(id => Number.isInteger(id) && id > 0)) {
        throw new Error('All question IDs must be positive integers');
      }
      return true;
    })
];

const validateExportFilters = [
  query('quizId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Quiz ID must be a positive integer'),
  query('userId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('User ID must be a positive integer'),
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid ISO 8601 date'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid ISO 8601 date')
    .custom((endDate, { req }) => {
      if (req.query.startDate && endDate) {
        const start = new Date(req.query.startDate);
        const end = new Date(endDate);
        if (end <= start) {
          throw new Error('End date must be after start date');
        }
      }
      return true;
    })
];

// Error handling middleware for multer
const handleMulterError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 5MB.'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files. Only one file is allowed.'
      });
    }
  }
  
  if (error.message === 'Only CSV files are allowed') {
    return res.status(400).json({
      success: false,
      message: 'Only CSV files are allowed'
    });
  }
  
  next(error);
};

// Routes

/**
 * @route   POST /api/admin/questions/import/:id
 * @desc    Import questions from CSV file for a specific quiz
 * @access  Private (Admin)
 */
router.post('/questions/import/:id', 
  auth, 
  isAdmin,
  validateQuizId,
  upload.single('csvFile'),
  handleMulterError,
  AdminController.importQuestions
);

/**
 * @route   GET /api/admin/attempts/export
 * @desc    Export quiz attempts to CSV
 * @access  Private (Admin)
 */
router.get('/attempts/export',
  auth,
  isAdmin,
  validateExportFilters,
  AdminController.exportAttempts
);

/**
 * @route   GET /api/admin/exports/download/:filename
 * @desc    Download exported CSV file
 * @access  Private (Admin)
 */
router.get('/exports/download/:filename',
  auth,
  isAdmin,
  AdminController.downloadExport
);

/**
 * @route   DELETE /api/admin/questions/:id
 * @desc    Soft delete a question
 * @access  Private (Admin)
 */
router.delete('/questions/:id',
  auth,
  isAdmin,
  validateQuestionId,
  AdminController.deleteQuestion
);

/**
 * @route   PUT /api/admin/quizzes/:id/expire
 * @desc    Set quiz expiry date
 * @access  Private (Admin)
 */
router.put('/quizzes/:id/expire',
  auth,
  isAdmin,
  validateQuizId,
  validateExpiryDate,
  AdminController.setQuizExpiry
);

/**
 * @route   GET /api/admin/bulk-operations/summary
 * @desc    Get summary for bulk operations
 * @access  Private (Admin)
 */
router.get('/bulk-operations/summary',
  auth,
  isAdmin,
  AdminController.getBulkOperationsSummary
);

/**
 * @route   DELETE /api/admin/questions/bulk
 * @desc    Bulk delete questions
 * @access  Private (Admin)
 */
router.delete('/questions/bulk',
  auth,
  isAdmin,
  validateBulkDelete,
  AdminController.bulkDeleteQuestions
);

/**
 * @route   POST /api/admin/exports/cleanup
 * @desc    Clean up old export files
 * @access  Private (Admin)
 */
router.post('/exports/cleanup',
  auth,
  isAdmin,
  AdminController.cleanupExports
);

module.exports = router;