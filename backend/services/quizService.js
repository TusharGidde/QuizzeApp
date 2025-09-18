const { Quiz, Question, Attempt, sequelize } = require('../models');
const { Op } = require('sequelize');

class QuizService {
  /**
   * Get all active quizzes with optional category filtering
   */
  async getQuizzes(filters = {}) {
    const whereClause = {
      deletedAt: null
    };

    // Add category filter if provided
    if (filters.category) {
      whereClause.category = filters.category;
    }

    // Add search functionality
    if (filters.search) {
      whereClause[Op.or] = [
        { title: { [Op.like]: `%${filters.search}%` } },
        { description: { [Op.like]: `%${filters.search}%` } }
      ];
    }

    // Filter out expired quizzes unless specifically requested
    if (!filters.includeExpired) {
      whereClause[Op.or] = [
        { expiresAt: null },
        { expiresAt: { [Op.gt]: new Date() } }
      ];
    }

    const quizzes = await Quiz.findAll({
      where: whereClause,
      include: [{
        model: Question,
        as: 'questions',
        attributes: ['id'],
        where: { deletedAt: null },
        required: false
      }],
      order: [['createdAt', 'DESC']]
    });

    return quizzes.map(quiz => ({
      ...quiz.toJSON(),
      questionCount: quiz.questions ? quiz.questions.length : 0
    }));
  }

  /**
   * Get quiz by ID with questions
   */
  async getQuizById(quizId) {
    const includeOptions = [];


    const quiz = await Quiz.findOne({
      where: { 
        id: quizId,
        deletedAt: null 
      },
      include: includeOptions
    });

    if (!quiz) {
      throw new Error('Quiz not found');
    }

    // Check if quiz is expired
    if (quiz.isExpired()) {
      throw new Error('Quiz has expired');
    }

    return quiz;
  }

  /**
   * Get random questions for quiz attempt
   */
  async getRandomQuestions(quizId, count = 10) {
    const quiz = await this.getQuizById(quizId);
    
    if (quiz.isExpired()) {
      throw new Error('Quiz has expired');
    }

    const questions = await Question.findAll({
      where: { 
        quizId: quizId,
        deletedAt: null 
      },
      order: sequelize.random(),
      limit: count
    });

    if (questions.length === 0) {
      throw new Error('No questions available for this quiz');
    }

    // Return questions without correct answers for security
    return questions.map(question => ({
      id: question.id,
      question: question.question,
      options: question.options,
      questionType: question.questionType,
      points: question.points
    }));
  }

  /**
   * Calculate score for quiz attempt
   */
  async calculateScore(quizId, answers) {
    const questions = await Question.findAll({
      where: { 
        quizId: quizId,
        deletedAt: null 
      }
    });

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
        userAnswer,
        correctAnswer: question.correctAnswer,
        score,
        maxScore: question.points,
        isCorrect: question.isCorrectAnswer(userAnswer)
      });
    }

    return {
      totalScore: Math.round(totalScore * 100) / 100,
      maxScore,
      percentage: Math.round((totalScore / maxScore) * 100),
      results
    };
  }

  /**
   * Get quiz categories
   */
  async getCategories() {
    const categories = await Quiz.findAll({
      attributes: ['category'],
      where: { 
        deletedAt: null,
        [Op.or]: [
          { expiresAt: null },
          { expiresAt: { [Op.gt]: new Date() } }
        ]
      },
      group: ['category'],
      order: [['category', 'ASC']]
    });

    return categories.map(quiz => quiz.category);
  }

  /**
   * Validate quiz expiry and time limits
   */
  validateQuizAccess(quiz) {
    if (!quiz) {
      throw new Error('Quiz not found');
    }

    if (quiz.deletedAt) {
      throw new Error('Quiz is no longer available');
    }

    if (quiz.isExpired()) {
      throw new Error('Quiz has expired');
    }

    return true;
  }

  /**
   * Check if user can start quiz (not already completed recently)
   */
  async canUserStartQuiz(userId, quizId) {
    const recentAttempt = await Attempt.findOne({
      where: {
        userId,
        quizId,
        completedAt: {
          [Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      },
      order: [['completedAt', 'DESC']]
    });

    return !recentAttempt;
  }
}

module.exports = new QuizService();