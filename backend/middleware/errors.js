const { validationResult } = require('express-validator');

// Custom Error Classes
class AppError extends Error {
  constructor(message, statusCode, errorCode = null) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message = 'Validation failed', details = []) {
    super(message, 400, 'VALIDATION_ERROR');
    this.details = details;
  }
}

class AuthenticationError extends AppError {
  constructor(message = 'Authentication failed') {
    super(message, 401, 'AUTHENTICATION_ERROR');
  }
}

class AuthorizationError extends AppError {
  constructor(message = 'Access denied') {
    super(message, 403, 'AUTHORIZATION_ERROR');
  }
}

class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404, 'NOT_FOUND_ERROR');
  }
}

class ConflictError extends AppError {
  constructor(message = 'Resource conflict') {
    super(message, 409, 'CONFLICT_ERROR');
  }
}

class DatabaseError extends AppError {
  constructor(message = 'Database operation failed') {
    super(message, 500, 'DATABASE_ERROR');
  }
}

class ExternalServiceError extends AppError {
  constructor(message = 'External service error') {
    super(message, 502, 'EXTERNAL_SERVICE_ERROR');
  }
}

// Validation middleware to handle express-validator results
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const validationError = new ValidationError('Validation failed', errors.array());
    return next(validationError);
  }
  next();
};

// Async error handler wrapper
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Global error handling middleware
const globalErrorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error for monitoring
  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });

  // Handle Sequelize errors
  if (err.name === 'SequelizeValidationError') {
    const details = err.errors.map(error => ({
      field: error.path,
      message: error.message,
      value: error.value
    }));
    error = new ValidationError('Database validation failed', details);
  }

  if (err.name === 'SequelizeUniqueConstraintError') {
    const field = err.errors[0]?.path || 'field';
    error = new ConflictError(`${field} already exists`);
  }

  if (err.name === 'SequelizeForeignKeyConstraintError') {
    error = new ValidationError('Invalid reference to related resource');
  }

  if (err.name === 'SequelizeConnectionError' || err.name === 'SequelizeDatabaseError') {
    error = new DatabaseError('Database connection failed');
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = new AuthenticationError('Invalid token');
  }

  if (err.name === 'TokenExpiredError') {
    error = new AuthenticationError('Token expired');
  }

  // Handle Multer errors (file upload)
  if (err.code === 'LIMIT_FILE_SIZE') {
    error = new ValidationError('File size too large');
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    error = new ValidationError('Unexpected file field');
  }

  // Handle MongoDB/Mongoose errors (if used)
  if (err.name === 'CastError') {
    error = new ValidationError('Invalid ID format');
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    error = new ConflictError(`${field} already exists`);
  }

  // Default to AppError if not already an operational error
  if (!error.isOperational) {
    error = new AppError(
      process.env.NODE_ENV === 'production' ? 'Something went wrong' : err.message,
      500,
      'INTERNAL_SERVER_ERROR'
    );
  }

  // Send error response
  const response = {
    success: false,
    error: {
      message: error.message,
      code: error.errorCode || 'UNKNOWN_ERROR',
      statusCode: error.statusCode || 500
    }
  };

  // Add details for validation errors
  if (error instanceof ValidationError && error.details) {
    response.error.details = error.details;
  }

  // Add stack trace in development
  if (process.env.NODE_ENV === 'development') {
    response.error.stack = err.stack;
  }

  res.status(error.statusCode || 500).json(response);
};

// 404 handler for undefined routes
const notFoundHandler = (req, res, next) => {
  const error = new NotFoundError(`Route ${req.originalUrl} not found`);
  next(error);
};

module.exports = {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  DatabaseError,
  ExternalServiceError,
  handleValidationErrors,
  asyncHandler,
  globalErrorHandler,
  notFoundHandler
};