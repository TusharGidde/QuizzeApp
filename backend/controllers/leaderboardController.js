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

      // Try to get cached leaderboard first
      let leaderboard = await leaderboardService.getCachedLeaderboard(quizId);
      
      if (!leaderboard) {
        leaderboard = await leaderboardService.getQuizLeaderboard(quizId, options);
        
        // Cache the result
        await leaderboardService.cacheLeaderboard(quizId, leaderboard);
      }

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
   * Get user's rank in a specific quiz
   * GET /api/leaderboard/quiz/:quizId/user/:userId/rank
   */
  async getUserRankInQuiz(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { quizId, userId } = req.params;

      // Ensure user can only access their own rank or admin access
      if (req.user.id !== parseInt(userId) && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      const userRank = await leaderboardService.getUserRankInQuiz(userId, quizId);

      if (!userRank) {
        return res.status(404).json({
          success: false,
          message: 'User has not attempted this quiz'
        });
      }

      res.json({
        success: true,
        data: userRank
      });
    } catch (error) {
      console.error('Error getting user rank:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get user rank'
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

  /**
   * Get leaderboard statistics for a quiz
   * GET /api/leaderboard/quiz/:quizId/stats
   */
  async getQuizLeaderboardStats(req, res) {
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

      const stats = await leaderboardService.getQuizLeaderboardStats(quizId);

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Error getting quiz stats:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get quiz statistics'
      });
    }
  }

  /**
   * Get recent high scores across all quizzes
   * GET /api/leaderboard/recent-high-scores
   */
  async getRecentHighScores(req, res) {
    try {
      const { limit = 10 } = req.query;

      const highScores = await leaderboardService.getRecentHighScores(parseInt(limit));

      res.json({
        success: true,
        data: highScores
      });
    } catch (error) {
      console.error('Error getting recent high scores:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get recent high scores'
      });
    }
  }

  /**
   * Refresh leaderboard cache for a quiz
   * POST /api/leaderboard/quiz/:quizId/refresh
   */
  async refreshQuizLeaderboard(req, res) {
    try {
      const { quizId } = req.params;

      // Invalidate cache
      await leaderboardService.invalidateLeaderboardCache(quizId);

      // Get fresh leaderboard data
      const leaderboard = await leaderboardService.getQuizLeaderboard(quizId, {
        limit: 10,
        offset: 0
      });

      // Cache the fresh data
      await leaderboardService.cacheLeaderboard(quizId, leaderboard);

      res.json({
        success: true,
        message: 'Leaderboard refreshed successfully',
        data: leaderboard
      });
    } catch (error) {
      console.error('Error refreshing leaderboard:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to refresh leaderboard'
      });
    }
  }
}

module.exports = new LeaderboardController();