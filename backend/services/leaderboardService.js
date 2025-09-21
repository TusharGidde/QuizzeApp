const { Attempt, Quiz, User, sequelize } = require('../models');
const { QueryTypes, Op } = require('sequelize');

class LeaderboardService {
  /**
   * Get leaderboard for a specific quiz with best scores per user
   */

  async getQuizLeaderboard(quizId, options) {
    const { limit, offset, includeUserRank, userId } = options;

    // Main leaderboard query
    const leaderboardQuery = `
    SELECT 
      a.user_id,
      u.name AS userName,
      a.score,
      DENSE_RANK() OVER (ORDER BY a.score DESC) AS \`rank\`
    FROM attempts a
    JOIN users u ON a.user_id = u.id
    WHERE a.quiz_id = :quizId
    ORDER BY a.score DESC
    LIMIT :limit OFFSET :offset
  `;

    const leaderboard = await sequelize.query(leaderboardQuery, {
      replacements: { quizId, limit, offset },
      type: sequelize.QueryTypes.SELECT
    });

    let userRank = null;

    if (includeUserRank && userId) {
      const userRankQuery = `
      SELECT \`rank\` FROM (
        SELECT 
          a.user_id,
          DENSE_RANK() OVER (ORDER BY a.score DESC) AS \`rank\`
        FROM attempts a
        WHERE a.quiz_id = :quizId
      ) ranked
      WHERE user_id = :userId
    `;

      const result = await sequelize.query(userRankQuery, {
        replacements: { quizId, userId },
        type: sequelize.QueryTypes.SELECT
      });

      userRank = result.length > 0 ? result[0].rank : null;
    }

    return {
      leaderboard,
      userRank
    };
  }




  /**
   * Get global leaderboard across all quizzes
   */
  async getGlobalLeaderboard(options = {}) {
    const {
      limit = 10,
      offset = 0,
      category = null,
      timeframe = null // 'week', 'month', 'year'
    } = options;

    try {
      let dateFilter = '';
      const replacements = { limit, offset };

      // Add timeframe filter
      if (timeframe) {
        const timeframes = {
          week: 7,
          month: 30,
          year: 365
        };

        if (timeframes[timeframe]) {
          dateFilter = 'AND a.completed_at >= DATE_SUB(NOW(), INTERVAL :days DAY)';
          replacements.days = timeframes[timeframe];
        }
      }

      // Add category filter
      let categoryFilter = '';
      if (category) {
        categoryFilter = 'AND q.category = :category';
        replacements.category = category;
      }

      const query = `
                        SELECT *,
              ROW_NUMBER() OVER (ORDER BY averagePercentage DESC, quizzesCompleted DESC) AS row_num
        FROM (
          SELECT 
            a.user_id as userId,
            u.name as userName,
            COUNT(DISTINCT a.quiz_id) as quizzesCompleted,
            COUNT(a.id) as totalAttempts,
            AVG(a.score / a.max_score * 100) as averagePercentage,
            SUM(a.score) as totalScore,
            SUM(a.max_score) as totalMaxScore,
            MAX(a.completed_at) as lastAttemptAt
          FROM attempts a
          JOIN users u ON a.user_id = u.id
          JOIN quizzes q ON a.quiz_id = q.id
          WHERE u.deleted_at IS NULL AND q.deleted_at IS NULL
          ${dateFilter}
          ${categoryFilter}
          GROUP BY a.user_id, u.name
          HAVING COUNT(DISTINCT a.quiz_id) >= 1
        ) AS leaderboard_data
        ORDER BY averagePercentage DESC, quizzesCompleted DESC
        LIMIT :limit OFFSET :offset;



      `;

      const leaderboard = await sequelize.query(query, {
        replacements,
        type: QueryTypes.SELECT
      });

      return {
        leaderboard: leaderboard.map(entry => ({
          ...entry,
          rank: parseInt(entry.rank),
          quizzesCompleted: parseInt(entry.quizzesCompleted),
          totalAttempts: parseInt(entry.totalAttempts),
          averagePercentage: parseFloat(entry.averagePercentage).toFixed(2),
          totalScore: parseFloat(entry.totalScore),
          totalMaxScore: parseFloat(entry.totalMaxScore),
          lastAttemptAt: new Date(entry.lastAttemptAt)
        })),
        filters: {
          category,
          timeframe
        },
        pagination: {
          limit,
          offset
        }
      };
    } catch (error) {
      throw new Error(`Failed to get global leaderboard: ${error.message}`);
    }
  }


  /**
   * Cache leaderboard data (placeholder for Redis implementation)
   */
  async cacheLeaderboard(quizId, leaderboardData, ttl = 300) {
    // TODO: Implement Redis caching
    // For now, we'll use in-memory caching as a placeholder
    const cacheKey = `leaderboard:quiz:${quizId}`;

    // In production, this would be:
    // await redis.setex(cacheKey, ttl, JSON.stringify(leaderboardData));

    // For now, just return the data
    return leaderboardData;
  }

}

module.exports = new LeaderboardService();