const { validationResult } = require('express-validator');
const UserService = require('../services/userService');

/**
 * Get user profile with statistics
 */
const getUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user statistics
    const statistics = await UserService.getUserStatistics(userId);
    
    // Get recent activity
    const recentActivity = await UserService.getRecentActivity(userId, 5);

    res.json({
      success: true,
      data: {
        user: req.user.toJSON(),
        statistics,
        recentActivity
      }
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch user profile' }
    });
  }
};

/**
 * Update user profile
 */
const updateUserProfile = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Validation failed',
          details: errors.array()
        }
      });
    }

    const userId = req.user.id;
    const { name, email } = req.body;

    const updatedUser = await UserService.updateUserProfile(userId, { name, email });

    res.json({
      success: true,
      data: {
        user: updatedUser
      },
      message: 'Profile updated successfully'
    });
  } catch (error) {
    console.error('Update user profile error:', error);
    
    if (error.message === 'User not found') {
      return res.status(404).json({
        success: false,
        error: { message: 'User not found' }
      });
    }
    
    if (error.message === 'Email address is already in use') {
      return res.status(409).json({
        success: false,
        error: { message: 'Email address is already in use' }
      });
    }

    // Handle Sequelize validation errors
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Validation failed',
          details: error.errors.map(err => ({
            field: err.path,
            message: err.message
          }))
        }
      });
    }

    res.status(500).json({
      success: false,
      error: { message: 'Failed to update profile' }
    });
  }
};

/**
 * Get user quiz history with filtering
 */
const getUserHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      category,
      startDate,
      endDate,
      page = 1,
      limit = 10,
      sortBy = 'completedAt',
      sortOrder = 'DESC'
    } = req.query;

    // Validate pagination parameters
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit))); // Max 50 items per page

    // Validate sort parameters
    const validSortFields = ['completedAt', 'score', 'timeTaken'];
    const validSortOrders = ['ASC', 'DESC'];
    
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'completedAt';
    const sortDirection = validSortOrders.includes(sortOrder?.toUpperCase()) ? sortOrder : 'DESC';

    const filters = {
      category,
      startDate,
      endDate,
      page: pageNum,
      limit: limitNum,
      sortBy: sortField,
      sortOrder: sortDirection
    };

    const history = await UserService.getUserHistory(userId, filters);

    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    console.error('Get user history error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch user history' }
    });
  }
};



/**
 * Get user statistics only
 */
const getUserStatistics = async (req, res) => {
  try {
    const userId = req.user.id;
    const statistics = await UserService.getUserStatistics(userId);

    res.json({
      success: true,
      data: {
        statistics
      }
    });
  } catch (error) {
    console.error('Get user statistics error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch user statistics' }
    });
  }
};

/**
 * Get user's recent activity
 */
const getRecentActivity = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 5 } = req.query;
    
    const limitNum = Math.min(20, Math.max(1, parseInt(limit))); // Max 20 items
    const recentActivity = await UserService.getRecentActivity(userId, limitNum);

    res.json({
      success: true,
      data: {
        recentActivity
      }
    });
  } catch (error) {
    console.error('Get recent activity error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch recent activity' }
    });
  }
};

module.exports = {
  getUserProfile,
  updateUserProfile,
  getUserHistory,
  getUserStatistics,
  getRecentActivity
};