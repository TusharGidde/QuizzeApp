const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const NotificationPreference = sequelize.define('NotificationPreference', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    quizReminders: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    quizDueAlerts: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    leaderboardUpdates: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    emailNotifications: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    pushNotifications: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    reminderHours: {
        type: DataTypes.INTEGER,
        defaultValue: 24, // Hours before quiz due date to send reminder
        validate: {
            min: 1,
            max: 168 // Max 1 week
        }
    }
}, {
    tableName: 'notification_preferences',
    timestamps: true,
    paranoid: true,
    indexes: [
        {
            fields: ['userId']
        }
    ]
});

module.exports = NotificationPreference;