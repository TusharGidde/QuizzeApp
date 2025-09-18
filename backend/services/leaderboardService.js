const { Attempt, Quiz, User, sequelize } = require('../models');
const { QueryTypes, Op } = require('sequelize');

class LeaderboardService {
  /**
   * Get leaderboard for a specific quiz with best scores per user
   */
  //   async getQuizLeaderboard(quizId, options = {}) {
  //     const {
  //       limit = 10,
  //       offset = 0,
  //       includeUserRank = false,
  //       userId = null
  //     } = options;

  //     try {
  //       // Validate quiz exists
  //       const quiz = await Quiz.findByPk(quizId, {
  //         attributes: ['id', 'title', 'category']
  //       });

  //       if (!quiz) {
  //         throw new Error('Quiz not found');
  //       }

  //       // Get leaderboard with best scores per user
  //       const query = `
  //         SELECT 
  //     a.user_id AS userId,
  //     u.name AS userName,
  //     MAX(a.score) AS bestScore,
  //     a.max_score AS maxScore,
  //     MIN(a.completed_at) AS firstCompletedAt,
  //     COUNT(a.id) AS attemptCount,
  //     ROUND((MAX(a.score) / a.max_score) * 100, 2) AS percentage,
  //     ROW_NUMBER() OVER (ORDER BY MAX(a.score) DESC, MIN(a.completed_at) ASC) AS rank
  // FROM attempts a
  // JOIN users u ON a.user_id = u.id
  // WHERE a.quiz_id = :quizId
  //   AND u.deleted_at IS NULL
  // GROUP BY a.user_id, u.name, a.max_score
  // ORDER BY bestScore DESC, firstCompletedAt ASC
  // LIMIT :limit OFFSET :offset;
  //       `;

  //       const leaderboard = await sequelize.query(query, {
  //         replacements: { quizId, limit, offset },
  //         type: QueryTypes.SELECT,
  //       });


  //       // Get total participants count
  //       const totalParticipantsQuery = `
  //         SELECT COUNT(DISTINCT a.user_id) as totalParticipants
  //         FROM attempts a
  //         JOIN users u ON a.user_id = u.id
  //         WHERE a.quiz_id = :quizId AND u.deleted_at IS NULL
  //       `;

  //       const [{ totalParticipants }] = await sequelize.query(totalParticipantsQuery, {
  //         replacements: { quizId },
  //         type: QueryTypes.SELECT
  //       });

  //       let userRank = null;
  //       if (includeUserRank && userId) {
  //         userRank = await this.getUserRankInQuiz(userId, quizId);
  //       }

  //       return {
  //         quiz: {
  //           id: quiz.id,
  //           title: quiz.title,
  //           category: quiz.category
  //         },
  //         leaderboard: leaderboard.map(entry => ({
  //           ...entry,
  //           rank: parseInt(entry.rank),
  //           bestScore: parseFloat(entry.bestScore),
  //           maxScore: parseFloat(entry.maxScore),
  //           percentage: parseFloat(entry.percentage),
  //           attemptCount: parseInt(entry.attemptCount),
  //           firstCompletedAt: new Date(entry.firstCompletedAt)
  //         })),
  //         pagination: {
  //           limit,
  //           offset,
  //           totalParticipants: parseInt(totalParticipants)
  //         },
  //         userRank
  //       };
  //     } catch (error) {
  //       throw new Error(`Failed to get quiz leaderboard: ${error.message}`);
  //     }
  //   }
  // leaderboardService.js


  async getQuizLeaderboard(quizId, options) {
    const { limit, offset, includeUserRank, userId } = options;

    // Main leaderboard query
    const leaderboardQuery = `
    SELECT 
      a.user_id,
      u.name AS userName,
      a.score,
      RANK() OVER (ORDER BY a.score DESC) AS \`rank\`
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
          RANK() OVER (ORDER BY a.score DESC) AS \`rank\`
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
   * Get user's rank in a specific quiz
   */
  async getUserRankInQuiz(userId, quizId) {
    try {
      const query = `
        SELECT 
          user_rank.rank,
          user_rank.bestScore,
          user_rank.maxScore,
          user_rank.percentage,
          user_rank.attemptCount
        FROM (
          SELECT 
            a.user_id as userId,
            MAX(a.score) as bestScore,
            a.max_score as maxScore,
            ROUND((MAX(a.score) / a.max_score) * 100, 2) as percentage,
            COUNT(a.id) as attemptCount,
            ROW_NUMBER() OVER (ORDER BY MAX(a.score) DESC, MIN(a.completed_at) ASC) as rank
          FROM attempts a
          JOIN users u ON a.user_id = u.id
          WHERE a.quiz_id = :quizId AND u.deleted_at IS NULL
          GROUP BY a.user_id, a.max_score
        ) as user_rank
        WHERE user_rank.userId = :userId
      `;

      const result = await sequelize.query(query, {
        replacements: { quizId, userId },
        type: QueryTypes.SELECT
      });

      if (result.length === 0) {
        return null; // User hasn't attempted this quiz
      }

      const userRank = result[0];
      return {
        rank: parseInt(userRank.rank),
        bestScore: parseFloat(userRank.bestScore),
        maxScore: parseFloat(userRank.maxScore),
        percentage: parseFloat(userRank.percentage),
        attemptCount: parseInt(userRank.attemptCount)
      };
    } catch (error) {
      throw new Error(`Failed to get user rank: ${error.message}`);
    }
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
   * Get leaderboard statistics for a quiz
   */
  async getQuizLeaderboardStats(quizId) {
    try {
      const statsQuery = `
        SELECT 
          COUNT(DISTINCT a.user_id) as totalParticipants,
          COUNT(a.id) as totalAttempts,
          AVG(a.score) as averageScore,
          MAX(a.score) as highestScore,
          MIN(a.score) as lowestScore,
          AVG(a.time_taken) as averageTime,
          a.max_score as maxPossibleScore
        FROM attempts a
        JOIN users u ON a.user_id = u.id
        WHERE a.quiz_id = :quizId AND u.deleted_at IS NULL
        GROUP BY a.max_score
      `;

      const [stats] = await sequelize.query(statsQuery, {
        replacements: { quizId },
        type: QueryTypes.SELECT
      });

      if (!stats) {
        return {
          totalParticipants: 0,
          totalAttempts: 0,
          averageScore: 0,
          highestScore: 0,
          lowestScore: 0,
          averageTime: 0,
          maxPossibleScore: 0,
          averagePercentage: 0
        };
      }

      return {
        totalParticipants: parseInt(stats.totalParticipants),
        totalAttempts: parseInt(stats.totalAttempts),
        averageScore: parseFloat(stats.averageScore).toFixed(2),
        highestScore: parseFloat(stats.highestScore),
        lowestScore: parseFloat(stats.lowestScore),
        averageTime: Math.round(parseFloat(stats.averageTime)),
        maxPossibleScore: parseFloat(stats.maxPossibleScore),
        averagePercentage: parseFloat((stats.averageScore / stats.maxPossibleScore * 100)).toFixed(2)
      };
    } catch (error) {
      throw new Error(`Failed to get quiz stats: ${error.message}`);
    }
  }

  /**
   * Get recent high scores across all quizzes
   */
  async getRecentHighScores(limit = 10) {
    try {
      const query = `
        SELECT 
          a.id as attemptId,
          a.user_id as userId,
          u.name as userName,
          a.quiz_id as quizId,
          q.title as quizTitle,
          q.category as quizCategory,
          a.score,
          a.max_score as maxScore,
          ROUND((a.score / a.max_score) * 100, 2) as percentage,
          a.completed_at as completedAt,
          a.time_taken as timeTaken
        FROM attempts a
        JOIN users u ON a.user_id = u.id
        JOIN quizzes q ON a.quiz_id = q.id
        WHERE u.deleted_at IS NULL AND q.deleted_at IS NULL
        AND a.score = (
          SELECT MAX(a2.score) 
          FROM attempts a2 
          WHERE a2.user_id = a.user_id AND a2.quiz_id = a.quiz_id
        )
        ORDER BY a.completed_at DESC
        LIMIT :limit
      `;

      const highScores = await sequelize.query(query, {
        replacements: { limit },
        type: QueryTypes.SELECT
      });

      return highScores.map(score => ({
        ...score,
        score: parseFloat(score.score),
        maxScore: parseFloat(score.maxScore),
        percentage: parseFloat(score.percentage),
        timeTaken: parseInt(score.timeTaken),
        completedAt: new Date(score.completedAt)
      }));
    } catch (error) {
      throw new Error(`Failed to get recent high scores: ${error.message}`);
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