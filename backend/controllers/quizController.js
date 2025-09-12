const quizService = require('../services/quizService');
const attemptService = require('../services/attemptService');
const { Quiz, Question } = require('../models');

const logger = require('../services/loggerService');
const { validationResult } = require('express-validator');

class QuizController {
  /**
   * Get all quizzes with optional filtering
   */
  async getQuizzes(req, res) {
    try {
      const { category, search, includeExpired } = req.query;
      
      const filters = {
        category,
        search,
        includeExpired: includeExpired === 'true'
      };

      const quizzes = await quizService.getQuizzes(filters);
      
      res.json({
        success: true,
        data: quizzes,
        count: quizzes.length
      });
    } catch (error) {
      console.error('Error fetching quizzes:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch quizzes'
      });
    }
  }

  /**
   * Get quiz by ID
   */
  async getQuizById(req, res) {
    try {
      const { id } = req.params;
      const { includeQuestions } = req.query;

      const quiz = await quizService.getQuizById(
        parseInt(id), 
        includeQuestions === 'true'
      );

      res.json({
        success: true,
        data: quiz
      });
    } catch (error) {
      console.error('Error fetching quiz:', error);
      
      if (error.message === 'Quiz not found') {
        return res.status(404).json({
          success: false,
          error: 'Quiz not found'
        });
      }
      
      if (error.message === 'Quiz has expired') {
        return res.status(410).json({
          success: false,
          error: 'Quiz has expired'
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to fetch quiz'
      });
    }
  }

  /**
   * Get quiz categories
   */
  async getCategories(req, res) {
    try {
      const categories = await quizService.getCategories();
      
      res.json({
        success: true,
        data: categories
      });
    } catch (error) {
      console.error('Error fetching categories:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch categories'
      });
    }
  }

  /**
   * Start a quiz attempt - get random questions and create session
   */
  async startQuiz(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const quizId = parseInt(id);

      // Validate quiz access
      const quiz = await quizService.getQuizById(quizId);
      quizService.validateQuizAccess(quiz);

      // Check if user can start quiz (rate limiting)
      const canStart = await attemptService.canUserStartQuiz(userId, quizId);
      if (!canStart) {
        return res.status(429).json({
          success: false,
          error: 'You have already taken this quiz recently. Please wait 24 hours before retrying.'
        });
      }

      // Get random questions for the quiz
      const questions = await quizService.getRandomQuestions(quizId, 10);

      // Create attempt session
      const session = await attemptService.startAttempt(userId, quizId, { questions });

      res.json({
        success: true,
        data: {
          sessionId: session.sessionId,
          quiz: {
            id: quiz.id,
            title: quiz.title,
            category: quiz.category,
            description: quiz.description,
            timeLimit: quiz.timeLimit
          },
          questions,
          startTime: session.startTime.toISOString(),
          timeLimit: quiz.timeLimit
        }
      });
    } catch (error) {
      console.error('Error starting quiz:', error);
      
      if (error.message === 'Quiz not found') {
        return res.status(404).json({
          success: false,
          error: 'Quiz not found'
        });
      }
      
      if (error.message === 'Quiz has expired') {
        return res.status(410).json({
          success: false,
          error: 'Quiz has expired'
        });
      }

      if (error.message === 'No questions available for this quiz') {
        return res.status(400).json({
          success: false,
          error: 'No questions available for this quiz'
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to start quiz'
      });
    }
  }

  /**
   * Submit quiz answers and save attempt
   */
  async submitQuiz(req, res) {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Invalid input',
          details: errors.array()
        });
      }

      const { id } = req.params;
      const { answers, startTime, timeTaken, sessionId } = req.body;
      const userId = req.user.id;
      const quizId = parseInt(id);

      // Validate required fields
      if (!answers || typeof answers !== 'object') {
        return res.status(400).json({
          success: false,
          error: 'Answers are required and must be an object'
        });
      }

      if (!timeTaken || timeTaken < 1) {
        return res.status(400).json({
          success: false,
          error: 'Valid time taken is required'
        });
      }

      // Validate answers format
      const answerKeys = Object.keys(answers);
      if (answerKeys.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'At least one answer must be provided'
        });
      }

      // Validate that all answer keys are valid question IDs (numbers)
      const invalidAnswerKeys = answerKeys.filter(key => isNaN(parseInt(key)));
      if (invalidAnswerKeys.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'Invalid question IDs in answers',
          details: { invalidKeys: invalidAnswerKeys }
        });
      }

      // Submit attempt and get results
      const result = await attemptService.submitAttempt(
        userId, 
        quizId, 
        answers, 
        timeTaken, 
        startTime
      );

      res.json({
        success: true,
        data: {
          attemptId: result.attempt.id,
          score: result.totalScore,
          maxScore: result.maxScore,
          percentage: result.percentage,
          results: result.results,
          timeTaken,
          completedAt: result.attempt.completedAt.toISOString()
        }
      });
    } catch (error) {
      console.error('Error submitting quiz:', error);
      
      if (error.message === 'Quiz not found') {
        return res.status(404).json({
          success: false,
          error: 'Quiz not found'
        });
      }
      
      if (error.message === 'Quiz has expired') {
        return res.status(410).json({
          success: false,
          error: 'Quiz has expired'
        });
      }

      if (error.message === 'Quiz submission exceeded time limit') {
        return res.status(400).json({
          success: false,
          error: 'Quiz submission exceeded time limit'
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to submit quiz'
      });
    }
  }

  /**
   * Create a new quiz (admin functionality)
   */
  async createQuiz(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Invalid input',
          details: errors.array()
        });
      }

      const { title, category, description, timeLimit, expiresAt } = req.body;

      const quiz = await Quiz.create({
        title,
        category,
        description,
        timeLimit,
        expiresAt: expiresAt ? new Date(expiresAt) : null
      });

      res.status(201).json({
        success: true,
        data: quiz,
        message: 'Quiz created successfully'
      });
    } catch (error) {
      console.error('Error creating quiz:', error);
      
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
        error: 'Failed to create quiz'
      });
    }
  }

  /**
   * Update quiz (admin functionality)
   */
  async updateQuiz(req, res) {
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
      const { title, category, description, timeLimit, expiresAt } = req.body;

      const quiz = await Quiz.findByPk(id);
      if (!quiz) {
        return res.status(404).json({
          success: false,
          error: 'Quiz not found'
        });
      }

      await quiz.update({
        title,
        category,
        description,
        timeLimit,
        expiresAt: expiresAt ? new Date(expiresAt) : null
      });

      res.json({
        success: true,
        data: quiz,
        message: 'Quiz updated successfully'
      });
    } catch (error) {
      console.error('Error updating quiz:', error);
      
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
        error: 'Failed to update quiz'
      });
    }
  }

  /**
   * Get quiz leaderboard
   */
  async getQuizLeaderboard(req, res) {
    try {
      const { id } = req.params;
      const { limit = 10 } = req.query;

      const leaderboard = await attemptService.getQuizLeaderboard(
        parseInt(id), 
        parseInt(limit)
      );

      res.json({
        success: true,
        data: leaderboard
      });
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch leaderboard'
      });
    }
  }

  /**
   * Get user's quiz attempts
   */
  async getUserAttempts(req, res) {
    try {
      const userId = req.user.id;
      const { quizId, startDate, endDate, limit, offset } = req.query;

      const filters = {
        quizId: quizId ? parseInt(quizId) : undefined,
        startDate,
        endDate,
        limit: limit ? parseInt(limit) : 50,
        offset: offset ? parseInt(offset) : 0
      };

      const attempts = await attemptService.getUserAttempts(userId, filters);

      res.json({
        success: true,
        data: attempts
      });
    } catch (error) {
      console.error('Error fetching user attempts:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch attempts'
      });
    }
  }

  /**
   * Get user statistics
   */
  async getUserStatistics(req, res) {
    try {
      const userId = req.user.id;
      const stats = await attemptService.getUserStatistics(userId);

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Error fetching user statistics:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch statistics'
      });
    }
  }

  /**
   * Get attempt details
   */
  async getAttemptDetails(req, res) {
    try {
      const { attemptId } = req.params;
      const userId = req.user.id;

      const attempt = await attemptService.getAttemptById(
        parseInt(attemptId), 
        userId
      );

      res.json({
        success: true,
        data: attempt
      });
    } catch (error) {
      console.error('Error fetching attempt details:', error);
      
      if (error.message === 'Attempt not found') {
        return res.status(404).json({
          success: false,
          error: 'Attempt not found'
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to fetch attempt details'
      });
    }
  }

  /**
   * Delete quiz (soft delete)
   */
  async deleteQuiz(req, res) {
    try {
      const { id } = req.params;

      const quiz = await Quiz.findByPk(id);
      if (!quiz) {
        return res.status(404).json({
          success: false,
          error: 'Quiz not found'
        });
      }

      await quiz.destroy(); // Soft delete due to paranoid: true

      res.json({
        success: true,
        message: 'Quiz deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting quiz:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete quiz'
      });
    }
  }
}

module.exports = new QuizController();