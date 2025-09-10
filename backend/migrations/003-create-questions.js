'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('questions', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
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
      question: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      options: {
        type: Sequelize.JSON,
        allowNull: false
      },
      correct_answer: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      question_type: {
        type: Sequelize.ENUM('single', 'multiple'),
        allowNull: false,
        defaultValue: 'single'
      },
      points: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      },
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true
      }
    });

    // Add indexes
    await queryInterface.addIndex('questions', ['quiz_id'], {
      name: 'idx_questions_quiz_id'
    });

    await queryInterface.addIndex('questions', ['question_type'], {
      name: 'idx_questions_question_type'
    });

    await queryInterface.addIndex('questions', ['created_at'], {
      name: 'idx_questions_created_at'
    });

    await queryInterface.addIndex('questions', ['deleted_at'], {
      name: 'idx_questions_deleted_at'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('questions');
  }
};