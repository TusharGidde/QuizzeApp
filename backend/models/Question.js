const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Question = sequelize.define('Question', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
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
  question: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Question text cannot be empty'
      },
      len: {
        args: [10, 2000],
        msg: 'Question must be between 10 and 2000 characters'
      }
    }
  },
  options: {
    type: DataTypes.JSON,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Options cannot be empty'
      },
      isValidOptions(value) {
        if (!Array.isArray(value)) {
          throw new Error('Options must be an array');
        }
        if (value.length < 2) {
          throw new Error('Must have at least 2 options');
        }
        if (value.length > 6) {
          throw new Error('Cannot have more than 6 options');
        }
        for (const option of value) {
          if (typeof option !== 'string' || option.trim().length === 0) {
            throw new Error('Each option must be a non-empty string');
          }
        }
      }
    }
  },
  correctAnswer: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'correct_answer',
    validate: {
      notEmpty: {
        msg: 'Correct answer cannot be empty'
      },
      isValidAnswer(value) {
        if (this.questionType === 'multiple') {
          // For multiple choice, correct answer should be comma-separated indices or values
          const answers = value.split(',').map(a => a.trim());
          if (answers.length === 0) {
            throw new Error('Multiple choice questions must have at least one correct answer');
          }
        }
      }
    }
  },
  questionType: {
    type: DataTypes.ENUM('single', 'multiple'),
    defaultValue: 'single',
    field: 'question_type',
    validate: {
      isIn: {
        args: [['single', 'multiple']],
        msg: 'Question type must be either single or multiple'
      }
    }
  },
  points: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    validate: {
      min: {
        args: [1],
        msg: 'Points must be at least 1'
      },
      max: {
        args: [10],
        msg: 'Points cannot exceed 10'
      }
    }
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'created_at'
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'updated_at'
  },
  deletedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'deleted_at'
  }
}, {
  tableName: 'questions',
  timestamps: true,
  paranoid: true, // Enables soft delete
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  deletedAt: 'deleted_at',
  indexes: [
    {
      fields: ['quiz_id']
    },
    {
      fields: ['question_type']
    },
    {
      fields: ['created_at']
    }
  ]
});

// Instance methods
Question.prototype.isCorrectAnswer = function(userAnswer) {
  if (this.questionType === 'single') {
    return userAnswer === this.correctAnswer;
  } else {
    // For multiple choice, compare arrays
    let correctAnswers = [];
    if (typeof this.correctAnswer === 'string') {
      correctAnswers = this.correctAnswer.split(',').map(a => a.trim()).sort();
    } else if (Array.isArray(this.correctAnswer)) {
      correctAnswers = this.correctAnswer.map(a => a.toString().trim()).sort();
    } else {
      correctAnswers = [];
    }

    const userAnswers = Array.isArray(userAnswer) 
      ? userAnswer.map(a => a.toString().trim()).sort()
      : (typeof userAnswer === 'string' ? userAnswer.split(',').map(a => a.trim()).sort() : []);

    return JSON.stringify(correctAnswers) === JSON.stringify(userAnswers);
  }
};

Question.prototype.calculateScore = function(userAnswer) {
  if (this.questionType === 'single') {
    return this.isCorrectAnswer(userAnswer) ? this.points : 0;
  } else {
    // Partial scoring for multiple choice
    let correctAnswers = [];
    if (typeof this.correctAnswer === 'string') {
      correctAnswers = this.correctAnswer.split(',').map(a => a.trim());
    } else if (Array.isArray(this.correctAnswer)) {
      correctAnswers = this.correctAnswer.map(a => a.toString().trim());
    } else {
      correctAnswers = [];
    }

    const userAnswers = Array.isArray(userAnswer) 
      ? userAnswer.map(a => a.toString().trim())
      : (typeof userAnswer === 'string' ? userAnswer.split(',').map(a => a.trim()) : []);

    const correctCount = userAnswers.filter(answer => 
      correctAnswers.includes(answer)
    ).length;

    const incorrectCount = userAnswers.filter(answer => 
      !correctAnswers.includes(answer)
    ).length;

    // Partial scoring: (correct - incorrect) / total correct * points
    const score = Math.max(0, (correctCount - incorrectCount) / (correctAnswers.length || 1) * this.points);
    return Math.round(score * 100) / 100; // Round to 2 decimal places
  }
};

Question.prototype.toJSON = function() {
  const values = { ...this.get() };
  delete values.deletedAt;
  return values;
};

module.exports = Question;