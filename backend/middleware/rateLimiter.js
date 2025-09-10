const logger = require('../services/loggerService');

// Simple in-memory rate limiter (for production, use Redis)
class RateLimiter {
  constructor() {
    this.requests = new Map();
    this.cleanup();
  }

  // Clean up old entries every minute
  cleanup() {
    setInterval(() => {
      const now = Date.now();
      for (const [key, data] of this.requests.entries()) {
        if (now - data.resetTime > 60000) { // 1 minute
          this.requests.delete(key);
        }
      }
    }, 60000);
  }

  isAllowed(key, limit, windowMs = 60000) {
    const now = Date.now();
    const requestData = this.requests.get(key);

    if (!requestData || now - requestData.resetTime > windowMs) {
      // First request or window expired
      this.requests.set(key, {
        count: 1,
        resetTime: now
      });
      return { allowed: true, remaining: limit - 1 };
    }

    if (requestData.count >= limit) {
      return { 
        allowed: false, 
        remaining: 0,
        resetTime: requestData.resetTime + windowMs
      };
    }

    requestData.count++;
    return { 
      allowed: true, 
      remaining: limit - requestData.count 
    };
  }
}

const rateLimiter = new RateLimiter();

// General rate limiting middleware
const createRateLimit = (options = {}) => {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes
    max = 100, // limit each IP to 100 requests per windowMs
    message = 'Too many requests, please try again later',
    keyGenerator = (req) => req.ip,
    skipSuccessfulRequests = false,
    skipFailedRequests = false
  } = options;

  return (req, res, next) => {
    const key = keyGenerator(req);
    const result = rateLimiter.isAllowed(key, max, windowMs);

    // Set rate limit headers
    res.set({
      'X-RateLimit-Limit': max,
      'X-RateLimit-Remaining': result.remaining,
      'X-RateLimit-Reset': result.resetTime ? new Date(result.resetTime).toISOString() : new Date(Date.now() + windowMs).toISOString()
    });

    if (!result.allowed) {
      logger.logSecurity('rate_limit_exceeded', {
        ip: req.ip,
        url: req.url,
        method: req.method,
        userAgent: req.get('User-Agent'),
        limit: max,
        windowMs
      });

      return res.status(429).json({
        success: false,
        error: {
          message,
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000)
        }
      });
    }

    next();
  };
};

// Specific rate limiters for different endpoints
const authRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 login attempts per 15 minutes
  message: 'Too many authentication attempts, please try again later',
  keyGenerator: (req) => `auth:${req.ip}:${req.body.email || 'unknown'}`
});

const apiRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per 15 minutes
  message: 'Too many API requests, please try again later'
});

const uploadRateLimit = createRateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 uploads per hour
  message: 'Too many file uploads, please try again later'
});

// const strictRateLimit = createRateLimit({
//   windowMs: 5 * 60 * 1000, // 5 minutes
//   max: 10, // 10 requests per 5 minutes
//   message: 'Too many requests to this endpoint, please try again later'
// });

module.exports = {
  createRateLimit,
  authRateLimit,
  apiRateLimit,
  uploadRateLimit,
  // strictRateLimit
};