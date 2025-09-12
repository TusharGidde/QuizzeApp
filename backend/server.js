const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { sequelize } = require('./config/database');
const { globalErrorHandler, notFoundHandler } = require('./middleware/errors');
const { apiRateLimit } = require('./middleware/rateLimiter');
const logger = require('./services/loggerService');

// Import all API routes from routes/index.js
const apiRoutes = require('./routes');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;


// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));


// Routes
app.get('/api/health', (req, res) => {
  res.json({ message: 'Quiz Service API is running!' });
});

// API routes
app.use('/api', apiRoutes);

// 404 handler for undefined routes
app.use(notFoundHandler);

// Global error handling middleware
app.use(globalErrorHandler);

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

startServer();