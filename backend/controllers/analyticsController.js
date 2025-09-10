const analyticsService = require('../services/analyticsService');
const { validationResult } = require('express-validator');

class AnalyticsController {
  /**
   * Get comprehensive analytics for a specific quiz
   */
  async getQuizAnalytics(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { quizId } = req.params;
      const {
        startDate,
        endDate,
        includeQuestionAnalytics = true
      } = req.query;

      const analytics = await analyticsService.getQuizAnalytics(quizId, {
        startDate,
        endDate,
        includeQuestionAnalytics: includeQuestionAnalytics === 'true'
      });

      res.json({
        success: true,
        data: analytics
      });
    } catch (error) {
      console.error('Error getting quiz analytics:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get quiz analytics'
      });
    }
  }

  /**
   * Get hardest questions across all quizzes or by category
   */
  async getHardestQuestions(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const {
        limit = 10,
        category,
        minAttempts = 5,
        startDate,
        endDate
      } = req.query;

      const hardestQuestions = await analyticsService.getHardestQuestions({
        limit: parseInt(limit),
        category,
        minAttempts: parseInt(minAttempts),
        startDate,
        endDate
      });

      res.json({
        success: true,
        data: {
          questions: hardestQuestions,
          filters: {
            limit: parseInt(limit),
            category,
            minAttempts: parseInt(minAttempts),
            startDate,
            endDate
          }
        }
      });
    } catch (error) {
      console.error('Error getting hardest questions:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get hardest questions'
      });
    }
  }

  /**
   * Get most popular quizzes by attempt count
   */
  async getMostPopularQuizzes(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const {
        limit = 10,
        category,
        timeframe,
        startDate,
        endDate
      } = req.query;

      const popularQuizzes = await analyticsService.getMostPopularQuizzes({
        limit: parseInt(limit),
        category,
        timeframe,
        startDate,
        endDate
      });

      res.json({
        success: true,
        data: {
          quizzes: popularQuizzes,
          filters: {
            limit: parseInt(limit),
            category,
            timeframe,
            startDate,
            endDate
          }
        }
      });
    } catch (error) {
      console.error('Error getting popular quizzes:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get popular quizzes'
      });
    }
  }

  /**
   * Get comprehensive dashboard analytics
   */
  async getDashboardAnalytics(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const {
        timeframe = 'month',
        category,
        limit = 5
      } = req.query;

      const dashboardData = await analyticsService.getDashboardAnalytics({
        timeframe,
        category,
        limit: parseInt(limit)
      });

      res.json({
        success: true,
        data: dashboardData
      });
    } catch (error) {
      console.error('Error getting dashboard analytics:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get dashboard analytics'
      });
    }
  }

  /**
   * Get question-level analytics for a specific quiz
   */
  async getQuestionAnalytics(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { quizId } = req.params;
      const { startDate, endDate } = req.query;

      const questionAnalytics = await analyticsService.getQuestionAnalytics(quizId, {
        startDate,
        endDate
      });

      res.json({
        success: true,
        data: {
          quizId: parseInt(quizId),
          questions: questionAnalytics,
          filters: {
            startDate,
            endDate
          }
        }
      });
    } catch (error) {
      console.error('Error getting question analytics:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get question analytics'
      });
    }
  }

  /**
   * Get overview statistics
   */
  async getOverviewStatistics(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const {
        timeframe = 'month',
        category
      } = req.query;

      const overview = await analyticsService.getOverviewStatistics({
        timeframe,
        category
      });

      res.json({
        success: true,
        data: {
          overview,
          filters: {
            timeframe,
            category
          }
        }
      });
    } catch (error) {
      console.error('Error getting overview statistics:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get overview statistics'
      });
    }
  }

  /**
   * Get activity trends over time
   */
  async getActivityTrends(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const {
        timeframe = 'month',
        category
      } = req.query;

      const trends = await analyticsService.getActivityTrends({
        timeframe,
        category
      });

      res.json({
        success: true,
        data: {
          trends,
          filters: {
            timeframe,
            category
          }
        }
      });
    } catch (error) {
      console.error('Error getting activity trends:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get activity trends'
      });
    }
  }

  /**
   * Export analytics data to CSV
   */
  async exportAnalyticsData(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const {
        type = 'quiz', // 'quiz', 'question', 'popular'
        quizId,
        category,
        startDate,
        endDate,
        limit = 100
      } = req.query;

      let data;
      let filename;

      switch (type) {
        case 'quiz':
          if (!quizId) {
            return res.status(400).json({
              success: false,
              message: 'Quiz ID is required for quiz analytics export'
            });
          }
          data = await analyticsService.getQuizAnalytics(quizId, {
            startDate,
            endDate,
            includeQuestionAnalytics: true
          });
          filename = `quiz-analytics-${quizId}-${new Date().toISOString().split('T')[0]}.json`;
          break;

        case 'questions':
          data = await analyticsService.getHardestQuestions({
            limit: parseInt(limit),
            category,
            startDate,
            endDate
          });
          filename = `hardest-questions-${new Date().toISOString().split('T')[0]}.json`;
          break;

        case 'popular':
          data = await analyticsService.getMostPopularQuizzes({
            limit: parseInt(limit),
            category,
            startDate,
            endDate
          });
          filename = `popular-quizzes-${new Date().toISOString().split('T')[0]}.json`;
          break;

        default:
          return res.status(400).json({
            success: false,
            message: 'Invalid export type. Must be quiz, questions, or popular'
          });
      }

      // Set headers for file download
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      
      res.json({
        success: true,
        exportedAt: new Date().toISOString(),
        type,
        filters: {
          quizId,
          category,
          startDate,
          endDate,
          limit: parseInt(limit)
        },
        data
      });
    } catch (error) {
      console.error('Error exporting analytics data:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to export analytics data'
      });
    }
  }
}

module.exports = new AnalyticsController();