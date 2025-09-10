const fs = require('fs');
const path = require('path');

class LoggerService {
  constructor() {
    this.logDir = path.join(__dirname, '../logs');
    this.ensureLogDirectory();
  }

  ensureLogDirectory() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  formatLogEntry(level, message, meta = {}) {
    return {
      timestamp: new Date().toISOString(),
      level: level.toUpperCase(),
      message,
      ...meta,
      pid: process.pid,
      hostname: require('os').hostname()
    };
  }

  writeToFile(filename, logEntry) {
    const logPath = path.join(this.logDir, filename);
    const logLine = JSON.stringify(logEntry) + '\n';
    
    fs.appendFile(logPath, logLine, (err) => {
      if (err) {
        console.error('Failed to write to log file:', err);
      }
    });
  }

  info(message, meta = {}) {
    const logEntry = this.formatLogEntry('info', message, meta);
    console.log(`[INFO] ${message}`, meta);
    this.writeToFile('app.log', logEntry);
  }

  warn(message, meta = {}) {
    const logEntry = this.formatLogEntry('warn', message, meta);
    console.warn(`[WARN] ${message}`, meta);
    this.writeToFile('app.log', logEntry);
  }

  error(message, error = null, meta = {}) {
    const logEntry = this.formatLogEntry('error', message, {
      ...meta,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
        statusCode: error.statusCode,
        errorCode: error.errorCode
      } : null
    });
    
    console.error(`[ERROR] ${message}`, error, meta);
    this.writeToFile('error.log', logEntry);
  }

  debug(message, meta = {}) {
    if (process.env.NODE_ENV === 'development') {
      const logEntry = this.formatLogEntry('debug', message, meta);
      console.debug(`[DEBUG] ${message}`, meta);
      this.writeToFile('debug.log', logEntry);
    }
  }

  // Log HTTP requests
  logRequest(req, res, responseTime) {
    const logEntry = this.formatLogEntry('info', 'HTTP Request', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      userId: req.user?.id || null
    });

    this.writeToFile('access.log', logEntry);
  }

  // Log authentication events
  logAuth(event, userId, meta = {}) {
    const logEntry = this.formatLogEntry('info', `Auth: ${event}`, {
      userId,
      event,
      ...meta
    });

    this.writeToFile('auth.log', logEntry);
  }

  // Log database operations
  logDatabase(operation, table, meta = {}) {
    const logEntry = this.formatLogEntry('debug', `DB: ${operation}`, {
      operation,
      table,
      ...meta
    });

    this.writeToFile('database.log', logEntry);
  }

  // Log security events
  logSecurity(event, meta = {}) {
    const logEntry = this.formatLogEntry('warn', `Security: ${event}`, {
      event,
      ...meta
    });

    console.warn(`[SECURITY] ${event}`, meta);
    this.writeToFile('security.log', logEntry);
  }
}

// Create singleton instance
const logger = new LoggerService();

module.exports = logger;