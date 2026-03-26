const chalk = require('chalk');

/**
 * Error Handler and Recovery Manager
 */
class ErrorHandler {
  constructor() {
    this.errorLog = [];
    this.errorCount = new Map();
    this.maxErrorsBeforeCrash = 50;
    this.criticalErrors = [
      'ENOTFOUND',
      'ECONNREFUSED',
      'ETIMEDOUT',
      'SESSION_INVALID'
    ];
  }

  /**
   * Handle and log errors
   */
  handleError(error, context = '') {
    const errorInfo = {
      timestamp: new Date().toISOString(),
      message: error.message,
      code: error.code,
      context,
      stack: error.stack
    };

    // Add to error log
    this.errorLog.push(errorInfo);

    // Keep only last 100 errors
    if (this.errorLog.length > 100) {
      this.errorLog.shift();
    }

    // Track error frequency
    const errorKey = `${error.code}_${context}`;
    const count = (this.errorCount.get(errorKey) || 0) + 1;
    this.errorCount.set(errorKey, count);

    // Log error
    this.logError(errorInfo);

    // Check for critical errors
    this.checkCriticalError(error);

    // Return error info
    return errorInfo;
  }

  /**
   * Log error with formatting
   */
  logError(errorInfo) {
    const level = this.getErrorLevel(errorInfo.code);
    const symbol = this.getErrorSymbol(level);

    const message = `${symbol} ${errorInfo.code || 'ERROR'} [${errorInfo.context}]: ${errorInfo.message}`;

    switch (level) {
      case 'critical':
        console.error(chalk.red.bold(message));
        break;
      case 'warning':
        console.warn(chalk.yellow(message));
        break;
      case 'info':
        console.log(chalk.cyan(message));
        break;
      default:
        console.error(chalk.red(message));
    }
  }

  /**
   * Get error severity level
   */
  getErrorLevel(code) {
    const levels = {
      // Critical
      SESSION_INVALID: 'critical',
      ECONNREFUSED: 'critical',
      ENOTFOUND: 'critical',

      // Warning
      Throttled: 'warning',
      'Rate limited': 'warning',
      timeout: 'warning',
      ETIMEDOUT: 'warning',

      // Info
      'Message not found': 'info',
      'User not found': 'info'
    };

    return levels[code] || 'error';
  }

  /**
   * Get error symbol
   */
  getErrorSymbol(level) {
    const symbols = {
      critical: '🔴',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️'
    };
    return symbols[level] || '❓';
  }

  /**
   * Check for critical errors
   */
  checkCriticalError(error) {
    for (const critical of this.criticalErrors) {
      if (error.code === critical || error.message.includes(critical)) {
        console.error(chalk.red.bold(`\n⚠️  CRITICAL ERROR DETECTED: ${critical}`));
        this.suggestRecovery(critical);
        break;
      }
    }
  }

  /**
   * Suggest recovery actions
   */
  suggestRecovery(errorType) {
    const suggestions = {
      SESSION_INVALID: [
        '1. Get a new SESSION_ID from Instagram',
        '2. Update the SESSION_ID in .env file',
        '3. Restart the bot with: npm start'
      ],
      ECONNREFUSED: [
        '1. Check your internet connection',
        '2. Instagram servers might be down',
        '3. Try using a proxy: update PROXY_URL in .env',
        '4. Wait a few minutes and restart'
      ],
      ENOTFOUND: [
        '1. Check your internet connection',
        '2. DNS issues detected',
        '3. Try restarting your router',
        '4. Consider using a different DNS'
      ],
      ETIMEDOUT: [
        '1. Network connection is slow',
        '2. Increase polling interval: POLLING_INTERVAL=5000',
        '3. Check your internet speed',
        '4. Try using a proxy'
      ]
    };

    const steps = suggestions[errorType];
    if (steps) {
      console.log(chalk.yellow('💡 Recovery suggestions:'));
      steps.forEach(step => console.log(chalk.yellow(`   ${step}`)));
    }
  }

  /**
   * Get error statistics
   */
  getErrorStats() {
    return {
      totalErrors: this.errorLog.length,
      uniqueErrors: this.errorCount.size,
      topErrors: Array.from(this.errorCount.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([error, count]) => ({
          error,
          count
        }))
    };
  }

  /**
   * Print error report
   */
  printErrorReport() {
    const stats = this.getErrorStats();

    console.log(chalk.cyan('\n📊 Error Report:'));
    console.log(chalk.white(`  Total Errors: ${stats.totalErrors}`));
    console.log(chalk.white(`  Unique Error Types: ${stats.uniqueErrors}`));
    console.log(chalk.white(`  Top Errors:`));

    stats.topErrors.forEach(({ error, count }, index) => {
      console.log(chalk.white(`    ${index + 1}. ${error}: ${count} times`));
    });
    console.log();
  }

  /**
   * Handle network errors with retry logic
   */
  async retryWithBackoff(fn, maxRetries = 3, baseDelay = 1000) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        this.handleError(error, `Retry attempt ${attempt}/${maxRetries}`);

        if (attempt === maxRetries) {
          throw error;
        }

        const delay = baseDelay * Math.pow(2, attempt - 1);
        console.log(chalk.yellow(`⏳ Retrying in ${delay}ms...`));
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  /**
   * Validate session before operations
   */
  validateSession(ig) {
    if (!ig || !ig.state) {
      throw new Error('SESSION_INVALID: Session not initialized');
    }

    if (!ig.state.cookieUserId) {
      throw new Error('SESSION_INVALID: Not logged in');
    }

    return true;
  }

  /**
   * Handle graceful degradation
   */
  handleDegradedMode(error) {
    console.log(chalk.yellow('📉 Entering degraded mode...'));
    console.log(chalk.yellow(`   Reason: ${error.message}`));
    console.log(chalk.yellow('   Features may be limited'));

    return {
      messagePolling: false,
      commandProcessing: true,
      autoAnnouncements: false,
      isHealthy: false
    };
  }

  /**
   * Clear error logs
   */
  clearLogs() {
    this.errorLog = [];
    this.errorCount.clear();
    console.log(chalk.blue('🗑️  Error logs cleared'));
  }

  /**
   * Get recent errors
   */
  getRecentErrors(limit = 10) {
    return this.errorLog.slice(-limit);
  }

  /**
   * Setup global error handlers
   */
  setupGlobalHandlers() {
    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      this.handleError(error, 'UNCAUGHT_EXCEPTION');
      console.error(chalk.red('💥 Uncaught Exception - Bot will restart'));
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      this.handleError(
        new Error(String(reason)),
        'UNHANDLED_REJECTION'
      );
      console.error(chalk.red('💥 Unhandled Promise Rejection'));
    });

    // Handle warnings
    process.on('warning', (warning) => {
      console.warn(chalk.yellow(`⚠️  Warning: ${warning.message}`));
    });
  }
}

module.exports = ErrorHandler;
