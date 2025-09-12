// backend/routes/index.js

const express = require('express');
const router = express.Router();

const authRoutes = require('./auth');
const quizRoutes = require('./quiz');
const questionRoutes = require('./question');
const leaderboardRoutes = require('./leaderboard');
const userRoutes = require('./user');
const analyticsRoutes = require('./analytics');
const adminRoutes = require('./admin');

router.use('/auth', authRoutes);
router.use('/quizzes', quizRoutes);
router.use('/questions', questionRoutes);
router.use('/leaderboard', leaderboardRoutes);
router.use('/users', userRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/admin', adminRoutes);

module.exports = router;
