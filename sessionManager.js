const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

/**
 * Session Manager - Handles session persistence and recovery
 */
class SessionManager {
  constructor(sessionDir = './sessions') {
    this.sessionDir = sessionDir;
    this.sessionFile = path.join(sessionDir, 'instagram-session.json');
    this.logFile = path.join(sessionDir, 'session.log');

    // Create session directory if it doesn't exist
    if (!fs.existsSync(sessionDir)) {
      fs.mkdirSync(sessionDir, { recursive: true });
      console.log(chalk.blue(`📁 Created session directory: ${sessionDir}`));
    }
  }

  /**
   * Save session data to file
   */
  saveSession(sessionData, userId) {
    try {
      const session = {
        userId,
        sessionData,
        savedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
      };

      fs.writeFileSync(
        this.sessionFile,
        JSON.stringify(session, null, 2),
        'utf-8'
      );

      this.logAction('SESSION_SAVED', userId);
      console.log(chalk.green(`💾 Session saved for user ${userId}`));
      return true;
    } catch (error) {
      console.error(chalk.red('Error saving session:'), error.message);
      return false;
    }
  }

  /**
   * Load session data from file
   */
  loadSession() {
    try {
      if (!fs.existsSync(this.sessionFile)) {
        console.log(chalk.yellow('⚠️  No saved session found'));
        return null;
      }

      const data = fs.readFileSync(this.sessionFile, 'utf-8');
      const session = JSON.parse(data);

      // Check if session expired
      if (new Date(session.expiresAt) < new Date()) {
        console.log(chalk.yellow('⚠️  Session expired'));
        this.deleteSession();
        return null;
      }

      this.logAction('SESSION_LOADED', session.userId);
      console.log(chalk.green(`✅ Session loaded for user ${session.userId}`));
      return session.sessionData;
    } catch (error) {
      console.error(chalk.red('Error loading session:'), error.message);
      return null;
    }
  }

  /**
   * Delete saved session
   */
  deleteSession() {
    try {
      if (fs.existsSync(this.sessionFile)) {
        fs.unlinkSync(this.sessionFile);
        console.log(chalk.blue('🗑️  Session file deleted'));
      }
    } catch (error) {
      console.error(chalk.red('Error deleting session:'), error.message);
    }
  }

  /**
   * Check if session exists and is valid
   */
  isSessionValid() {
    try {
      if (!fs.existsSync(this.sessionFile)) {
        return false;
      }

      const data = fs.readFileSync(this.sessionFile, 'utf-8');
      const session = JSON.parse(data);

      return new Date(session.expiresAt) > new Date();
    } catch (error) {
      return false;
    }
  }

  /**
   * Get session expiration time
   */
  getSessionExpiration() {
    try {
      const data = fs.readFileSync(this.sessionFile, 'utf-8');
      const session = JSON.parse(data);
      return new Date(session.expiresAt);
    } catch (error) {
      return null;
    }
  }

  /**
   * Log action to session log file
   */
  logAction(action, details = '') {
    try {
      const timestamp = new Date().toISOString();
      const logEntry = `[${timestamp}] ${action} - ${details}\n`;

      fs.appendFileSync(this.logFile, logEntry, 'utf-8');
    } catch (error) {
      console.error(chalk.red('Error logging action:'), error.message);
    }
  }

  /**
   * Get session info
   */
  getSessionInfo() {
    try {
      if (!fs.existsSync(this.sessionFile)) {
        return null;
      }

      const data = fs.readFileSync(this.sessionFile, 'utf-8');
      const session = JSON.parse(data);

      return {
        userId: session.userId,
        savedAt: new Date(session.savedAt),
        expiresAt: new Date(session.expiresAt),
        isValid: new Date(session.expiresAt) > new Date(),
        daysRemaining: Math.floor(
          (new Date(session.expiresAt) - new Date()) / (1000 * 60 * 60 * 24)
        )
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Print session status
   */
  printSessionStatus() {
    const info = this.getSessionInfo();

    if (!info) {
      console.log(chalk.yellow('No active session'));
      return;
    }

    console.log(chalk.cyan('\n📊 Session Status:'));
    console.log(chalk.white(`  User ID: ${info.userId}`));
    console.log(chalk.white(`  Saved: ${info.savedAt.toLocaleString()}`));
    console.log(chalk.white(`  Expires: ${info.expiresAt.toLocaleString()}`));
    console.log(chalk.white(`  Days Remaining: ${info.daysRemaining}`));
    console.log(
      chalk[info.isValid ? 'green' : 'red'](
        `  Status: ${info.isValid ? '✅ Valid' : '❌ Expired'}`
      )
    );
    console.log();
  }

  /**
   * Clear all session logs
   */
  clearLogs() {
    try {
      if (fs.existsSync(this.logFile)) {
        fs.unlinkSync(this.logFile);
        console.log(chalk.blue('📋 Logs cleared'));
      }
    } catch (error) {
      console.error(chalk.red('Error clearing logs:'), error.message);
    }
  }

  /**
   * Get session logs
   */
  getLogs(limit = 50) {
    try {
      if (!fs.existsSync(this.logFile)) {
        return [];
      }

      const content = fs.readFileSync(this.logFile, 'utf-8');
      const lines = content.trim().split('\n');
      return lines.slice(-limit);
    } catch (error) {
      console.error(chalk.red('Error reading logs:'), error.message);
      return [];
    }
  }
}

module.exports = SessionManager;
