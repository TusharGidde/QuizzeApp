const logger = require('../services/loggerService');

// Request logging middleware
const requestLogger = (req, res, next) => {
  const startTime = Date.now();

  // Log the incoming request
  logger.info('Incoming request', {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    contentType: req.get('Content-Type'),
    contentLength: req.get('Content-Length')
  });

  // Override res.end to capture response details
  const originalEnd = res.end;
  res.end = function(chunk, encoding) {
    const responseTime = Date.now() - startTime;
    
    // Log the response
    logger.logRequest(req, res, responseTime);

    // Log slow requests
    if (responseTime > 1000) {
      logger.warn('Slow request detected', {
        method: req.method,
        url: req.url,
        responseTime: `${responseTime}ms`,
        statusCode: res.statusCode
      });
    }

    // Log errors
    if (res.statusCode >= 400) {
      logger.error('Request resulted in error', null, {
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        responseTime: `${responseTime}ms`
      });
    }

    originalEnd.call(this, chunk, encoding);
  };

  next();
};

module.exports = requestLogger;