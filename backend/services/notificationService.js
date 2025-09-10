const { Notification, NotificationPreference, User, Quiz } = require('../models');
const { Op } = require('sequelize');

class NotificationService {
    /**
     * Create a new notification
     */
    async createNotification(data) {
        try {
            const notification = await Notification.create({
                userId: data.userId,
                type: data.type,
                title: data.title,
                message: data.message,
                relatedQuizId: data.relatedQuizId || null,
                scheduledFor: data.scheduledFor || new Date(),
                deliveryMethod: data.deliveryMethod || 'in_app'
            });
            return notification;
        } catch (error) {
            console.error('Error creating notification:', error);
            throw error;
        }
    }

    /**
     * Get notifications for a user
     */
    async getUserNotifications(userId, options = {}) {
        try {
            const { limit = 20, offset = 0, unreadOnly = false } = options;
            
            const whereClause = { userId };
            if (unreadOnly) {
                whereClause.isRead = false;
            }

            const notifications = await Notification.findAndCountAll({
                where: whereClause,
                include: [
                    {
                        model: Quiz,
                        as: 'quiz',
                        attributes: ['id', 'title', 'category']
                    }
                ],
                order: [['createdAt', 'DESC']],
                limit,
                offset
            });

            return notifications;
        } catch (error) {
            console.error('Error fetching user notifications:', error);
            throw error;
        }
    }

    /**
     * Mark notification as read
     */
    async markAsRead(notificationId, userId) {
        try {
            const [updatedRows] = await Notification.update(
                { isRead: true },
                { 
                    where: { 
                        id: notificationId, 
                        userId: userId 
                    } 
                }
            );
            return updatedRows > 0;
        } catch (error) {
            console.error('Error marking notification as read:', error);
            throw error;
        }
    }

    /**
     * Mark all notifications as read for a user
     */
    async markAllAsRead(userId) {
        try {
            const [updatedRows] = await Notification.update(
                { isRead: true },
                { 
                    where: { 
                        userId: userId,
                        isRead: false
                    } 
                }
            );
            return updatedRows;
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
            throw error;
        }
    }

    /**
     * Get pending notifications that need to be sent
     */
    async getPendingNotifications() {
        try {
            const notifications = await Notification.findAll({
                where: {
                    status: 'pending',
                    scheduledFor: {
                        [Op.lte]: new Date()
                    }
                },
                include: [
                    {
                        model: User,
                        as: 'user',
                        attributes: ['id', 'name', 'email'],
                        include: [
                            {
                                model: NotificationPreference,
                                as: 'notificationPreferences'
                            }
                        ]
                    },
                    {
                        model: Quiz,
                        as: 'quiz',
                        attributes: ['id', 'title', 'category', 'expiresAt']
                    }
                ]
            });
            return notifications;
        } catch (error) {
            console.error('Error fetching pending notifications:', error);
            throw error;
        }
    }

    /**
     * Update notification status
     */
    async updateNotificationStatus(notificationId, status, sentAt = null) {
        try {
            const updateData = { status };
            if (sentAt) {
                updateData.sentAt = sentAt;
            }

            const [updatedRows] = await Notification.update(
                updateData,
                { where: { id: notificationId } }
            );
            return updatedRows > 0;
        } catch (error) {
            console.error('Error updating notification status:', error);
            throw error;
        }
    }

    /**
     * Create quiz reminder notifications
     */
    async createQuizReminders() {
        try {
            // Find quizzes that expire in the next 24-48 hours
            const tomorrow = new Date();
            tomorrow.setHours(tomorrow.getHours() + 24);
            
            const dayAfterTomorrow = new Date();
            dayAfterTomorrow.setHours(dayAfterTomorrow.getHours() + 48);

            const expiringQuizzes = await Quiz.findAll({
                where: {
                    expiresAt: {
                        [Op.between]: [tomorrow, dayAfterTomorrow]
                    },
                    deletedAt: null
                }
            });

            // Get all users with notification preferences
            const users = await User.findAll({
                include: [
                    {
                        model: NotificationPreference,
                        as: 'notificationPreferences'
                    }
                ],
                where: {
                    deletedAt: null
                }
            });

            const notifications = [];
            
            for (const quiz of expiringQuizzes) {
                for (const user of users) {
                    const prefs = user.notificationPreferences;
                    
                    // Check if user wants quiz reminders
                    if (!prefs || prefs.quizReminders) {
                        // Check if notification already exists
                        const existingNotification = await Notification.findOne({
                            where: {
                                userId: user.id,
                                relatedQuizId: quiz.id,
                                type: 'quiz_reminder',
                                status: {
                                    [Op.in]: ['pending', 'sent']
                                }
                            }
                        });

                        if (!existingNotification) {
                            notifications.push({
                                userId: user.id,
                                type: 'quiz_reminder',
                                title: 'Quiz Reminder',
                                message: `Don't forget to take the "${quiz.title}" quiz! It expires soon.`,
                                relatedQuizId: quiz.id,
                                scheduledFor: new Date(),
                                deliveryMethod: prefs?.emailNotifications ? 'email' : 'in_app'
                            });
                        }
                    }
                }
            }

            if (notifications.length > 0) {
                await Notification.bulkCreate(notifications);
                console.log(`Created ${notifications.length} quiz reminder notifications`);
            }

            return notifications.length;
        } catch (error) {
            console.error('Error creating quiz reminders:', error);
            throw error;
        }
    }

    /**
     * Create quiz due notifications
     */
    async createQuizDueNotifications() {
        try {
            // Find quizzes that expire in the next 2 hours
            const now = new Date();
            const twoHoursFromNow = new Date();
            twoHoursFromNow.setHours(twoHoursFromNow.getHours() + 2);

            const dueQuizzes = await Quiz.findAll({
                where: {
                    expiresAt: {
                        [Op.between]: [now, twoHoursFromNow]
                    },
                    deletedAt: null
                }
            });

            const users = await User.findAll({
                include: [
                    {
                        model: NotificationPreference,
                        as: 'notificationPreferences'
                    }
                ],
                where: {
                    deletedAt: null
                }
            });

            const notifications = [];
            
            for (const quiz of dueQuizzes) {
                for (const user of users) {
                    const prefs = user.notificationPreferences;
                    
                    if (!prefs || prefs.quizDueAlerts) {
                        const existingNotification = await Notification.findOne({
                            where: {
                                userId: user.id,
                                relatedQuizId: quiz.id,
                                type: 'quiz_due',
                                status: {
                                    [Op.in]: ['pending', 'sent']
                                }
                            }
                        });

                        if (!existingNotification) {
                            notifications.push({
                                userId: user.id,
                                type: 'quiz_due',
                                title: 'Quiz Due Soon!',
                                message: `The "${quiz.title}" quiz expires in less than 2 hours. Take it now!`,
                                relatedQuizId: quiz.id,
                                scheduledFor: new Date(),
                                deliveryMethod: prefs?.emailNotifications ? 'email' : 'in_app'
                            });
                        }
                    }
                }
            }

            if (notifications.length > 0) {
                await Notification.bulkCreate(notifications);
                console.log(`Created ${notifications.length} quiz due notifications`);
            }

            return notifications.length;
        } catch (error) {
            console.error('Error creating quiz due notifications:', error);
            throw error;
        }
    }

    /**
     * Get or create notification preferences for a user
     */
    async getUserPreferences(userId) {
        try {
            let preferences = await NotificationPreference.findOne({
                where: { userId }
            });

            if (!preferences) {
                preferences = await NotificationPreference.create({ userId });
            }

            return preferences;
        } catch (error) {
            console.error('Error getting user preferences:', error);
            throw error;
        }
    }

    /**
     * Update notification preferences for a user
     */
    async updateUserPreferences(userId, preferences) {
        try {
            const [updatedRows] = await NotificationPreference.update(
                preferences,
                { where: { userId } }
            );

            if (updatedRows === 0) {
                // Create if doesn't exist
                return await NotificationPreference.create({
                    userId,
                    ...preferences
                });
            }

            return await NotificationPreference.findOne({
                where: { userId }
            });
        } catch (error) {
            console.error('Error updating user preferences:', error);
            throw error;
        }
    }
}

module.exports = new NotificationService();