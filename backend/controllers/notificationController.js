const notificationService = require('../services/notificationService');
const { validationResult } = require('express-validator');

class NotificationController {
    /**
     * Get notifications for the authenticated user
     */
    async getUserNotifications(req, res) {
        try {
            const userId = req.user.id;
            const { page = 1, limit = 20, unreadOnly = false } = req.query;
            
            const offset = (page - 1) * limit;
            const options = {
                limit: parseInt(limit),
                offset: parseInt(offset),
                unreadOnly: unreadOnly === 'true'
            };

            const result = await notificationService.getUserNotifications(userId, options);
            
            res.json({
                success: true,
                data: {
                    notifications: result.rows,
                    pagination: {
                        total: result.count,
                        page: parseInt(page),
                        limit: parseInt(limit),
                        totalPages: Math.ceil(result.count / limit)
                    }
                }
            });
        } catch (error) {
            console.error('Error fetching notifications:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch notifications'
            });
        }
    }

    /**
     * Get unread notification count
     */
    async getUnreadCount(req, res) {
        try {
            const userId = req.user.id;
            const result = await notificationService.getUserNotifications(userId, { 
                unreadOnly: true, 
                limit: 1000 
            });
            
            res.json({
                success: true,
                data: {
                    unreadCount: result.count
                }
            });
        } catch (error) {
            console.error('Error fetching unread count:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch unread count'
            });
        }
    }

    /**
     * Mark a notification as read
     */
    async markAsRead(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user.id;

            const success = await notificationService.markAsRead(id, userId);
            
            if (!success) {
                return res.status(404).json({
                    success: false,
                    error: 'Notification not found'
                });
            }

            res.json({
                success: true,
                message: 'Notification marked as read'
            });
        } catch (error) {
            console.error('Error marking notification as read:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to mark notification as read'
            });
        }
    }

    /**
     * Mark all notifications as read
     */
    async markAllAsRead(req, res) {
        try {
            const userId = req.user.id;
            const updatedCount = await notificationService.markAllAsRead(userId);
            
            res.json({
                success: true,
                message: `Marked ${updatedCount} notifications as read`
            });
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to mark all notifications as read'
            });
        }
    }

    /**
     * Get user notification preferences
     */
    async getPreferences(req, res) {
        try {
            const userId = req.user.id;
            const preferences = await notificationService.getUserPreferences(userId);
            
            res.json({
                success: true,
                data: preferences
            });
        } catch (error) {
            console.error('Error fetching notification preferences:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch notification preferences'
            });
        }
    }

    /**
     * Update user notification preferences
     */
    async updatePreferences(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    error: 'Validation failed',
                    details: errors.array()
                });
            }

            const userId = req.user.id;
            const {
                quizReminders,
                quizDueAlerts,
                leaderboardUpdates,
                emailNotifications,
                pushNotifications,
                reminderHours
            } = req.body;

            const preferences = await notificationService.updateUserPreferences(userId, {
                quizReminders,
                quizDueAlerts,
                leaderboardUpdates,
                emailNotifications,
                pushNotifications,
                reminderHours
            });
            
            res.json({
                success: true,
                data: preferences,
                message: 'Notification preferences updated successfully'
            });
        } catch (error) {
            console.error('Error updating notification preferences:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to update notification preferences'
            });
        }
    }

    /**
     * Create a manual notification (admin only)
     */
    async createNotification(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    error: 'Validation failed',
                    details: errors.array()
                });
            }

            const {
                userId,
                type,
                title,
                message,
                relatedQuizId,
                scheduledFor,
                deliveryMethod
            } = req.body;

            const notification = await notificationService.createNotification({
                userId,
                type,
                title,
                message,
                relatedQuizId,
                scheduledFor,
                deliveryMethod
            });
            
            res.status(201).json({
                success: true,
                data: notification,
                message: 'Notification created successfully'
            });
        } catch (error) {
            console.error('Error creating notification:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to create notification'
            });
        }
    }

    /**
     * Test notification system (development only)
     */
    async testNotifications(req, res) {
        try {
            if (process.env.NODE_ENV === 'production') {
                return res.status(403).json({
                    success: false,
                    error: 'Test endpoints not available in production'
                });
            }

            const userId = req.user.id;
            
            // Create a test notification
            const notification = await notificationService.createNotification({
                userId,
                type: 'quiz_reminder',
                title: 'Test Notification',
                message: 'This is a test notification to verify the system is working.',
                scheduledFor: new Date()
            });
            
            res.json({
                success: true,
                data: notification,
                message: 'Test notification created successfully'
            });
        } catch (error) {
            console.error('Error creating test notification:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to create test notification'
            });
        }
    }
}

module.exports = new NotificationController();