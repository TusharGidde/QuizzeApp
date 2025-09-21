const express = require('express');
const router = express.Router();
const quizController = require('../controllers/quizController');
const { quizValidation } = require('../middleware/validation');
const { authenticateToken } = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');

// Public routes (no authentication required for browsing)
router.get('/', quizController.getQuizzes);
router.get('/categories', quizController.getCategories);
router.get('/:id', quizValidation.getById, quizController.getQuizById);

// Protected routes (authentication required)
router.post('/:id/start', authenticateToken, quizValidation.getById, quizController.startQuiz);
router.post('/:id/submit', authenticateToken, quizValidation.submit, quizController.submitQuiz);
router.get('/:id/leaderboard', quizController.getQuizLeaderboard);

// Admin routes (authentication required - admin role check can be added later)
router.post('/', authenticateToken, isAdmin, quizValidation.create, quizController.createQuiz);
router.delete('/:id', authenticateToken,isAdmin, quizValidation.delete, quizController.deleteQuiz);

module.exports = router;