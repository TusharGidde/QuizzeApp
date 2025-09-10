const express = require('express');
const router = express.Router();
const questionController = require('../controllers/questionController');
const { questionValidation } = require('../middleware/validation');
const { authenticateToken } = require('../middleware/auth');

// Protected routes (authentication required - admin functionality)
router.get('/quiz/:quizId', authenticateToken, questionValidation.getByQuiz, questionController.getQuestionsByQuiz);
router.get('/:id', authenticateToken, questionValidation.getById, questionController.getQuestionById);
router.post('/', authenticateToken, questionValidation.create, questionController.createQuestion);
router.put('/:id', authenticateToken, questionValidation.update, questionController.updateQuestion);
router.delete('/:id', authenticateToken, questionValidation.delete, questionController.deleteQuestion);

// Bulk operations
router.post('/quiz/:quizId/bulk', authenticateToken, questionValidation.bulkCreate, questionController.bulkCreateQuestions);

module.exports = router;