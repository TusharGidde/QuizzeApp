const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const { getPercentageScore, getFormattedTime, toJSON , getBestScoreForUser, getLeaderboard } = require('../utils/attemptUtils');


const Attempt = sequelize.define('Attempt', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'user_id',
    references: {
      model: 'users',
      key: 'id'
    },
    validate: {
      notNull: {
        msg: 'User ID is required'
      },
      isInt: {
        msg: 'User ID must be an integer'
      }
    }
  },
  quizId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'quiz_id',
    references: {
      model: 'quizzes',
      key: 'id'
    },
    validate: {
      notNull: {
        msg: 'Quiz ID is required'
      },
      isInt: {
        msg: 'Quiz ID must be an integer'
      }
    }
  },
  score: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    validate: {
      notNull: {
        msg: 'Score is required'
      },
      min: {
        args: [0],
        msg: 'Score cannot be negative'
      },
      max: {
        args: [999.99],
        msg: 'Score cannot exceed 999.99'
      }
    }
  },
  maxScore: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    field: 'max_score',
    validate: {
      notNull: {
        msg: 'Max score is required'
      },
      min: {
        args: [0],
        msg: 'Max score cannot be negative'
      },
      max: {
        args: [999.99],
        msg: 'Max score cannot exceed 999.99'
      }
    }
  },
  answers: {
    type: DataTypes.JSON,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Answers cannot be empty'
      },
      isValidAnswers(value) {
        if (typeof value !== 'object' || value === null) {
          throw new Error('Answers must be an object');
        }
        
        // Check if answers object has valid structure
        for (const [questionId, answer] of Object.entries(value)) {
          if (!Number.isInteger(parseInt(questionId))) {
            throw new Error('Question IDs must be integers');
          }
          if (answer === null || answer === undefined) {
            throw new Error('Answer cannot be null or undefined');
          }
        }
      }
    }
  },
  completedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'completed_at',
    validate: {
      isDate: {
        msg: 'Completed at must be a valid date'
      }
    }
  },
  timeTaken: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'time_taken',
    validate: {
      notNull: {
        msg: 'Time taken is required'
      },
      min: {
        args: [1],
        msg: 'Time taken must be at least 1 second'
      },
      max: {
        args: [10800], // 3 hours max
        msg: 'Time taken cannot exceed 3 hours'
      }
    }
  }
}, {
  tableName: 'attempts',
  timestamps: false, // We're using completedAt instead
  indexes: [
    {
      fields: ['user_id', 'quiz_id']
    },
    {
      fields: ['quiz_id', 'score'],
      order: [['score', 'DESC']]
    },
    {
      fields: ['completed_at']
    },
    {
      fields: ['user_id']
    }
  ]
});
Attempt.prototype.getPercentageScore = getPercentageScore;
Attempt.prototype.getFormattedTime = getFormattedTime;
Attempt.prototype.toJSON = toJSON;


module.exports = Attempt;