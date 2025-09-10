const { sequelize } = require('../config/database');

// Import all models
const User = require('./User');
const Quiz = require('./Quiz');
const Question = require('./Question');
const Attempt = require('./Attempt');
const Notification = require('./Notification');
const NotificationPreference = require('./NotificationPreference');

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
        as: 'Quiz'
    });

    // Notification associations
    Notification.belongsTo(User, {
        foreignKey: 'userId',
        as: 'user'
    });

    Notification.belongsTo(Quiz, {
        foreignKey: 'relatedQuizId',
        as: 'quiz'
    });

    User.hasMany(Notification, {
        foreignKey: 'userId',
        as: 'notifications',
        onDelete: 'CASCADE'
    });

    // NotificationPreference associations
    NotificationPreference.belongsTo(User, {
        foreignKey: 'userId',
        as: 'user'
    });

    User.hasOne(NotificationPreference, {
        foreignKey: 'userId',
        as: 'notificationPreferences',
        onDelete: 'CASCADE'
    });
};

// Set up all associations
setupAssociations();

// Database connection and sync methods
const connectDB = async () => {
    try {
        await sequelize.authenticate();
        console.log('Database connection established successfully.');
        return true;
    } catch (error) {
        console.error('Unable to connect to the database:', error);
        return false;
    }
};

const syncDB = async (options = {}) => {
    try {
        await sequelize.sync(options);
        console.log('Database synchronized successfully.');
        return true;
    } catch (error) {
        console.error('Error synchronizing database:', error);
        return false;
    }
};

// Export models and utilities
module.exports = {
    sequelize,
    User,
    Quiz,
    Question,
    Attempt,
    Notification,
    NotificationPreference,
    connectDB,
    syncDB,
    setupAssociations
};