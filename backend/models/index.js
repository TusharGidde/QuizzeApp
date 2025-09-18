const { sequelize } = require('../config/database');

// Import all models
const User = require('./User');
const Quiz = require('./Quiz');
const Question = require('./Question');
const Attempt = require('./Attempt');

// Define associations between models
const setupAssociations = () => {
    // User associations
    User.hasMany(Attempt, {
        foreignKey: 'userId',
        as: 'attempts',
        onDelete: 'CASCADE'
    });

    // Quiz associations
    Quiz.hasMany(Question, {
        foreignKey: 'quizId',
        as: 'questions',
        onDelete: 'CASCADE'
    });
    
    Quiz.hasMany(Attempt, {
        foreignKey: 'quizId',
        as: 'attempts',
        onDelete: 'CASCADE'
    });
    
    // Question associations
    Question.belongsTo(Quiz, {
        foreignKey: 'quizId',
        as: 'quiz'
    });
    
    // Attempt associations
    Attempt.belongsTo(User, {
        foreignKey: 'userId',
        as: 'User'
    });
    
    Attempt.belongsTo(Quiz, {
        foreignKey: 'quizId',
        as: 'quiz'
    });

};

// Set up all associations
setupAssociations();

// Export models and utilities
module.exports = {
    sequelize,
    User,
    Quiz,
    Question,
    Attempt,
    setupAssociations
};