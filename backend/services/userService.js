const { Op } = require('sequelize');
const { sequelize } = require('../config/database');
const { User, Attempt, Quiz } = require('../models');

class UserService {
  /**
   * Calculate user statistics including total quizzes taken and average score
   * @param {number} userId - The user ID
   * @returns {Object} User statistics
   */
  static async getUserStatistics(userId) {
    try {
      const stats = await Attempt.findAll({
        where: { userId },
        attributes: [
          [sequelize.fn('COUNT', sequelize.col('id')), 'totalQuizzes'],
          [sequelize.fn('AVG', sequelize.col('score')), 'averageScore'],
          [sequelize.fn('AVG', sequelize.col('max_score')), 'averageMaxScore'],
          [sequelize.fn('SUM', sequelize.col('score')), 'totalScore'],
          [sequelize.fn('MAX', sequelize.col('score')), 'bestScore'],
          [sequelize.fn('MIN', sequelize.col('score')), 'worstScore'],
          [sequelize.fn('AVG', sequelize.col('time_taken')), 'averageTime']
        ],
        raw: true
      });

      const result = stats[0];
      
      // Calculate percentage scores
      const averagePercentage = result.averageMaxScore > 0 
        ? Math.round((result.averageScore / result.averageMaxScore) * 100 * 100) / 100
        : 0;

      // Get unique quizzes count
      const uniqueQuizzes = await Attempt.findAll({
        where: { userId },
        attributes: [[sequelize.fn('COUNT', sequelize.fn('DISTINCT', sequelize.col('quiz_id'))), 'uniqueQuizzes']],
        raw: true
      });

      // Get category breakdown
      const categoryStats = await this.getUserCategoryStats(userId);

      return {
        totalAttempts: parseInt(result.totalQuizzes) || 0,
        uniqueQuizzes: parseInt(uniqueQuizzes[0].uniqueQuizzes) || 0,
        averageScore: parseFloat(result.averageScore) || 0,
        averagePercentage: averagePercentage,
        totalScore: parseFloat(result.totalScore) || 0,
        bestScore: parseFloat(result.bestScore) || 0,
        worstScore: parseFloat(result.worstScore) || 0,
        averageTimeMinutes: result.averageTime ? Math.round(result.averageTime / 60 * 100) / 100 : 0,
        categoryBreakdown: categoryStats
      };
    } catch (error) {
      console.error('Error calculating user statistics:', error);
      throw new Error('Failed to calculate user statistics');
    }
  }

  /**
   * Get user statistics by category
   * @param {number} userId - The user ID
   * @returns {Array} Category statistics
   */
  static async getUserCategoryStats(userId) {
    try {
      const categoryStats = await Attempt.findAll({
        where: { userId },
        include: [{
          model: Quiz,
          as: 'quiz',
          attributes: ['category'],
          where: { deletedAt: null }
        }],
        attributes: [
          [sequelize.col('quiz.category'), 'category'],
          [sequelize.fn('COUNT', sequelize.col('Attempt.id')), 'attempts'],
          [sequelize.fn('AVG', sequelize.col('Attempt.score')), 'averageScore'],
          [sequelize.fn('AVG', sequelize.col('Attempt.max_score')), 'averageMaxScore'],
          [sequelize.fn('MAX', sequelize.col('Attempt.score')), 'bestScore']
        ],
        group: ['quiz.category'],
        raw: true
      });

      return categoryStats.map(stat => ({
        category: stat.category,
        attempts: parseInt(stat.attempts),
        averageScore: parseFloat(stat.averageScore) || 0,
        averagePercentage: stat.averageMaxScore > 0 
          ? Math.round((stat.averageScore / stat.averageMaxScore) * 100 * 100) / 100
          : 0,
        bestScore: parseFloat(stat.bestScore) || 0
      }));
    } catch (error) {
      console.error('Error getting category stats:', error);
      throw new Error('Failed to get category statistics');
    }
  }

  /**
   * Get user attempt history with filtering options
   * @param {number} userId - The user ID
   * @param {Object} filters - Filter options
   * @returns {Object} Paginated attempt history
   */
  static async getUserHistory(userId, filters = {}) {
    try {
      const {
        category,
        startDate,
        endDate,
        page = 1,
        limit = 10,
        sortBy = 'completedAt',
        sortOrder = 'DESC'
      } = filters;

      const offset = (page - 1) * limit;
      
      // Build where conditions
      const whereConditions = { userId };
      
      if (startDate || endDate) {
        whereConditions.completedAt = {};
        if (startDate) {
          whereConditions.completedAt[Op.gte] = new Date(startDate);
        }
        if (endDate) {
          whereConditions.completedAt[Op.lte] = new Date(endDate);
        }
      }

      // Build quiz where conditions for category filter
      const quizWhere = { deletedAt: null };
      if (category) {
        quizWhere.category = category;
      }

      // Get attempts with quiz details
      const { count, rows: attempts } = await Attempt.findAndCountAll({
        where: whereConditions,
        include: [{
          model: Quiz,
          as: 'quiz',
          attributes: ['id', 'title', 'category', 'description'],
          where: quizWhere
        }],
        order: [[sortBy, sortOrder.toUpperCase()]],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      // Calculate pagination info
      const totalPages = Math.ceil(count / limit);
      const hasNextPage = page < totalPages;
      const hasPrevPage = page > 1;

      return {
        attempts: attempts.map(attempt => ({
          id: attempt.id,
          score: attempt.score,
          maxScore: attempt.maxScore,
          percentageScore: attempt.getPercentageScore(),
          timeTaken: attempt.timeTaken,
          formattedTime: attempt.getFormattedTime(),
          completedAt: attempt.completedAt,
          quiz: {
            id: attempt.quiz.id,
            title: attempt.quiz.title,
            category: attempt.quiz.category,
            description: attempt.quiz.description
          }
        })),
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalItems: count,
          itemsPerPage: parseInt(limit),
          hasNextPage,
          hasPrevPage
        }
      };
    } catch (error) {
      console.error('Error getting user history:', error);
      throw new Error('Failed to get user history');
    }
  }

 

  /**
   * Calculate detailed score breakdown for an attempt
   * @param {Object} attempt - The attempt object with quiz and questions
   * @returns {Object} Score breakdown
   */
  static calculateScoreBreakdown(attempt) {
    const { answers } = attempt;
    const questions = attempt.quiz.questions;
    
    let correctAnswers = 0;
    let partiallyCorrect = 0;
    let incorrect = 0;
    let totalPoints = 0;
    let earnedPoints = 0;

    const questionResults = questions.map(question => {
      const userAnswer = answers[question.id];
      const correctAnswer = question.correctAnswer;
      const points = question.points || 1;
      
      totalPoints += points;
      
      let isCorrect = false;
      let pointsEarned = 0;
      
      if (question.questionType === 'multiple') {
        // Handle multiple choice questions with partial scoring
        const userAnswers = Array.isArray(userAnswer) ? userAnswer : [userAnswer];
        const correctAnswers = Array.isArray(correctAnswer) ? correctAnswer : [correctAnswer];
        
        const correctCount = userAnswers.filter(ans => correctAnswers.includes(ans)).length;
        const incorrectCount = userAnswers.filter(ans => !correctAnswers.includes(ans)).length;
        
        if (correctCount === correctAnswers.length && incorrectCount === 0) {
          isCorrect = true;
          pointsEarned = points;
        } else if (correctCount > 0) {
          // Partial credit
          pointsEarned = (correctCount / correctAnswers.length) * points;
          partiallyCorrect++;
        } else {
          incorrect++;
        }
      } else {
        // Single choice question
        isCorrect = userAnswer === correctAnswer;
        pointsEarned = isCorrect ? points : 0;
      }
      
      if (isCorrect) correctAnswers++;
      else if (pointsEarned === 0 && question.questionType !== 'multiple') incorrect++;
      
      earnedPoints += pointsEarned;
      
      return {
        questionId: question.id,
        question: question.question,
        userAnswer,
        correctAnswer,
        isCorrect,
        pointsEarned,
        maxPoints: points
      };
    });

    return {
      totalQuestions: questions.length,
      correctAnswers,
      partiallyCorrect,
      incorrect,
      totalPoints,
      earnedPoints,
      accuracy: questions.length > 0 ? Math.round((correctAnswers / questions.length) * 100) : 0,
      questionResults
    };
  }

  /**
   * Update user profile information
   * @param {number} userId - The user ID
   * @param {Object} updateData - Data to update
   * @returns {Object} Updated user
   */
  static async updateUserProfile(userId, updateData) {
    try {
      const { name, email } = updateData;
      
      // Find the user
      const user = await User.findByPk(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Check if email is being changed and if it's already taken
      if (email && email !== user.email) {
        const existingUser = await User.findOne({ 
          where: { 
            email,
            id: { [Op.ne]: userId }
          }
        });
        
        if (existingUser) {
          throw new Error('Email address is already in use');
        }
      }

      // Update user
      await user.update({
        ...(name && { name }),
        ...(email && { email })
      });

      return user.toJSON();
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }

  /**
   * Get user's recent activity
   * @param {number} userId - The user ID
   * @param {number} limit - Number of recent activities to fetch
   * @returns {Array} Recent attempts
   */
  static async getRecentActivity(userId, limit = 5) {
    try {
      const recentAttempts = await Attempt.findAll({
        where: { userId },
        include: [{
          model: Quiz,
          as: 'quiz',
          attributes: ['id', 'title', 'category'],
          where: { deletedAt: null }
        }],
        order: [['completedAt', 'DESC']],
        limit: parseInt(limit)
      });

      return recentAttempts.map(attempt => ({
        id: attempt.id,
        score: attempt.score,
        maxScore: attempt.maxScore,
        percentageScore: attempt.getPercentageScore(),
        completedAt: attempt.completedAt,
        quiz: {
          id: attempt.quiz.id,
          title: attempt.quiz.title,
          category: attempt.quiz.category
        }
      }));
    } catch (error) {
      console.error('Error getting recent activity:', error);
      throw new Error('Failed to get recent activity');
    }
  }
}

module.exports = UserService;