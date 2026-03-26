const { IgApiClient } = require('instagram-private-api');
const chalk = require('chalk');
const config = require('./config');
const SessionManager = require('./sessionManager');
const ErrorHandler = require('./errorHandler');
const DatabaseManager = require('./databaseManager');
const {
  formatWelcomeMessage,
  formatLeaderboardMessage,
  sleep,
  getCurrentTime
} = require('./utils');

/**
 * Advanced Instagram Group Chat Bot
 * Production-ready version with all features integrated
 */
class AdvancedInstagramBot {
  constructor() {
    this.ig = new IgApiClient();
    this.logged = false;
    this.sessionManager = new SessionManager();
    this.errorHandler = new ErrorHandler();
    this.db = new DatabaseManager();
    
    // Runtime state
    this.threads = new Map();
    this.lastSeenTime = new Map();
    this.lastMessageId = new Map();
    this.processedMessages = new Set();
    this.newMembers = new Set();
    this.admins = new Set(config.ADMIN_USERNAMES || []);
    this.isHealthy = true;
    
    // Statistics
    this.stats = {
      messagesProcessed: 0,
      commandsExecuted: 0,
      errorsHandled: 0,
      uptime: Date.now()
    };

    // Setup global error handlers
    this.errorHandler.setupGlobalHandlers();

    console.log(chalk.cyan('🤖 Advanced Instagram Group Chat Bot v1.0'));
    console.log(chalk.gray(`📦 Initialized at ${getCurrentTime()}\n`));
  }

  /**
   * Main startup sequence
   */
  async start() {
    try {
      console.log(chalk.blue('🚀 Starting bot...\n'));

      // Load previous session
      const previousSession = this.sessionManager.loadSession();
      if (previousSession) {
        console.log(chalk.green('📦 Using saved session'));
        await this.loginWithSession(previousSession);
      } else {
        console.log(chalk.blue('🔐 Creating new session'));
        await this.loginWithSessionId();
      }

      if (!this.logged) {
        throw new Error('Failed to login');
      }

      // Start all services
      this.startMessagePolling();
      this.startAutoAnnouncements();
      this.startHealthCheck();
      this.startPeriodicMaintenance();

      console.log(chalk.green(`\n✅ Bot fully operational at ${getCurrentTime()}\n`));
      console.log(chalk.cyan('📊 Services started:'));
      console.log(chalk.cyan('  ✓ Message polling'));
      console.log(chalk.cyan('  ✓ Auto announcements'));
      console.log(chalk.cyan('  ✓ Health monitoring'));
      console.log(chalk.cyan('  ✓ Database persistence\n'));

      // Print initial stats
      this.printStartupInfo();

      // Handle graceful shutdown
      process.on('SIGINT', () => this.shutdown());
      process.on('SIGTERM', () => this.shutdown());
    } catch (error) {
      this.errorHandler.handleError(error, 'BOT_STARTUP');
      process.exit(1);
    }
  }

  /**
   * Login with saved session
   */
  async loginWithSession(sessionData) {
    try {
      console.log(chalk.blue('🔄 Restoring session...'));
      await this.ig.session.setData(sessionData);
      await this.ig.session.login();
      
      this.logged = true;
      const user = await this.ig.user.info(this.ig.state.cookieUserId);
      console.log(chalk.green(`✅ Session restored for @${user.username}`));
      
      return true;
    } catch (error) {
      console.log(chalk.yellow('⚠️  Session restoration failed, creating new one'));
      return await this.loginWithSessionId();
    }
  }

  /**
   * Login with SESSION_ID from environment
   */
  async loginWithSessionId() {
    try {
      if (!config.SESSION_ID) {
        throw new Error('SESSION_ID not found in .env file');
      }

      console.log(chalk.blue('🔐 Logging in with SESSION_ID...'));

      let sessionData = {};
      try {
        sessionData = JSON.parse(
          Buffer.from(config.SESSION_ID, 'base64').toString('utf-8')
        );
      } catch (e) {
        sessionData = JSON.parse(config.SESSION_ID);
      }

      if (config.PROXY_URL) {
        this.ig.state.proxyUrl = config.PROXY_URL;
      }

      await this.ig.session.setData(sessionData);
      await this.ig.session.login();

      this.logged = true;

      const user = await this.ig.user.info(this.ig.state.cookieUserId);
      console.log(chalk.green(`✅ Successfully logged in as @${user.username}`));

      // Save session
      this.sessionManager.saveSession(sessionData, user.id);
      this.db.addActivityLog('LOGIN', user.id, { username: user.username });

      return true;
    } catch (error) {
      this.errorHandler.handleError(error, 'LOGIN');
      return false;
    }
  }

  /**
   * Start message polling loop
   */
  startMessagePolling() {
    setInterval(async () => {
      if (!this.isHealthy) return;

      try {
        const feed = this.ig.feed.directInbox();
        const threads = await feed.items();

        for (const thread of threads) {
          if (!thread.users || thread.users.length === 0) continue;

          const threadId = thread.thread_id;
          const threadKey = `thread_${threadId}`;

          if (!this.threads.has(threadId)) {
            this.threads.set(threadId, thread);
          }

          try {
            const messagesFeed = this.ig.feed.directThread({
              thread_id: threadId,
              oldest_cursor: this.lastMessageId.get(threadKey)
            });

            const messages = await messagesFeed.items();

            if (messages && messages.length > 0) {
              const sortedMessages = messages.reverse();

              for (const message of sortedMessages) {
                await this.handleMessage(message, threadId, thread);
              }

              this.lastMessageId.set(threadKey, messages[0].id);
            }

            // Check for new members
            await this.checkNewMembers(threadId, thread);
          } catch (error) {
            if (!error.message.includes('Throttled')) {
              this.errorHandler.handleError(error, `THREAD_${threadId}`);
            }
          }

          await sleep(1000);
        }
      } catch (error) {
        if (!error.message.includes('Throttled')) {
          this.errorHandler.handleError(error, 'MESSAGE_POLLING');
        }
      }
    }, config.POLLING_INTERVAL);
  }

  /**
   * Handle incoming message
   */
  async handleMessage(message, threadId, thread) {
    try {
      if (message.user_id === this.ig.state.cookieUserId) return;

      const messageKey = `${threadId}_${message.id}`;
      if (this.processedMessages.has(messageKey)) return;
      this.processedMessages.add(messageKey);

      if (this.processedMessages.size > 1000) {
        const arr = Array.from(this.processedMessages);
        arr.slice(0, 500).forEach(key => this.processedMessages.delete(key));
      }

      const sender = message.user_id;
      const senderUsername = await this.getUserUsername(sender);
      const threadName = thread.thread_title || 'Group Chat';

      // Update user stats
      const messageCount = this.db.incrementMessageCount(sender);
      this.lastSeenTime.set(sender, Date.now());

      this.stats.messagesProcessed++;

      // Log message
      console.log(
        chalk.cyan(`📨 [${threadName}] @${senderUsername}: ${message.text || '[Media]'}`)
      );

      // Handle text messages
      if (message.item_type === 'text' && message.text) {
        const text = message.text.toLowerCase().trim();

        if (text.startsWith('/')) {
          await this.handleCommand(text, threadId, sender, senderUsername);
          this.stats.commandsExecuted++;
          return;
        }

        // Salam auto reply
        if (
          text.includes('salam') ||
          text.includes('assalam') ||
          text.includes('assalamualaikum')
        ) {
          await this.sendMessage(threadId, config.SALAM_REPLY);
          await sleep(500);
        }
      }
    } catch (error) {
      this.errorHandler.handleError(error, 'MESSAGE_HANDLER');
      this.stats.errorsHandled++;
    }
  }

  /**
   * Handle bot commands
   */
  async handleCommand(text, threadId, userId, username) {
    try {
      const parts = text.split(' ');
      const command = parts[0].toLowerCase();

      switch (command) {
        case '/rules':
          await this.sendRules(threadId);
          break;

        case '/leaderboard':
          await this.sendLeaderboard(threadId);
          break;

        case '/stats':
          await this.sendStats(threadId, userId);
          break;

        case '/kick':
          if (this.admins.has(username)) {
            const target = parts[1]?.replace('@', '');
            if (target) await this.kickUser(threadId, target);
          } else {
            await this.sendMessage(threadId, config.NOT_ADMIN_MESSAGE);
          }
          break;

        case '/addadmin':
          if (config.OWNER_USERNAME === username) {
            const newAdmin = parts[1]?.replace('@', '');
            if (newAdmin) {
              this.admins.add(newAdmin);
              this.db.saveAdmins(Array.from(this.admins));
              await this.sendMessage(threadId, `✅ @${newAdmin} is now an admin`);
            }
          }
          break;

        case '/help':
          await this.sendHelp(threadId);
          break;

        case '/info':
          await this.sendInfo(threadId);
          break;

        default:
          await this.sendMessage(threadId, '❌ Unknown command. Type /help for available commands.');
      }

      this.db.addActivityLog('COMMAND', userId, { command, username });
    } catch (error) {
      this.errorHandler.handleError(error, 'COMMAND_HANDLER');
      await this.sendMessage(threadId, '❌ Error executing command');
    }
  }

  /**
   * Send rules
   */
  async sendRules(threadId) {
    const rules = `𝐌𝐮𝐠-𝐞𝐫 𝐏𝐨𝐥𝐚𝐩𝐚𝐢𝐧 ☕️💫

1:)-GC te ese sobar sathe porichito hote hobe(intro khuje niben proyojone..nije o diben)
2:)-Sobar sathe mile mishe thakben..jhamela hole age admin k report diben✅
3:)-Video make er somoy kono extra text diben na❌
4:)- GC te reels allow na❌
5:)- gali diben na❌
6:)-18+ kotha bolben na❌
7:)-Kew msg dile sby response korte hobe✅
8:)-spam kora allow nah❌
9:)-New member add hole sobai welcome janaben✅
10:)-follow back chawa jabe nah❌

Sob sheshe GC er sob rules mene cholben💖🌼Thank You..🎀🫶`;

    await this.sendMessage(threadId, rules);
  }

  /**
   * Send leaderboard
   */
  async sendLeaderboard(threadId) {
    const leaderboard = this.db.updateLeaderboard('weekly');
    const message = formatLeaderboardMessage(leaderboard);
    await this.sendMessage(threadId, message);
  }

  /**
   * Send user stats
   */
  async sendStats(threadId, userId) {
    const stats = this.db.getUserStats(userId);
    const message = `📊 Your Stats:\n\n💬 Messages: ${stats.messageCount || 0}\n📱 Last Active: ${new Date(stats.lastActive).toLocaleString()}`;
    await this.sendMessage(threadId, message);
  }

  /**
   * Send help
   */
  async sendHelp(threadId) {
    const help = `📖 Available Commands:\n\n
/rules - Show group rules
/leaderboard - Top 10 active users
/stats - Your personal stats
/kick @username - Remove user (admin only)
/info - Bot information
/help - This message

💡 Type commands in the group chat!`;

    await this.sendMessage(threadId, help);
  }

  /**
   * Send bot info
   */
  async sendInfo(threadId) {
    const uptime = Math.floor((Date.now() - this.stats.uptime) / 1000);
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);

    const info = `🤖 Bot Information\n\n
⏱️  Uptime: ${hours}h ${minutes}m
📨 Messages Processed: ${this.stats.messagesProcessed}
🎯 Commands Executed: ${this.stats.commandsExecuted}
👥 Active Users: ${this.db.getAllUserStats().length || 'Loading...'}

Status: ${this.isHealthy ? '✅ Healthy' : '⚠️ Degraded'}`;

    await this.sendMessage(threadId, info);
  }

  /**
   * Kick user from group
   */
  async kickUser(threadId, targetUsername) {
    try {
      const thread = this.threads.get(threadId);
      if (!thread || !thread.users) {
        await this.sendMessage(threadId, '❌ Could not find user');
        return;
      }

      const targetUser = thread.users.find(u => u.username === targetUsername);
      if (!targetUser) {
        await this.sendMessage(threadId, `❌ User @${targetUsername} not found`);
        return;
      }

      await this.ig.directThread.removeUsers({
        thread_id: threadId,
        user_ids: [targetUser.pk || targetUser.id]
      });

      await this.sendMessage(threadId, `👋 @${targetUsername} has been removed`);
      this.db.addActivityLog('USER_KICKED', targetUser.pk, { username: targetUsername });
    } catch (error) {
      this.errorHandler.handleError(error, 'KICK_USER');
    }
  }

  /**
   * Check for new members
   */
  async checkNewMembers(threadId, thread) {
    try {
      if (!thread.users) return;

      for (const user of thread.users) {
        const userId = user.pk || user.id;
        const memberKey = `member_${threadId}_${userId}`;

        if (!this.newMembers.has(memberKey)) {
          this.newMembers.add(memberKey);

          const username = user.username;
          const welcomeMsg = formatWelcomeMessage(username);
          await this.sendMessage(threadId, welcomeMsg);

          console.log(chalk.green(`👋 Welcomed @${username}`));
          this.db.addActivityLog('MEMBER_JOINED', userId, { username });

          await sleep(500);
        }
      }
    } catch (error) {
      this.errorHandler.handleError(error, 'NEW_MEMBER_CHECK');
    }
  }

  /**
   * Start auto announcements
   */
  startAutoAnnouncements() {
    setInterval(async () => {
      if (!this.isHealthy) return;

      try {
        const feed = this.ig.feed.directInbox();
        const threads = await feed.items();

        for (const thread of threads) {
          if (!thread.users || thread.users.length < 2) continue;

          const threadId = thread.thread_id;
          const leaderboard = this.db.getLeaderboard('weekly');

          if (leaderboard.length === 0) continue;

          const topUser = leaderboard[0];
          const message = `🏆 আমাদের সবচেয়ে সক্রিয় সদস্য: @${topUser.username}\n💬 মেসেজ: ${topUser.messageCount}\n\n👍 চমৎকার কাজ! আরও মেসেজ পাঠান এবং সক্রিয় থাকুন! 🎉`;

          await this.sendMessage(threadId, message);
          await sleep(2000);
        }
      } catch (error) {
        this.errorHandler.handleError(error, 'AUTO_ANNOUNCEMENT');
      }
    }, config.AUTO_ANNOUNCEMENT_INTERVAL);
  }

  /**
   * Start health check
   */
  startHealthCheck() {
    setInterval(async () => {
      try {
        // Simple connectivity check
        await this.ig.user.info(this.ig.state.cookieUserId);
        this.isHealthy = true;
      } catch (error) {
        this.isHealthy = false;
        console.warn(chalk.yellow('⚠️  Health check failed'));
        this.errorHandler.handleError(error, 'HEALTH_CHECK');
      }
    }, 60000); // Every minute
  }

  /**
   * Start periodic maintenance
   */
  startPeriodicMaintenance() {
    setInterval(() => {
      // Update leaderboard
      this.db.updateLeaderboard('weekly');
      
      // Log stats
      console.log(chalk.blue(`\n📊 Stats Update: ${this.stats.messagesProcessed} messages, ${this.stats.commandsExecuted} commands`));
      
      // Export database backup every hour
      if (this.stats.messagesProcessed % 100 === 0) {
        this.db.backup();
      }
    }, 3600000); // Every hour
  }

  /**
   * Send message
   */
  async sendMessage(threadId, text) {
    try {
      await this.ig.directThread.broadcastText({
        thread_id: threadId,
        text: text
      });
      return true;
    } catch (error) {
      this.errorHandler.handleError(error, `SEND_MESSAGE_${threadId}`);
      return false;
    }
  }

  /**
   * Get username from ID
   */
  async getUserUsername(userId) {
    try {
      const user = await this.ig.user.info(userId);
      return user.username || `user_${userId}`;
    } catch (error) {
      return `user_${userId}`;
    }
  }

  /**
   * Print startup info
   */
  printStartupInfo() {
    console.log(chalk.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
    console.log(chalk.cyan('🤖 Instagram Group Chat Bot'));
    console.log(chalk.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
    
    this.sessionManager.printSessionStatus();
    this.db.printStats();

    const adminList = Array.from(this.admins).join(', ') || 'None';
    console.log(chalk.cyan(`👑 Admins: ${adminList}`));
    console.log(chalk.cyan(`📊 Polling Interval: ${config.POLLING_INTERVAL}ms`));
    console.log(chalk.cyan(`📣 Announcement Interval: ${config.AUTO_ANNOUNCEMENT_INTERVAL}ms`));
    console.log(chalk.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));
  }

  /**
   * Graceful shutdown
   */
  async shutdown() {
    console.log(chalk.yellow('\n\n🛑 Shutting down bot gracefully...\n'));

    try {
      // Save final stats
      this.db.addActivityLog('BOT_SHUTDOWN', 'SYSTEM', {
        messagesProcessed: this.stats.messagesProcessed,
        commandsExecuted: this.stats.commandsExecuted,
        uptime: Date.now() - this.stats.uptime
      });

      // Create final backup
      this.db.backup();

      console.log(chalk.green('✅ Data saved and backed up'));
      console.log(chalk.green('✅ Bot stopped gracefully'));
    } catch (error) {
      console.error(chalk.red('Error during shutdown:'), error.message);
    }

    process.exit(0);
  }
}

/**
 * Initialize and start bot
 */
async function main() {
  const bot = new AdvancedInstagramBot();
  await bot.start();
}

main().catch(error => {
  console.error(chalk.red('Fatal error:'), error);
  process.exit(1);
});

module.exports = AdvancedInstagramBot;
