const express = require('express');
const router = express.Router();
const quizController = require('../controllers/quizController');
const { quizValidation, queryValidation } = require('../middleware/validation');
const { authenticateToken } = require('../middleware/auth');

// Public routes (no authentication required for browsing)
router.get('/', queryValidation.quizFilters, quizController.getQuizzes);
router.get('/categories', quizController.getCategories);
router.get('/:id', quizValidation.getById, quizController.getQuizById);

// Protected routes (authentication required)
router.post('/:id/start', authenticateToken, quizValidation.getById, quizController.startQuiz);
router.post('/:id/submit', authenticateToken, quizValidation.submit, quizController.submitQuiz);
router.get('/:id/leaderboard', quizController.getQuizLeaderboard);

// User attempt routes
router.get('/attempts/history', authenticateToken, quizController.getUserAttempts);
router.get('/attempts/statistics', authenticateToken, quizController.getUserStatistics);
router.get('/attempts/:attemptId', authenticateToken, quizController.getAttemptDetails);

// Admin routes (authentication required - admin role check can be added later)
router.post('/', authenticateToken, quizValidation.create, quizController.createQuiz);
router.put('/:id', authenticateToken, quizValidation.update, quizController.updateQuiz);
router.delete('/:id', authenticateToken, quizValidation.delete, quizController.deleteQuiz);

module.exports = router;