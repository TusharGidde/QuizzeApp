const cron = require('node-cron');
const notificationService = require('./notificationService');

class SchedulerService {
    constructor() {
        this.jobs = new Map();
        this.isInitialized = false;
    }

    /**
     * Initialize all scheduled tasks
     */
    init() {
        if (this.isInitialized) {
            console.log('Scheduler already initialized');
            return;
        }

        console.log('Initializing scheduler service...');

        // Schedule quiz reminder notifications - runs every hour
        this.scheduleJob('quiz-reminders', '0 * * * *', async () => {
            console.log('Running quiz reminder job...');
            try {
                const count = await notificationService.createQuizReminders();
                console.log(`Quiz reminder job completed. Created ${count} notifications.`);
            } catch (error) {
                console.error('Error in quiz reminder job:', error);
            }
        });

        // Schedule quiz due notifications - runs every 15 minutes
        this.scheduleJob('quiz-due-alerts', '*/15 * * * *', async () => {
            console.log('Running quiz due alerts job...');
            try {
                const count = await notificationService.createQuizDueNotifications();
                console.log(`Quiz due alerts job completed. Created ${count} notifications.`);
            } catch (error) {
                console.error('Error in quiz due alerts job:', error);
            }
        });

        // Process pending notifications - runs every 5 minutes
        this.scheduleJob('process-notifications', '*/5 * * * *', async () => {
            console.log('Processing pending notifications...');
            try {
                await this.processPendingNotifications();
                console.log('Pending notifications processed.');
            } catch (error) {
                console.error('Error processing pending notifications:', error);
            }
        });

        // Cleanup old notifications - runs daily at 2 AM
        this.scheduleJob('cleanup-notifications', '0 2 * * *', async () => {
            console.log('Running notification cleanup job...');
            try {
                await this.cleanupOldNotifications();
                console.log('Notification cleanup completed.');
            } catch (error) {
                console.error('Error in notification cleanup job:', error);
            }
        });

        this.isInitialized = true;
        console.log('Scheduler service initialized successfully');
    }

    /**
     * Schedule a new cron job
     */
    scheduleJob(name, cronExpression, task) {
        try {
            if (this.jobs.has(name)) {
                console.log(`Job ${name} already exists, destroying old job`);
                this.jobs.get(name).destroy();
            }

            const job = cron.schedule(cronExpression, task, {
                scheduled: false,
                timezone: 'UTC'
            });

            this.jobs.set(name, job);
            job.start();
            
            console.log(`Scheduled job: ${name} with expression: ${cronExpression}`);
            return job;
        } catch (error) {
            console.error(`Error scheduling job ${name}:`, error);
            throw error;
        }
    }

    /**
     * Process pending notifications
     */
    async processPendingNotifications() {
        try {
            const pendingNotifications = await notificationService.getPendingNotifications();
            
            for (const notification of pendingNotifications) {
                try {
                    // Check user preferences
                    const userPrefs = notification.user?.notificationPreferences;
                    
                    // Skip if user has disabled this type of notification
                    if (userPrefs) {
                        const shouldSkip = this.shouldSkipNotification(notification.type, userPrefs);
                        if (shouldSkip) {
                            await notificationService.updateNotificationStatus(
                                notification.id, 
                                'cancelled'
                            );
                            continue;
                        }
                    }

                    // For now, we'll just mark in-app notifications as sent
                    // In a real implementation, you would integrate with email/push services
                    if (notification.deliveryMethod === 'in_app') {
                        await notificationService.updateNotificationStatus(
                            notification.id, 
                            'sent', 
                            new Date()
                        );
                    } else if (notification.deliveryMethod === 'email') {
                        // Placeholder for email sending logic
                        // await this.sendEmailNotification(notification);
                        await notificationService.updateNotificationStatus(
                            notification.id, 
                            'sent', 
                            new Date()
                        );
                    }
                } catch (error) {
                    console.error(`Error processing notification ${notification.id}:`, error);
                    await notificationService.updateNotificationStatus(
                        notification.id, 
                        'failed'
                    );
                }
            }
        } catch (error) {
            console.error('Error in processPendingNotifications:', error);
            throw error;
        }
    }

    /**
     * Check if notification should be skipped based on user preferences
     */
    shouldSkipNotification(type, userPrefs) {
        switch (type) {
            case 'quiz_reminder':
                return !userPrefs.quizReminders;
            case 'quiz_due':
                return !userPrefs.quizDueAlerts;
            case 'leaderboard_update':
                return !userPrefs.leaderboardUpdates;
            default:
                return false;
        }
    }

    /**
     * Cleanup old notifications (older than 30 days)
     */
    async cleanupOldNotifications() {
        try {
            const { Notification } = require('../models');
            const { Op } = require('sequelize');
            
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const deletedCount = await Notification.destroy({
                where: {
                    createdAt: {
                        [Op.lt]: thirtyDaysAgo
                    },
                    status: {
                        [Op.in]: ['sent', 'failed', 'cancelled']
                    }
                },
                force: true // Hard delete old notifications
            });

            console.log(`Cleaned up ${deletedCount} old notifications`);
            return deletedCount;
        } catch (error) {
            console.error('Error cleaning up old notifications:', error);
            throw error;
        }
    }

    /**
     * Stop a specific job
     */
    stopJob(name) {
        if (this.jobs.has(name)) {
            this.jobs.get(name).stop();
            console.log(`Stopped job: ${name}`);
            return true;
        }
        return false;
    }

    /**
     * Start a specific job
     */
    startJob(name) {
        if (this.jobs.has(name)) {
            this.jobs.get(name).start();
            console.log(`Started job: ${name}`);
            return true;
        }
        return false;
    }

    /**
     * Remove a job
     */
    removeJob(name) {
        if (this.jobs.has(name)) {
            this.jobs.get(name).destroy();
            this.jobs.delete(name);
            console.log(`Removed job: ${name}`);
            return true;
        }
        return false;
    }

    /**
     * Get status of all jobs
     */
    getJobsStatus() {
        const status = {};
        for (const [name, job] of this.jobs) {
            status[name] = {
                running: job.running || false,
                scheduled: job.scheduled || false
            };
        }
        return status;
    }

    /**
     * Stop all jobs and cleanup
     */
    shutdown() {
        console.log('Shutting down scheduler service...');
        for (const [name, job] of this.jobs) {
            job.destroy();
            console.log(`Destroyed job: ${name}`);
        }
        this.jobs.clear();
        this.isInitialized = false;
        console.log('Scheduler service shut down');
    }
}

module.exports = new SchedulerService();