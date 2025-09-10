const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Notification = sequelize.define('Notification', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    type: {
        type: DataTypes.ENUM('quiz_reminder', 'quiz_due', 'quiz_expired', 'leaderboard_update'),
        allowNull: false
    },
    title: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    message: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    relatedQuizId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'quizzes',
            key: 'id'
        }
    },
    scheduledFor: {
        type: DataTypes.DATE,
        allowNull: true
    },
    sentAt: {
        type: DataTypes.DATE,
        allowNull: true
    },
    isRead: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    deliveryMethod: {
        type: DataTypes.ENUM('in_app', 'email', 'push'),
        defaultValue: 'in_app'
    },
    status: {
        type: DataTypes.ENUM('pending', 'sent', 'failed', 'cancelled'),
        defaultValue: 'pending'
    }
}, {
    tableName: 'notifications',
    timestamps: true,
    paranoid: true, // Enables soft delete
    indexes: [
        {
            fields: ['userId']
        },
        {
            fields: ['type']
        },
        {
            fields: ['scheduledFor']
        },
        {
            fields: ['status']
        }
    ]
});

module.exports = Notification;