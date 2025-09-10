const { Attempt, Quiz, Question, User, sequelize } = require('../models');
const { Op } = require('sequelize');
const leaderboardService = require('./leaderboardService');

class AttemptService {
  /**
   * Create a new quiz attempt record when user starts a quiz
   */
  async startAttempt(userId, quizId, sessionData = {}) {
    const transaction = await sequelize.transaction();
    
    try {
      // Validate quiz exists and is accessible
      const quiz = await Quiz.findOne({
        where: { 
          id: quizId,
          deletedAt: null 
        },
        transaction
      });

      if (!quiz) {
        throw new Error('Quiz not found');
      }

      if (quiz.isExpired()) {
        throw new Error('Quiz has expired');
      }

      // Create session record (we'll store this in memory or Redis in production)
      const session = {
        userId,
        quizId,
        startTime: new Date(),
        questions: sessionData.questions || [],
        timeLimit: quiz.timeLimit,
        sessionId: `${userId}_${quizId}_${Date.now()}`
      };

      await transaction.commit();
      return session;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Submit quiz attempt and save to database
   */
  async submitAttempt(userId, quizId, answers, timeTaken, startTime) {
    const transaction = await sequelize.transaction();
    
    try {
      // Validate quiz exists
      const quiz = await Quiz.findOne({
        where: { 
          id: quizId,
          deletedAt: null 
        },
        transaction
      });

      if (!quiz) {
        throw new Error('Quiz not found');
      }

      // Validate time limit if set
      if (quiz.timeLimit && timeTaken > quiz.timeLimit * 60) {
        throw new Error('Quiz submission exceeded time limit');
      }

      // Calculate score using existing quiz service logic
      const questions = await Question.findAll({
        where: { 
          quizId: quizId,
          deletedAt: null 
        },
        transaction
      });

      if (questions.length === 0) {
        throw new Error('No questions found for this quiz');
      }

      let totalScore = 0;
      let maxScore = 0;
      const results = [];

      for (const question of questions) {
        maxScore += question.points;
        
        const userAnswer = answers[question.id];
        const score = question.calculateScore(userAnswer);
        totalScore += score;

        results.push({
          questionId: question.id,
          question: question.question,
          userAnswer: userAnswer || null,
          correctAnswer: question.correctAnswer,
          score,
          maxScore: question.points,
          isCorrect: question.isCorrectAnswer(userAnswer),
          questionType: question.questionType,
          options: question.options
        });
      }

      // Validate that we have a reasonable score
      if (totalScore < 0) {
        totalScore = 0;
      }
      if (totalScore > maxScore) {
        totalScore = maxScore;
      }

      // Create attempt record
      const attempt = await Attempt.create({
        userId,
        quizId,
        score: Math.round(totalScore * 100) / 100,
        maxScore,
        answers,
        timeTaken,
        completedAt: new Date()
      }, { transaction });

      await transaction.commit();

      // Invalidate leaderboard cache for this quiz
      try {
        await leaderboardService.invalidateLeaderboardCache(quizId);
      } catch (cacheError) {
        console.warn('Failed to invalidate leaderboard cache:', cacheError.message);
        // Don't fail the attempt submission if cache invalidation fails
      }

      return {
        attempt,
        results,
        totalScore: Math.round(totalScore * 100) / 100,
        maxScore,
        percentage: Math.round((totalScore / maxScore) * 100)
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Get user's attempt history
   */
  async getUserAttempts(userId, filters = {}) {
    const whereClause = { userId };

    // Add quiz filter if provided
    if (filters.quizId) {
      whereClause.quizId = filters.quizId;
    }

    // Add date range filter if provided
    if (filters.startDate || filters.endDate) {
      whereClause.completedAt = {};
      if (filters.startDate) {
        whereClause.completedAt[Op.gte] = new Date(filters.startDate);
      }
      if (filters.endDate) {
        whereClause.completedAt[Op.lte] = new Date(filters.endDate);
      }
    }

    const attempts = await Attempt.findAll({
      where: whereClause,
      include: [
        {
          model: Quiz,
          as: 'quiz',
          attributes: ['id', 'title', 'category'],
          where: { deletedAt: null }
        }
      ],
      order: [['completedAt', 'DESC']],
      limit: filters.limit || 50,
      offset: filters.offset || 0
    });

    return attempts;
  }

  /**
   * Get user's best attempt for a specific quiz
   */
  async getUserBestAttempt(userId, quizId) {
    return await Attempt.findOne({
      where: { userId, quizId },
      include: [
        {
          model: Quiz,
          as: 'quiz',
          attributes: ['id', 'title', 'category']
        }
      ],
      order: [['score', 'DESC'], ['completedAt', 'ASC']]
    });
  }

  /**
   * Get quiz leaderboard
   */
  async getQuizLeaderboard(quizId, limit = 10) {
    const { QueryTypes } = require('sequelize');
    
    // Get best score per user for the quiz
    const query = `
      SELECT 
        a.user_id as userId,
        u.name as userName,
        MAX(a.score) as bestScore,
        a.max_score as maxScore,
        MIN(a.completed_at) as firstCompletedAt,
        COUNT(a.id) as attemptCount
      FROM attempts a
      JOIN users u ON a.user_id = u.id
      WHERE a.quiz_id = :quizId AND u.deleted_at IS NULL
      GROUP BY a.user_id, u.name, a.max_score
      ORDER BY bestScore DESC, firstCompletedAt ASC
      LIMIT :limit
    `;
    
    return await sequelize.query(query, {
      replacements: { quizId, limit },
      type: QueryTypes.SELECT
    });
  }

  /**
   * Get user statistics
   */
  async getUserStatistics(userId) {
    const stats = await Attempt.findAll({
      where: { userId },
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'totalAttempts'],
        [sequelize.fn('AVG', sequelize.col('score')), 'averageScore'],
        [sequelize.fn('MAX', sequelize.col('score')), 'bestScore'],
        [sequelize.fn('COUNT', sequelize.fn('DISTINCT', sequelize.col('quizId'))), 'uniqueQuizzes']
      ],
      raw: true
    });

    const recentAttempts = await Attempt.findAll({
      where: { 
        userId,
        completedAt: {
          [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
        }
      },
      include: [
        {
          model: Quiz,
          as: 'quiz',
          attributes: ['title', 'category']
        }
      ],
      order: [['completedAt', 'DESC']],
      limit: 5
    });

    return {
      totalAttempts: parseInt(stats[0]?.totalAttempts || 0),
      averageScore: parseFloat(stats[0]?.averageScore || 0).toFixed(2),
      bestScore: parseFloat(stats[0]?.bestScore || 0),
      uniqueQuizzes: parseInt(stats[0]?.uniqueQuizzes || 0),
      recentAttempts
    };
  }

  /**
   * Check if user can start a new attempt (rate limiting)
   */
  async canUserStartQuiz(userId, quizId, cooldownHours = 24) {
    const recentAttempt = await Attempt.findOne({
      where: {
        userId,
        quizId,
        completedAt: {
          [Op.gte]: new Date(Date.now() - cooldownHours * 60 * 60 * 1000)
        }
      },
      order: [['completedAt', 'DESC']]
    });

    return !recentAttempt;
  }

  /**
   * Validate quiz session (for time tracking and security)
   */
  validateSession(session, currentTime = new Date()) {
    if (!session || !session.startTime) {
      throw new Error('Invalid session');
    }

    const elapsedTime = Math.floor((currentTime - new Date(session.startTime)) / 1000);
    
    // Check if time limit exceeded (if set)
    if (session.timeLimit && elapsedTime > session.timeLimit * 60) {
      throw new Error('Time limit exceeded');
    }

    return {
      isValid: true,
      elapsedTime,
      remainingTime: session.timeLimit ? (session.timeLimit * 60) - elapsedTime : null
    };
  }

  /**
   * Get attempt details by ID
   */
  async getAttemptById(attemptId, userId = null) {
    const whereClause = { id: attemptId };
    
    // If userId provided, ensure user can only access their own attempts
    if (userId) {
      whereClause.userId = userId;
    }

    const attempt = await Attempt.findOne({
      where: whereClause,
      include: [
        {
          model: Quiz,
          as: 'quiz',
          attributes: ['id', 'title', 'category', 'description']
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name']
        }
      ]
    });

    if (!attempt) {
      throw new Error('Attempt not found');
    }

    return attempt;
  }
}

module.exports = new AttemptService();