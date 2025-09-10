const express = require('express');
const { body, param, query } = require('express-validator');
const notificationController = require('../controllers/notificationController');
const { authenticateToken: authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Validation middleware
const validatePreferences = [
    body('quizReminders').optional().isBoolean(),
    body('quizDueAlerts').optional().isBoolean(),
    body('leaderboardUpdates').optional().isBoolean(),
    body('emailNotifications').optional().isBoolean(),
    body('pushNotifications').optional().isBoolean(),
    body('reminderHours').optional().isInt({ min: 1, max: 168 })
];

const validateCreateNotification = [
    body('userId').isInt({ min: 1 }),
    body('type').isIn(['quiz_reminder', 'quiz_due', 'quiz_expired', 'leaderboard_update']),
    body('title').isLength({ min: 1, max: 255 }).trim(),
    body('message').isLength({ min: 1, max: 1000 }).trim(),
    body('relatedQuizId').optional().isInt({ min: 1 }),
    body('scheduledFor').optional().isISO8601(),
    body('deliveryMethod').optional().isIn(['in_app', 'email', 'push'])
];

const validatePagination = [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('unreadOnly').optional().isBoolean()
];

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Get user notifications with pagination
router.get('/', validatePagination, notificationController.getUserNotifications);

// Get unread notification count
router.get('/unread-count', notificationController.getUnreadCount);

// Mark specific notification as read
router.patch('/:id/read', 
    param('id').isInt({ min: 1 }),
    notificationController.markAsRead
);

// Mark all notifications as read
router.patch('/mark-all-read', notificationController.markAllAsRead);

// Get notification preferences
router.get('/preferences', notificationController.getPreferences);

// Update notification preferences
router.put('/preferences', validatePreferences, notificationController.updatePreferences);

// Create notification (admin only - you might want to add admin middleware)
router.post('/', validateCreateNotification, notificationController.createNotification);

// Test notification endpoint (development only)
router.post('/test', notificationController.testNotifications);

module.exports = router;