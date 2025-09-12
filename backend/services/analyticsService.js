const { Attempt, Quiz, Question, User, sequelize } = require('../models');
const { QueryTypes, Op } = require('sequelize');

class AnalyticsService {
  /**
   * Get comprehensive quiz performance metrics
   */
  async getQuizAnalytics(quizId, options = {}) {
    const {
      startDate = null,
      endDate = null,
      includeQuestionAnalytics = true
    } = options;

    try {
      // Validate quiz exists
      const quiz = await Quiz.findByPk(quizId, {
        attributes: ['id', 'title', 'category', 'createdAt']
      });

      if (!quiz) {
        throw new Error('Quiz not found');
      }

      // Build date filter for attempts
      let dateFilter = '';
      const replacements = { quizId };
      
      if (startDate || endDate) {
        const conditions = [];
        if (startDate) {
          conditions.push('a.completed_at >= :startDate');
          replacements.startDate = new Date(startDate);
        }
        if (endDate) {
          conditions.push('a.completed_at <= :endDate');
          replacements.endDate = new Date(endDate);
        }
        dateFilter = `AND ${conditions.join(' AND ')}`;
      }

      // Get basic quiz statistics
      const basicStatsQuery = `
        SELECT 
          COUNT(DISTINCT a.user_id) as totalParticipants,
          COUNT(a.id) as totalAttempts,
          AVG(a.score) as averageScore,
          STDDEV(a.score) as scoreStdDev,
          MAX(a.score) as highestScore,
          MIN(a.score) as lowestScore,
          AVG(a.time_taken) as averageTime,
          STDDEV(a.time_taken) as timeStdDev,
          a.max_score as maxPossibleScore,
          PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY a.score) as medianScore,
          PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY a.score) as q1Score,
          PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY a.score) as q3Score
        FROM attempts a
        JOIN users u ON a.user_id = u.id
        WHERE a.quiz_id = :quizId AND u.deleted_at IS NULL
        ${dateFilter}
        GROUP BY a.max_score
      `;

      const [basicStats] = await sequelize.query(basicStatsQuery, {
        replacements,
        type: QueryTypes.SELECT
      });

      // Get completion rate over time (daily)
      const completionTrendQuery = `
        SELECT 
          DATE(a.completed_at) as date,
          COUNT(a.id) as attempts,
          COUNT(DISTINCT a.user_id) as uniqueUsers,
          AVG(a.score) as avgScore
        FROM attempts a
        JOIN users u ON a.user_id = u.id
        WHERE a.quiz_id = :quizId AND u.deleted_at IS NULL
        ${dateFilter}
        GROUP BY DATE(a.completed_at)
        ORDER BY date DESC
        LIMIT 30
      `;
      
      const completionTrend = await sequelize.query(completionTrendQuery, {
        replacements,
        type: QueryTypes.SELECT
      });

      // Get score distribution
      const scoreDistributionQuery = `
        SELECT 
          CASE 
            WHEN (a.score / a.max_score * 100) >= 90 THEN 'A (90-100%)'
            WHEN (a.score / a.max_score * 100) >= 80 THEN 'B (80-89%)'
            WHEN (a.score / a.max_score * 100) >= 70 THEN 'C (70-79%)'
            WHEN (a.score / a.max_score * 100) >= 60 THEN 'D (60-69%)'
            ELSE 'F (0-59%)'
          END as grade,
          COUNT(a.id) as count,
          ROUND(COUNT(a.id) * 100.0 / SUM(COUNT(a.id)) OVER (), 2) as percentage
        FROM attempts a
        JOIN users u ON a.user_id = u.id
        WHERE a.quiz_id = :quizId AND u.deleted_at IS NULL
        ${dateFilter}
        GROUP BY grade
        ORDER BY 
          CASE grade
            WHEN 'A (90-100%)' THEN 1
            WHEN 'B (80-89%)' THEN 2
            WHEN 'C (70-79%)' THEN 3
            WHEN 'D (60-69%)' THEN 4
            WHEN 'F (0-59%)' THEN 5
          END
      `;

      const scoreDistribution = await sequelize.query(scoreDistributionQuery, {
        replacements,
        type: QueryTypes.SELECT
      });

      let questionAnalytics = null;
      if (includeQuestionAnalytics) {
        questionAnalytics = await this.getQuestionAnalytics(quizId, { startDate, endDate });
      }

      // Calculate derived metrics
      const analytics = {
        quiz: {
          id: quiz.id,
          title: quiz.title,
          category: quiz.category,
          createdAt: quiz.createdAt
        },
        overview: {
          totalParticipants: parseInt(basicStats?.totalParticipants || 0),
          totalAttempts: parseInt(basicStats?.totalAttempts || 0),
          averageScore: parseFloat(basicStats?.averageScore || 0).toFixed(2),
          scoreStandardDeviation: parseFloat(basicStats?.scoreStdDev || 0).toFixed(2),
          highestScore: parseFloat(basicStats?.highestScore || 0),
          lowestScore: parseFloat(basicStats?.lowestScore || 0),
          maxPossibleScore: parseFloat(basicStats?.maxPossibleScore || 0),
          averagePercentage: basicStats?.maxPossibleScore > 0 
            ? parseFloat((basicStats.averageScore / basicStats.maxPossibleScore * 100)).toFixed(2)
            : '0.00',
          medianScore: parseFloat(basicStats?.medianScore || 0).toFixed(2),
          q1Score: parseFloat(basicStats?.q1Score || 0).toFixed(2),
          q3Score: parseFloat(basicStats?.q3Score || 0).toFixed(2)
        },
        timeMetrics: {
          averageTime: Math.round(parseFloat(basicStats?.averageTime || 0)),
          timeStandardDeviation: Math.round(parseFloat(basicStats?.timeStdDev || 0)),
          averageTimeFormatted: this.formatTime(Math.round(parseFloat(basicStats?.averageTime || 0)))
        },
        trends: {
          completionTrend: completionTrend.map(trend => ({
            date: trend.date,
            attempts: parseInt(trend.attempts),
            uniqueUsers: parseInt(trend.uniqueUsers),
            avgScore: parseFloat(trend.avgScore).toFixed(2)
          }))
        },
        distribution: {
          scoreDistribution: scoreDistribution.map(dist => ({
            grade: dist.grade,
            count: parseInt(dist.count),
            percentage: parseFloat(dist.percentage)
          }))
        },
        questionAnalytics,
        filters: {
          startDate,
          endDate,
          includeQuestionAnalytics
        }
      };

      return analytics;
    } catch (error) {
      throw new Error(`Failed to get quiz analytics: ${error.message}`);
    }
  }

  /**
   * Get question-level analytics for a quiz
   */
  async getQuestionAnalytics(quizId, options = {}) {
    const { startDate = null, endDate = null } = options;

    try {
      // Build date filter
      let dateFilter = '';
      const replacements = { quizId };
      
      if (startDate || endDate) {
        const conditions = [];
        if (startDate) {
          conditions.push('a.completed_at >= :startDate');
          replacements.startDate = new Date(startDate);
        }
        if (endDate) {
          conditions.push('a.completed_at <= :endDate');
          replacements.endDate = new Date(endDate);
        }
        dateFilter = `AND ${conditions.join(' AND ')}`;
      }

      // Get question statistics by analyzing answers in attempts
      const questionStatsQuery = `
        SELECT 
          q.id as questionId,
          q.question,
          q.question_type as questionType,
          q.points,
          q.correct_answer as correctAnswer,
          COUNT(a.id) as totalAttempts,
          SUM(
            CASE 
              WHEN q.question_type = 'single' THEN
                CASE WHEN JSON_UNQUOTE(JSON_EXTRACT(a.answers, CONCAT('$."', q.id, '"'))) = q.correct_answer THEN 1 ELSE 0 END
              ELSE
                CASE WHEN JSON_UNQUOTE(JSON_EXTRACT(a.answers, CONCAT('$."', q.id, '"'))) IS NOT NULL THEN 1 ELSE 0 END
            END
          ) as correctAttempts,
          AVG(
            CASE 
              WHEN q.question_type = 'single' THEN
                CASE WHEN JSON_UNQUOTE(JSON_EXTRACT(a.answers, CONCAT('$."', q.id, '"'))) = q.correct_answer THEN q.points ELSE 0 END
              ELSE q.points * 0.5
            END
          ) as averageScore
        FROM questions q
        LEFT JOIN attempts a ON a.quiz_id = q.quiz_id
        LEFT JOIN users u ON a.user_id = u.id
        WHERE q.quiz_id = :quizId 
          AND q.deleted_at IS NULL 
          AND (a.id IS NULL OR u.deleted_at IS NULL)
          ${dateFilter}
        GROUP BY q.id, q.question, q.question_type, q.points, q.correct_answer
        ORDER BY 
          CASE 
            WHEN COUNT(a.id) > 0 THEN (SUM(
              CASE 
                WHEN q.question_type = 'single' THEN
                  CASE WHEN JSON_UNQUOTE(JSON_EXTRACT(a.answers, CONCAT('$."', q.id, '"'))) = q.correct_answer THEN 1 ELSE 0 END
                ELSE 1
              END
            ) * 100.0 / COUNT(a.id))
            ELSE 0
          END ASC
      `;

      const questionStats = await sequelize.query(questionStatsQuery, {
        replacements,
        type: QueryTypes.SELECT
      });

      return questionStats.map(stat => ({
        questionId: parseInt(stat.questionId),
        question: stat.question,
        questionType: stat.questionType,
        points: parseInt(stat.points),
        totalAttempts: parseInt(stat.totalAttempts),
        correctAttempts: parseInt(stat.correctAttempts),
        successRate: stat.totalAttempts > 0 
          ? parseFloat((stat.correctAttempts / stat.totalAttempts * 100)).toFixed(2)
          : '0.00',
        averageScore: parseFloat(stat.averageScore || 0).toFixed(2),
        difficulty: this.calculateDifficulty(stat.correctAttempts, stat.totalAttempts)
      }));
    } catch (error) {
      throw new Error(`Failed to get question analytics: ${error.message}`);
    }
  }

  /**
   * Identify hardest questions based on success rates
   */
  async getHardestQuestions(options = {}) {
    const {
      limit = 10,
      category = null,
      minAttempts = 5,
      startDate = null,
      endDate = null
    } = options;

    try {
      // Build filters
      let categoryFilter = '';
      let dateFilter = '';
      const replacements = { limit, minAttempts };

      if (category) {
        categoryFilter = 'AND quiz.category = :category';
        replacements.category = category;
      }

      if (startDate || endDate) {
        const conditions = [];
        if (startDate) {
          conditions.push('a.completed_at >= :startDate');
          replacements.startDate = new Date(startDate);
        }
        if (endDate) {
          conditions.push('a.completed_at <= :endDate');
          replacements.endDate = new Date(endDate);
        }
        dateFilter = `AND ${conditions.join(' AND ')}`;
      }

      const hardestQuestionsQuery = `
        SELECT 
          q.id as questionId,
          q.question,
          q.question_type as questionType,
          q.points,
          quiz.id as quizId,
          quiz.title as quizTitle,
          quiz.category as quizCategory,
          COUNT(a.id) as totalAttempts,
          SUM(
            CASE 
              WHEN q.question_type = 'single' THEN
                CASE WHEN JSON_UNQUOTE(JSON_EXTRACT(a.answers, CONCAT('$."', q.id, '"'))) = q.correct_answer THEN 1 ELSE 0 END
              ELSE
                CASE WHEN JSON_UNQUOTE(JSON_EXTRACT(a.answers, CONCAT('$."', q.id, '"'))) IS NOT NULL THEN 1 ELSE 0 END
            END
          ) as correctAttempts,
          ROUND(
            CASE 
              WHEN COUNT(a.id) > 0 THEN
                (SUM(
                  CASE 
                    WHEN q.question_type = 'single' THEN
                      CASE WHEN JSON_UNQUOTE(JSON_EXTRACT(a.answers, CONCAT('$."', q.id, '"'))) = q.correct_answer THEN 1 ELSE 0 END
                    ELSE 1
                  END
                ) * 100.0 / COUNT(a.id))
              ELSE 0
            END, 2
          ) as successRate
        FROM questions q
        JOIN quizzes quiz ON q.quiz_id = quiz.id
        LEFT JOIN attempts a ON a.quiz_id = q.quiz_id
        LEFT JOIN users u ON a.user_id = u.id
        WHERE q.deleted_at IS NULL 
          AND quiz.deleted_at IS NULL
          AND (a.id IS NULL OR u.deleted_at IS NULL)
          ${categoryFilter}
          ${dateFilter}
        GROUP BY q.id, q.question, q.question_type, q.points, quiz.id, quiz.title, quiz.category
        HAVING COUNT(a.id) >= :minAttempts
        ORDER BY successRate ASC, totalAttempts DESC
        LIMIT :limit
      `;

      const hardestQuestions = await sequelize.query(hardestQuestionsQuery, {
        replacements,
        type: QueryTypes.SELECT
      });

      return hardestQuestions.map(question => ({
        questionId: parseInt(question.questionId),
        question: question.question,
        questionType: question.questionType,
        points: parseInt(question.points),
        quiz: {
          id: parseInt(question.quizId),
          title: question.quizTitle,
          category: question.quizCategory
        },
        statistics: {
          totalAttempts: parseInt(question.totalAttempts),
          correctAttempts: parseInt(question.correctAttempts),
          successRate: parseFloat(question.successRate),
          difficulty: this.calculateDifficulty(question.correctAttempts, question.totalAttempts)
        }
      }));
    } catch (error) {
      throw new Error(`Failed to get hardest questions: ${error.message}`);
    }
  }

  /**
   * Get most popular quizzes by attempt count
   */
  async getMostPopularQuizzes(options = {}) {
    const {
      limit = 10,
      category = null,
      timeframe = null, // 'week', 'month', 'year'
      startDate = null,
      endDate = null
    } = options;

    try {
      // Build filters
      let categoryFilter = '';
      let dateFilter = '';
      const replacements = { limit };

      if (category) {
        categoryFilter = 'AND q.category = :category';
        replacements.category = category;
      }

      // Handle timeframe or custom date range
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
      } else if (startDate || endDate) {
        const conditions = [];
        if (startDate) {
          conditions.push('a.completed_at >= :startDate');
          replacements.startDate = new Date(startDate);
        }
        if (endDate) {
          conditions.push('a.completed_at <= :endDate');
          replacements.endDate = new Date(endDate);
        }
        dateFilter = `AND ${conditions.join(' AND ')}`;
      }

      const popularQuizzesQuery = `
        SELECT 
          q.id as quizId,
          q.title,
          q.category,
          q.description,
          q.created_at as createdAt,
          COUNT(a.id) as totalAttempts,
          COUNT(DISTINCT a.user_id) as uniqueParticipants,
          AVG(a.score) as averageScore,
          MAX(a.score) as highestScore,
          AVG(a.time_taken) as averageTime,
          a.max_score as maxPossibleScore,
          ROUND(AVG(a.score / a.max_score * 100), 2) as averagePercentage,
          COUNT(CASE WHEN a.completed_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 END) as attemptsThisWeek,
          COUNT(CASE WHEN a.completed_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 END) as attemptsThisMonth
        FROM quizzes q
        LEFT JOIN attempts a ON q.id = a.quiz_id
        LEFT JOIN users u ON a.user_id = u.id
        WHERE q.deleted_at IS NULL
          AND (a.id IS NULL OR u.deleted_at IS NULL)
          ${categoryFilter}
          ${dateFilter}
        GROUP BY q.id, q.title, q.category, q.description, q.created_at, a.max_score
        HAVING COUNT(a.id) > 0
        ORDER BY totalAttempts DESC, uniqueParticipants DESC
        LIMIT :limit
      `;

      const popularQuizzes = await sequelize.query(popularQuizzesQuery, {
        replacements,
        type: QueryTypes.SELECT
      });

      return popularQuizzes.map(quiz => ({
        quiz: {
          id: parseInt(quiz.quizId),
          title: quiz.title,
          category: quiz.category,
          description: quiz.description,
          createdAt: new Date(quiz.createdAt)
        },
        popularity: {
          totalAttempts: parseInt(quiz.totalAttempts),
          uniqueParticipants: parseInt(quiz.uniqueParticipants),
          attemptsThisWeek: parseInt(quiz.attemptsThisWeek),
          attemptsThisMonth: parseInt(quiz.attemptsThisMonth)
        },
        performance: {
          averageScore: parseFloat(quiz.averageScore).toFixed(2),
          highestScore: parseFloat(quiz.highestScore),
          maxPossibleScore: parseFloat(quiz.maxPossibleScore),
          averagePercentage: parseFloat(quiz.averagePercentage),
          averageTime: Math.round(parseFloat(quiz.averageTime)),
          averageTimeFormatted: this.formatTime(Math.round(parseFloat(quiz.averageTime)))
        }
      }));
    } catch (error) {
      throw new Error(`Failed to get popular quizzes: ${error.message}`);
    }
  }

  /**
   * Get comprehensive analytics dashboard data
   */
  async getDashboardAnalytics(options = {}) {
    const {
      timeframe = 'month',
      category = null,
      limit = 5
    } = options;

    try {
      // Get overview statistics
      const overview = await this.getOverviewStatistics({ timeframe, category });
      
      // Get popular quizzes
      const popularQuizzes = await this.getMostPopularQuizzes({ 
        limit, 
        timeframe, 
        category 
      });
      
      // Get hardest questions
      const hardestQuestions = await this.getHardestQuestions({ 
        limit, 
        category,
        minAttempts: 3
      });

      // Get recent activity trends
      const activityTrends = await this.getActivityTrends({ timeframe, category });

      return {
        overview,
        popularQuizzes,
        hardestQuestions,
        activityTrends,
        filters: {
          timeframe,
          category,
          limit
        }
      };
    } catch (error) {
      throw new Error(`Failed to get dashboard analytics: ${error.message}`);
    }
  }

  /**
   * Get overview statistics for dashboard
   */
  async getOverviewStatistics(options = {}) {
    const { timeframe = 'month', category = null } = options;

    try {
      // Build filters
      let categoryFilter = '';
      let dateFilter = '';
      const replacements = {};

      if (category) {
        categoryFilter = 'AND q.category = :category';
        replacements.category = category;
      }

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

      const overviewQuery = `
        SELECT 
          COUNT(DISTINCT q.id) as totalQuizzes,
          COUNT(DISTINCT a.user_id) as totalUsers,
          COUNT(a.id) as totalAttempts,
          AVG(a.score / a.max_score * 100) as overallAveragePercentage,
          COUNT(DISTINCT q.category) as totalCategories,
          AVG(a.time_taken) as averageCompletionTime
        FROM quizzes q
        LEFT JOIN attempts a ON q.id = a.quiz_id
        LEFT JOIN users u ON a.user_id = u.id
        WHERE q.deleted_at IS NULL
          AND (a.id IS NULL OR u.deleted_at IS NULL)
          ${categoryFilter}
          ${dateFilter}
      `;

      const [overview] = await sequelize.query(overviewQuery, {
        replacements,
        type: QueryTypes.SELECT
      });

      return {
        totalQuizzes: parseInt(overview?.totalQuizzes || 0),
        totalUsers: parseInt(overview?.totalUsers || 0),
        totalAttempts: parseInt(overview?.totalAttempts || 0),
        overallAveragePercentage: parseFloat(overview?.overallAveragePercentage || 0).toFixed(2),
        totalCategories: parseInt(overview?.totalCategories || 0),
        averageCompletionTime: Math.round(parseFloat(overview?.averageCompletionTime || 0)),
        averageCompletionTimeFormatted: this.formatTime(Math.round(parseFloat(overview?.averageCompletionTime || 0)))
      };
    } catch (error) {
      throw new Error(`Failed to get overview statistics: ${error.message}`);
    }
  }

  /**
   * Get activity trends over time
   */
  async getActivityTrends(options = {}) {
    const { timeframe = 'month', category = null } = options;

    try {
      // Build filters
      let categoryFilter = '';
      let dateFilter = '';
      const replacements = {};

      if (category) {
        categoryFilter = 'AND q.category = :category';
        replacements.category = category;
      }

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

      const trendsQuery = `
        SELECT 
          DATE(a.completed_at) as date,
          COUNT(a.id) as attempts,
          COUNT(DISTINCT a.user_id) as uniqueUsers,
          AVG(a.score / a.max_score * 100) as averagePercentage,
          AVG(a.time_taken) as averageTime
        FROM attempts a
        JOIN quizzes q ON a.quiz_id = q.id
        JOIN users u ON a.user_id = u.id
        WHERE q.deleted_at IS NULL 
          AND u.deleted_at IS NULL
          ${categoryFilter}
          ${dateFilter}
        GROUP BY DATE(a.completed_at)
        ORDER BY date DESC
        LIMIT 30
      `;

      const trends = await sequelize.query(trendsQuery, {
        replacements,
        type: QueryTypes.SELECT
      });

      return trends.map(trend => ({
        date: trend.date,
        attempts: parseInt(trend.attempts),
        uniqueUsers: parseInt(trend.uniqueUsers),
        averagePercentage: parseFloat(trend.averagePercentage).toFixed(2),
        averageTime: Math.round(parseFloat(trend.averageTime))
      }));
    } catch (error) {
      throw new Error(`Failed to get activity trends: ${error.message}`);
    }
  }

  /**
   * Helper method to calculate question difficulty
   */
  calculateDifficulty(correctAttempts, totalAttempts) {
    if (totalAttempts === 0) return 'Unknown';
    
    const successRate = (correctAttempts / totalAttempts) * 100;
    
    if (successRate >= 80) return 'Easy';
    if (successRate >= 60) return 'Medium';
    if (successRate >= 40) return 'Hard';
    return 'Very Hard';
  }

  /**
   * Helper method to format time in seconds to readable format
   */
  formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  }
}

module.exports = new AnalyticsService();