const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Quiz = sequelize.define('Quiz', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Quiz title cannot be empty'
      },
      len: {
        args: [3, 255],
        msg: 'Quiz title must be between 3 and 255 characters'
      }
    }
  },
  category: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Category cannot be empty'
      },
      len: {
        args: [2, 100],
        msg: 'Category must be between 2 and 100 characters'
      }
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    validate: {
      len: {
        args: [0, 1000],
        msg: 'Description cannot exceed 1000 characters'
      }
    }
  },
  timeLimit: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'time_limit',
    validate: {
      min: {
        args: [1],
        msg: 'Time limit must be at least 1 minute'
      },
      max: {
        args: [180],
        msg: 'Time limit cannot exceed 180 minutes'
      }
    }
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'expires_at',
    validate: {
      isDate: {
        msg: 'Expiry date must be a valid date'
      },
      isAfter: {
        args: new Date().toISOString(),
        msg: 'Expiry date must be in the future'
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
  tableName: 'quizzes',
  timestamps: true,
  paranoid: true, // Enables soft delete
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  deletedAt: 'deleted_at',
  indexes: [
    {
      fields: ['category']
    },
    {
      fields: ['expires_at']
    },
    {
      fields: ['created_at']
    }
  ]
});

// Instance methods
Quiz.prototype.isExpired = function() {
  return this.expiresAt && new Date() > this.expiresAt;
};

Quiz.prototype.isActive = function() {
  return !this.deletedAt && !this.isExpired();
};

Quiz.prototype.toJSON = function() {
  const values = { ...this.get() };
  delete values.deletedAt;
  return {
    ...values,
    isExpired: this.isExpired(),
    isActive: this.isActive()
  };
};

module.exports = Quiz;