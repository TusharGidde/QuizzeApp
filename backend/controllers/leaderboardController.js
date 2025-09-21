const leaderboardService = require('../services/leaderboardService');
const { validationResult } = require('express-validator');

class LeaderboardController {
  /**
   * Get leaderboard for a specific quiz
   * GET /api/leaderboard/quiz/:quizId
   */
  async getQuizLeaderboard(req, res) {
    try {
      // Check for validation errors
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
        limit = 10,
        offset = 0,
        includeUserRank = false
      } = req.query;

      const userId = req.user?.id || null;

      const options = {
        limit: parseInt(limit),
        offset: parseInt(offset),
        includeUserRank: includeUserRank === 'true',
        userId
      };
      
      const leaderboard = await leaderboardService.getQuizLeaderboard(quizId, options);

      res.json({
        success: true,
        data: leaderboard
      });
    } catch (error) {
      console.error('Error getting quiz leaderboard:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get quiz leaderboard'
      });
    }
  }


  /**
   * Get global leaderboard across all quizzes
   * GET /api/leaderboard/global
   */
  async getGlobalLeaderboard(req, res) {
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
        offset = 0,
        category = null,
        timeframe = null
      } = req.query;

      const options = {
        limit: parseInt(limit),
        offset: parseInt(offset),
        category,
        timeframe
      };

      const leaderboard = await leaderboardService.getGlobalLeaderboard(options);

      res.json({
        success: true,
        data: leaderboard
      });
    } catch (error) {
      console.error('Error getting global leaderboard:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get global leaderboard'
      });
    }
  }


}

module.exports = new LeaderboardController();