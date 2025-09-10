const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create notifications table
    await queryInterface.createTable('notifications', {
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
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
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
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
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
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      },
      deletedAt: {
        type: DataTypes.DATE,
        allowNull: true
      }
    });

    // Create notification_preferences table
    await queryInterface.createTable('notification_preferences', {
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
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
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
        defaultValue: 24
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      },
      deletedAt: {
        type: DataTypes.DATE,
        allowNull: true
      }
    });

    // Add indexes for better performance
    await queryInterface.addIndex('notifications', ['userId']);
    await queryInterface.addIndex('notifications', ['type']);
    await queryInterface.addIndex('notifications', ['scheduledFor']);
    await queryInterface.addIndex('notifications', ['status']);
    await queryInterface.addIndex('notification_preferences', ['userId']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('notification_preferences');
    await queryInterface.dropTable('notifications');
  }
};