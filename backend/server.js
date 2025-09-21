const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { sequelize } = require('./config/database');
const { notFoundHandler } = require('./middleware/errors');

// Import all API routes from routes/index.js
const apiRoutes = require('./routes');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;


// Middleware
const allowedOrigins = [
  "http://localhost:5173", // dev frontend
  "https://quizze-app-smoky.vercel.app", // deployed frontend
];

app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin (like curl or Postman)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
}));

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


const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('[INFO] - Database connection established successfully in server.js');
    
    app.listen(PORT, () => {
      console.log(`[INFO] - Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Unable to connect to the database', error);
    process.exit(1);
  }
};

startServer();