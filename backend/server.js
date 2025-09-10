const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { sequelize } = require('./config/database');
const { globalErrorHandler, notFoundHandler } = require('./middleware/errors');
const { apiRateLimit } = require('./middleware/rateLimiter');
const logger = require('./services/loggerService');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Request logging middleware (before other middleware)

// Rate limiting middleware
app.use('/api', apiRateLimit);

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Import routes
const authRoutes = require('./routes/auth');
const quizRoutes = require('./routes/quiz');
const questionRoutes = require('./routes/question');
const leaderboardRoutes = require('./routes/leaderboard');
const userRoutes = require('./routes/user');
const analyticsRoutes = require('./routes/analytics');
const adminRoutes = require('./routes/admin');

// Routes
app.get('/api/health', (req, res) => {
  res.json({ message: 'Quiz Service API is running!' });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/users', userRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/admin', adminRoutes);

// 404 handler for undefined routes
app.use(notFoundHandler);

// Global error handling middleware
app.use(globalErrorHandler);

// Database connection and server start
const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('[INFO] - Database connection established successfully');
    
    app.listen(PORT, () => {
      console.log(`[INFO] - Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Unable to connect to the database', error);
    process.exit(1);
  }
};

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.log('Uncaught Exception', err);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.log('Unhandled Promise Rejection', err);
  process.exit(1);
});

startServer();