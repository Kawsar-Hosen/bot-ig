const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

/**
 * Database Manager - Handles persistent data storage
 */
class DatabaseManager {
  constructor(dbDir = './data') {
    this.dbDir = dbDir;
    this.userStatsFile = path.join(dbDir, 'user-stats.json');
    this.leaderboardFile = path.join(dbDir, 'leaderboard.json');
    this.settingsFile = path.join(dbDir, 'settings.json');
    this.activityFile = path.join(dbDir, 'activity-log.json');

    // Create data directory
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
      console.log(chalk.blue(`📁 Created data directory: ${dbDir}`));
    }

    // Initialize databases
    this.initializeDatabases();
  }

  /**
   * Initialize database files if they don't exist
   */
  initializeDatabases() {
    const files = [
      { file: this.userStatsFile, data: {} },
      { file: this.leaderboardFile, data: { weekly: [], monthly: [], allTime: [] } },
      { file: this.settingsFile, data: { admins: [], rules: '', settings: {} } },
      { file: this.activityFile, data: [] }
    ];

    files.forEach(({ file, data }) => {
      if (!fs.existsSync(file)) {
        fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf-8');
      }
    });
  }

  /**
   * Save user stats
   */
  saveUserStats(userId, stats) {
    try {
      let allStats = {};
      if (fs.existsSync(this.userStatsFile)) {
        allStats = JSON.parse(fs.readFileSync(this.userStatsFile, 'utf-8'));
      }

      allStats[userId] = {
        ...allStats[userId],
        ...stats,
        lastUpdated: new Date().toISOString()
      };

      fs.writeFileSync(this.userStatsFile, JSON.stringify(allStats, null, 2));
      return true;
    } catch (error) {
      console.error(chalk.red('Error saving user stats:'), error.message);
      return false;
    }
  }

  /**
   * Get user stats
   */
  getUserStats(userId) {
    try {
      const allStats = JSON.parse(fs.readFileSync(this.userStatsFile, 'utf-8'));
      return allStats[userId] || {
        messageCount: 0,
        joinedDate: new Date().toISOString(),
        lastActive: new Date().toISOString()
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Increment user message count
   */
  incrementMessageCount(userId) {
    try {
      const stats = this.getUserStats(userId);
      stats.messageCount = (stats.messageCount || 0) + 1;
      stats.lastActive = new Date().toISOString();
      this.saveUserStats(userId, stats);
      return stats.messageCount;
    } catch (error) {
      console.error(chalk.red('Error incrementing message count:'), error.message);
      return 0;
    }
  }

  /**
   * Get all user stats
   */
  getAllUserStats() {
    try {
      return JSON.parse(fs.readFileSync(this.userStatsFile, 'utf-8')) || {};
    } catch (error) {
      return {};
    }
  }

  /**
   * Update leaderboard
   */
  updateLeaderboard(period = 'weekly') {
    try {
      const stats = this.getAllUserStats();
      const leaderboard = Object.entries(stats)
        .sort((a, b) => (b[1].messageCount || 0) - (a[1].messageCount || 0))
        .map(([userId, userStats], index) => ({
          rank: index + 1,
          userId,
          messageCount: userStats.messageCount || 0,
          username: userStats.username || userId
        }))
        .slice(0, 10);

      const leaderboardData = JSON.parse(fs.readFileSync(this.leaderboardFile, 'utf-8'));
      leaderboardData[period] = leaderboard;
      leaderboardData.updated = new Date().toISOString();

      fs.writeFileSync(this.leaderboardFile, JSON.stringify(leaderboardData, null, 2));
      return leaderboard;
    } catch (error) {
      console.error(chalk.red('Error updating leaderboard:'), error.message);
      return [];
    }
  }

  /**
   * Get leaderboard
   */
  getLeaderboard(period = 'weekly') {
    try {
      const data = JSON.parse(fs.readFileSync(this.leaderboardFile, 'utf-8'));
      return data[period] || [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Save admin list
   */
  saveAdmins(admins) {
    try {
      const settings = JSON.parse(fs.readFileSync(this.settingsFile, 'utf-8'));
      settings.admins = admins;
      fs.writeFileSync(this.settingsFile, JSON.stringify(settings, null, 2));
      return true;
    } catch (error) {
      console.error(chalk.red('Error saving admins:'), error.message);
      return false;
    }
  }

  /**
   * Get admin list
   */
  getAdmins() {
    try {
      const settings = JSON.parse(fs.readFileSync(this.settingsFile, 'utf-8'));
      return settings.admins || [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Add activity log entry
   */
  addActivityLog(action, userId, details = {}) {
    try {
      let logs = [];
      if (fs.existsSync(this.activityFile)) {
        const content = fs.readFileSync(this.activityFile, 'utf-8');
        logs = content ? JSON.parse(content) : [];
      }

      logs.push({
        timestamp: new Date().toISOString(),
        action,
        userId,
        details
      });

      // Keep only last 1000 logs
      if (logs.length > 1000) {
        logs = logs.slice(-1000);
      }

      fs.writeFileSync(this.activityFile, JSON.stringify(logs, null, 2));
      return true;
    } catch (error) {
      console.error(chalk.red('Error adding activity log:'), error.message);
      return false;
    }
  }

  /**
   * Get activity logs
   */
  getActivityLogs(limit = 50) {
    try {
      const logs = JSON.parse(fs.readFileSync(this.activityFile, 'utf-8')) || [];
      return logs.slice(-limit);
    } catch (error) {
      return [];
    }
  }

  /**
   * Save group settings
   */
  saveGroupSettings(groupId, settings) {
    try {
      const allSettings = JSON.parse(fs.readFileSync(this.settingsFile, 'utf-8'));
      if (!allSettings.groups) {
        allSettings.groups = {};
      }

      allSettings.groups[groupId] = {
        ...allSettings.groups[groupId],
        ...settings,
        updatedAt: new Date().toISOString()
      };

      fs.writeFileSync(this.settingsFile, JSON.stringify(allSettings, null, 2));
      return true;
    } catch (error) {
      console.error(chalk.red('Error saving group settings:'), error.message);
      return false;
    }
  }

  /**
   * Get group settings
   */
  getGroupSettings(groupId) {
    try {
      const data = JSON.parse(fs.readFileSync(this.settingsFile, 'utf-8'));
      return data.groups?.[groupId] || {};
    } catch (error) {
      return {};
    }
  }

  /**
   * Export database as JSON
   */
  exportDatabase() {
    try {
      const data = {
        userStats: JSON.parse(fs.readFileSync(this.userStatsFile, 'utf-8')),
        leaderboard: JSON.parse(fs.readFileSync(this.leaderboardFile, 'utf-8')),
        settings: JSON.parse(fs.readFileSync(this.settingsFile, 'utf-8')),
        activityLog: JSON.parse(fs.readFileSync(this.activityFile, 'utf-8')),
        exportedAt: new Date().toISOString()
      };

      const exportFile = path.join(this.dbDir, `backup-${Date.now()}.json`);
      fs.writeFileSync(exportFile, JSON.stringify(data, null, 2));

      console.log(chalk.green(`📦 Database exported to: ${exportFile}`));
      return exportFile;
    } catch (error) {
      console.error(chalk.red('Error exporting database:'), error.message);
      return null;
    }
  }

  /**
   * Get database stats
   */
  getDatabaseStats() {
    try {
      const userStats = JSON.parse(fs.readFileSync(this.userStatsFile, 'utf-8'));
      const activityLog = JSON.parse(fs.readFileSync(this.activityFile, 'utf-8'));

      const totalUsers = Object.keys(userStats).length;
      const totalMessages = Object.values(userStats).reduce(
        (sum, stats) => sum + (stats.messageCount || 0),
        0
      );
      const totalActivities = activityLog.length;

      return {
        totalUsers,
        totalMessages,
        totalActivities,
        storageSize: this.getDirectorySize(this.dbDir)
      };
    } catch (error) {
      return {
        totalUsers: 0,
        totalMessages: 0,
        totalActivities: 0,
        storageSize: 0
      };
    }
  }

  /**
   * Get directory size in bytes
   */
  getDirectorySize(dir) {
    try {
      const files = fs.readdirSync(dir);
      let size = 0;

      files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        size += stat.size;
      });

      return (size / 1024).toFixed(2) + ' KB';
    } catch (error) {
      return '0 KB';
    }
  }

  /**
   * Print database stats
   */
  printStats() {
    const stats = this.getDatabaseStats();

    console.log(chalk.cyan('\n📊 Database Stats:'));
    console.log(chalk.white(`  Total Users: ${stats.totalUsers}`));
    console.log(chalk.white(`  Total Messages: ${stats.totalMessages}`));
    console.log(chalk.white(`  Total Activities: ${stats.totalActivities}`));
    console.log(chalk.white(`  Storage Size: ${stats.storageSize}`));
    console.log();
  }

  /**
   * Clear all data
   */
  clearAll() {
    try {
      this.initializeDatabases();
      console.log(chalk.yellow('🗑️  All database cleared and reset'));
      return true;
    } catch (error) {
      console.error(chalk.red('Error clearing database:'), error.message);
      return false;
    }
  }

  /**
   * Backup all databases
   */
  backup() {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupDir = path.join(this.dbDir, `backup-${timestamp}`);

      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }

      const files = [
        this.userStatsFile,
        this.leaderboardFile,
        this.settingsFile,
        this.activityFile
      ];

      files.forEach(file => {
        if (fs.existsSync(file)) {
          const fileName = path.basename(file);
          fs.copyFileSync(file, path.join(backupDir, fileName));
        }
      });

      console.log(chalk.green(`💾 Backup created at: ${backupDir}`));
      return backupDir;
    } catch (error) {
      console.error(chalk.red('Error creating backup:'), error.message);
      return null;
    }
  }
}

module.exports = DatabaseManager;
