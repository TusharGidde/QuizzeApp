'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('attempts', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      quiz_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'quizzes',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      score: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false
      },
      max_score: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false
      },
      answers: {
        type: Sequelize.JSON,
        allowNull: false
      },
      completed_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      time_taken: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: 'Time taken in seconds'
      }
    });

    // Add indexes for performance optimization
    await queryInterface.addIndex('attempts', ['user_id', 'quiz_id'], {
      name: 'idx_attempts_user_quiz'
    });

    await queryInterface.addIndex('attempts', ['quiz_id', 'score'], {
      name: 'idx_attempts_quiz_score'
    });

    await queryInterface.addIndex('attempts', ['completed_at'], {
      name: 'idx_attempts_completed_at'
    });

    await queryInterface.addIndex('attempts', ['user_id'], {
      name: 'idx_attempts_user_id'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('attempts');
  }
};