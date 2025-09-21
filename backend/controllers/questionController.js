const { Question, Quiz } = require('../models');
const { validationResult } = require('express-validator');

class QuestionController {
  /**
   * Get questions for a specific quiz
   */
  async getQuestionsByQuiz(req, res) {
    try {
      const { quizId } = req.params;

      // Verify quiz exists
      const quiz = await Quiz.findByPk(quizId);
      if (!quiz) {
        return res.status(404).json({
          success: false,
          error: 'Quiz not found'
        });
      }

      const questions = await Question.findAll({
        where: { 
          quizId: parseInt(quizId),
          deletedAt: null 
        },
        order: [['createdAt', 'ASC']]
      });

      res.json({
        success: true,
        data: questions,
        count: questions.length
      });
    } catch (error) {
      console.error('Error fetching questions:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch questions'
      });
    }
  }

  /**
   * Get question by ID
   */
  async getQuestionById(req, res) {
    try {
      const { id } = req.params;

      const question = await Question.findOne({
        where: { 
          id: parseInt(id),
          deletedAt: null 
        },
        include: [{
          model: Quiz,
          as: 'quiz',
          attributes: ['id', 'title', 'category']
        }]
      });

      if (!question) {
        return res.status(404).json({
          success: false,
          error: 'Question not found'
        });
      }

      res.json({
        success: true,
        data: question
      });
    } catch (error) {
      console.error('Error fetching question:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch question'
      });
    }
  }

  /**
   * Create a new question
   */
  async createQuestion(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Invalid input',
          details: errors.array()
        });
      }

      const { quizId, question, options, correctAnswer, questionType, points } = req.body;

      // Verify quiz exists
      const quiz = await Quiz.findByPk(quizId);
      if (!quiz) {
        return res.status(404).json({
          success: false,
          error: 'Quiz not found'
        });
      }

      // Validate options and correct answer
      if (!Array.isArray(options) || options.length < 2) {
        return res.status(400).json({
          success: false,
          error: 'Options must be an array with at least 2 items'
        });
      }

      // For single choice, validate correct answer is one of the options
      if (questionType === 'single' && !options.includes(correctAnswer)) {
        return res.status(400).json({
          success: false,
          error: 'Correct answer must be one of the provided options'
        });
      }

      // For multiple choice, validate correct answers are in options
      if (questionType === 'multiple') {
        const correctAnswers = correctAnswer.split(',').map(a => a.trim());
        const invalidAnswers = correctAnswers.filter(answer => !options.includes(answer));
        
        if (invalidAnswers.length > 0) {
          return res.status(400).json({
            success: false,
            error: 'All correct answers must be from the provided options'
          });
        }
      }

      const newQuestion = await Question.create({
        quizId,
        question,
        options,
        correctAnswer,
        questionType: questionType || 'single',
        points: points || 1
      });

      res.status(201).json({
        success: true,
        data: newQuestion,
        message: 'Question created successfully'
      });
    } catch (error) {
      console.error('Error creating question:', error);
      
      if (error.name === 'SequelizeValidationError') {
        return res.status(400).json({
          success: false,
          error: 'Validation error',
          details: error.errors.map(err => ({
            field: err.path,
            message: err.message
          }))
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to create question'
      });
    }
  }

  /**
   * Update question
   */
  async updateQuestion(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Invalid input',
          details: errors.array()
        });
      }

      const { id } = req.params;
      const { question, options, correctAnswer, questionType, points } = req.body;

      const existingQuestion = await Question.findByPk(id);
      if (!existingQuestion) {
        return res.status(404).json({
          success: false,
          error: 'Question not found'
        });
      }

      // Validate options and correct answer if provided
      if (options) {
        if (!Array.isArray(options) || options.length < 2) {
          return res.status(400).json({
            success: false,
            error: 'Options must be an array with at least 2 items'
          });
        }

        const newQuestionType = questionType || existingQuestion.questionType;
        const newCorrectAnswer = correctAnswer || existingQuestion.correctAnswer;

        // Validate correct answer against options
        if (newQuestionType === 'single' && !options.includes(newCorrectAnswer)) {
          return res.status(400).json({
            success: false,
            error: 'Correct answer must be one of the provided options'
          });
        }

        if (newQuestionType === 'multiple') {
          const correctAnswers = newCorrectAnswer.split(',').map(a => a.trim());
          const invalidAnswers = correctAnswers.filter(answer => !options.includes(answer));
          
          if (invalidAnswers.length > 0) {
            return res.status(400).json({
              success: false,
              error: 'All correct answers must be from the provided options'
            });
          }
        }
      }

      await existingQuestion.update({
        question: question || existingQuestion.question,
        options: options || existingQuestion.options,
        correctAnswer: correctAnswer || existingQuestion.correctAnswer,
        questionType: questionType || existingQuestion.questionType,
        points: points !== undefined ? points : existingQuestion.points
      });

      res.json({
        success: true,
        data: existingQuestion,
        message: 'Question updated successfully'
      });
    } catch (error) {
      console.error('Error updating question:', error);
      
      if (error.name === 'SequelizeValidationError') {
        return res.status(400).json({
          success: false,
          error: 'Validation error',
          details: error.errors.map(err => ({
            field: err.path,
            message: err.message
          }))
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to update question'
      });
    }
  }

  /**
   * Delete question (soft delete)
   */
  async deleteQuestion(req, res) {
    try {
      const { id } = req.params;

      const question = await Question.findByPk(id);
      if (!question) {
        return res.status(404).json({
          success: false,
          error: 'Question not found'
        });
      }

      await question.destroy(); // Soft delete due to paranoid: true

      res.json({
        success: true,
        message: 'Question deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting question:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete question'
      });
    }
  }
}

module.exports = new QuestionController();