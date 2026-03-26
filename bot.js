const { IgApiClient } = require('instagram-private-api');
const { promisify } = require('util');
const chalk = require('chalk');
const config = require('./config');
const {
  WELCOME_MESSAGE,
  LEAVE_MESSAGE,
  RULES_MESSAGE,
  CONGRATULATION_MESSAGE,
  INACTIVE_MESSAGE,
  MOTIVATIONAL_MESSAGE
} = require('./messages');
const {
  formatWelcomeMessage,
  formatLeaderboardMessage,
  getCurrentTime,
  sleep
} = require('./utils');

/**
 * Instagram Group Chat Bot Class
 * Handles all bot operations and interactions
 */
class InstagramGroupChatBot {
  constructor() {
    this.ig = new IgApiClient();
    this.logged = false;
    this.sessionData = null;
    this.threads = new Map(); // Cache group threads
    this.userMessages = new Map(); // Track message count per user
    this.lastSeenTime = new Map(); // Track last seen time
    this.lastMessageId = new Map(); // Track last message per thread
    this.admins = new Set(config.ADMIN_USERNAMES || []);
    this.processedMessages = new Set(); // Prevent duplicate processing
    this.newMembers = new Set(); // Track newly added members
  }

  /**
   * Initialize and login using SESSION_ID
   */
  async login() {
    try {
      console.log(chalk.blue('🔐 Attempting login with SESSION_ID...'));

      if (!config.SESSION_ID) {
        throw new Error('SESSION_ID not found in environment variables');
      }

      // Parse SESSION_ID (typically base64 encoded sessionData)
      let sessionData = {};
      try {
        sessionData = JSON.parse(
          Buffer.from(config.SESSION_ID, 'base64').toString('utf-8')
        );
      } catch (e) {
        // If base64 decode fails, try direct JSON parse
        sessionData = JSON.parse(config.SESSION_ID);
      }

      this.sessionData = sessionData;

      // Set proxy if configured
      if (config.PROXY_URL) {
        this.ig.state.proxyUrl = config.PROXY_URL;
      }

      // Load session data
      await this.ig.session.setData(sessionData);
      await this.ig.session.login();

      this.logged = true;

      const user = await this.ig.user.info(this.ig.state.cookieUserId);
      console.log(chalk.green(`✅ Successfully logged in as @${user.username}`));
      console.log(chalk.green(`⏰ Bot started at ${getCurrentTime()}\n`));

      return true;
    } catch (error) {
      console.error(chalk.red('❌ Login failed:'), error.message);
      console.error(
        chalk.yellow('💡 Make sure SESSION_ID is valid and bot is not already running.')
      );
      return false;
    }
  }

  /**
   * Start the bot and begin listening for messages
   */
  async start() {
    if (!(await this.login())) {
      process.exit(1);
    }

    console.log(chalk.cyan('👂 Listening for messages...\n'));

    // Start message polling
    this.startMessagePolling();

    // Start auto announcements
    this.startAutoAnnouncements();

    // Handle graceful shutdown
    process.on('SIGINT', () => this.shutdown());
    process.on('SIGTERM', () => this.shutdown());
  }

  /**
   * Poll messages every 3-5 seconds to check for new messages
   */
  startMessagePolling() {
    setInterval(async () => {
      try {
        const feed = this.ig.feed.directInbox();
        const threads = await feed.items();

        for (const thread of threads) {
          if (!thread.users || thread.users.length === 0) continue;

          const threadId = thread.thread_id;
          const threadKey = `thread_${threadId}`;

          // Cache thread info
          if (!this.threads.has(threadId)) {
            this.threads.set(threadId, thread);
          }

          try {
            // Get thread messages
            const messagesFeed = this.ig.feed.directThread({
              thread_id: threadId,
              oldest_cursor: this.lastMessageId.get(threadKey)
            });

            const messages = await messagesFeed.items();

            if (!messages || messages.length === 0) continue;

            // Process messages in chronological order (oldest first)
            const sortedMessages = messages.reverse();

            for (const message of sortedMessages) {
              await this.handleMessage(message, threadId, thread);
            }

            // Update last message ID
            if (messages.length > 0) {
              this.lastMessageId.set(threadKey, messages[0].id);
            }
          } catch (error) {
            if (!error.message.includes('Throttled')) {
              console.error(
                chalk.red(`Error processing thread ${threadId}:`),
                error.message
              );
            }
          }

          // Rate limiting
          await sleep(1000);
        }
      } catch (error) {
        if (!error.message.includes('Throttled')) {
          console.error(chalk.red('Error in message polling:'), error.message);
        }
      }
    }, config.POLLING_INTERVAL);
  }

  /**
   * Handle incoming messages
   */
  async handleMessage(message, threadId, thread) {
    try {
      // Skip if message is from bot itself
      if (message.user_id === this.ig.state.cookieUserId) {
        return;
      }

      // Avoid duplicate processing
      const messageKey = `${threadId}_${message.id}`;
      if (this.processedMessages.has(messageKey)) {
        return;
      }
      this.processedMessages.add(messageKey);

      // Clean up old entries (keep last 1000)
      if (this.processedMessages.size > 1000) {
        const arr = Array.from(this.processedMessages);
        arr.slice(0, 500).forEach(key => this.processedMessages.delete(key));
      }

      const sender = message.user_id;
      const senderUsername = await this.getUserUsername(sender);
      const threadName = thread.thread_title || 'Group Chat';

      // Track message count
      const count = (this.userMessages.get(sender) || 0) + 1;
      this.userMessages.set(sender, count);

      // Update last seen time
      this.lastSeenTime.set(sender, Date.now());

      // Handle text messages
      if (message.item_type === 'text' && message.text) {
        const text = message.text.toLowerCase().trim();

        console.log(
          chalk.cyan(`📨 [${threadName}] @${senderUsername}: ${message.text}`)
        );

        // Handle commands
        if (text.startsWith('/')) {
          await this.handleCommand(text, threadId, sender, senderUsername);
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

      // Detect new members (user join activity)
      await this.checkNewMembers(threadId, thread);
    } catch (error) {
      console.error(chalk.red('Error handling message:'), error.message);
    }
  }

  /**
   * Check for new members joining
   */
  async checkNewMembers(threadId, thread) {
    try {
      if (!thread.users) return;

      for (const user of thread.users) {
        const userId = user.pk || user.id;
        const memberKey = `member_${threadId}_${userId}`;

        // Check if new member
        if (!this.newMembers.has(memberKey)) {
          this.newMembers.add(memberKey);

          const username = user.username;

          // Send welcome message
          const welcomeMsg = formatWelcomeMessage(username);
          await this.sendMessage(threadId, welcomeMsg);

          console.log(
            chalk.green(`👋 Welcomed new member: @${username} in ${thread.thread_title}`)
          );

          await sleep(500);
        }
      }
    } catch (error) {
      console.error(chalk.red('Error checking new members:'), error.message);
    }
  }

  /**
   * Handle bot commands
   */
  async handleCommand(text, threadId, userId, username) {
    try {
      const parts = text.split(' ');
      const command = parts[0].toLowerCase();

      // /rules command
      if (command === '/rules') {
        await this.sendMessage(threadId, RULES_MESSAGE);
        console.log(chalk.blue(`📜 Rules sent by @${username}`));
        return;
      }

      // /kick command (admin only)
      if (command === '/kick') {
        if (!this.admins.has(username)) {
          await this.sendMessage(threadId, config.NOT_ADMIN_MESSAGE);
          return;
        }

        const targetUsername = parts[1]?.replace('@', '');
        if (!targetUsername) {
          await this.sendMessage(threadId, '❌ Usage: /kick @username');
          return;
        }

        await this.kickUser(threadId, targetUsername);
        return;
      }

      // /leaderboard command
      if (command === '/leaderboard') {
        const leaderboard = this.getLeaderboard();
        const message = formatLeaderboardMessage(leaderboard);
        await this.sendMessage(threadId, message);
        console.log(chalk.blue(`🏆 Leaderboard requested by @${username}`));
        return;
      }

      // /stats command
      if (command === '/stats') {
        const stats = this.getUserStats(userId);
        const message = `📊 Your Stats:\n\n💬 Messages: ${stats.messages}\n📱 Last Active: ${stats.lastActive}`;
        await this.sendMessage(threadId, message);
        return;
      }

      // /addadmin command (bot owner only)
      if (command === '/addadmin' && config.OWNER_USERNAME === username) {
        const newAdmin = parts[1]?.replace('@', '');
        if (newAdmin) {
          this.admins.add(newAdmin);
          await this.sendMessage(threadId, `✅ @${newAdmin} is now an admin`);
          console.log(chalk.green(`👑 @${newAdmin} added as admin`));
        }
        return;
      }
    } catch (error) {
      console.error(chalk.red('Error handling command:'), error.message);
      await this.sendMessage(threadId, '❌ Error executing command');
    }
  }

  /**
   * Kick a user from group
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
        await this.sendMessage(threadId, `❌ User @${targetUsername} not found in group`);
        return;
      }

      await this.ig.directThread.removeUsers({
        thread_id: threadId,
        user_ids: [targetUser.pk || targetUser.id]
      });

      await this.sendMessage(threadId, `👋 @${targetUsername} has been removed from the group`);
      console.log(chalk.yellow(`🚫 Kicked @${targetUsername} from ${threadId}`));
    } catch (error) {
      console.error(chalk.red('Error kicking user:'), error.message);
      await this.sendMessage(threadId, '❌ Error removing user');
    }
  }

  /**
   * Send message to thread
   */
  async sendMessage(threadId, text) {
    try {
      await this.ig.directThread.broadcastText({
        thread_id: threadId,
        text: text
      });

      console.log(chalk.green(`✅ Message sent to thread ${threadId}`));
      return true;
    } catch (error) {
      console.error(chalk.red(`Error sending message: ${error.message}`));
      return false;
    }
  }

  /**
   * Get username from user ID
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
   * Get user stats
   */
  getUserStats(userId) {
    const messages = this.userMessages.get(userId) || 0;
    const lastActive = this.lastSeenTime.get(userId);
    const lastActiveText = lastActive
      ? new Date(lastActive).toLocaleString()
      : 'Never';

    return {
      messages,
      lastActive: lastActiveText
    };
  }

  /**
   * Get leaderboard (top 10 users)
   */
  getLeaderboard() {
    return Array.from(this.userMessages.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([userId, count], index) => ({
        rank: index + 1,
        userId,
        count
      }));
  }

  /**
   * Start auto announcements every 2 hours
   */
  startAutoAnnouncements() {
    setInterval(async () => {
      try {
        const feed = this.ig.feed.directInbox();
        const threads = await feed.items();

        for (const thread of threads) {
          if (!thread.users || thread.users.length < 2) continue;

          const threadId = thread.thread_id;

          // Get most active user
          const leaderboard = this.getLeaderboard();
          if (leaderboard.length === 0) continue;

          const topUser = leaderboard[0];
          const topUsername = await this.getUserUsername(topUser.userId);
          const message = `🏆 আমাদের সবচেয়ে সক্রিয় সদস্য: @${topUsername}\n💬 মেসেজ: ${topUser.count}\n\n👍 চমৎকার কাজ! আরও মেসেজ পাঠান এবং সক্রিয় থাকুন! 🎉`;

          await this.sendMessage(threadId, message);
          console.log(chalk.green(`📣 Auto announcement sent to ${threadId}`));

          await sleep(2000);
        }
      } catch (error) {
        console.error(chalk.red('Error in auto announcement:'), error.message);
      }
    }, config.AUTO_ANNOUNCEMENT_INTERVAL);
  }

  /**
   * Graceful shutdown
   */
  async shutdown() {
    console.log(chalk.yellow('\n🛑 Shutting down bot gracefully...'));
    try {
      // Save session data if needed
      if (this.logged) {
        console.log(chalk.blue('💾 Session saved'));
      }
    } catch (error) {
      console.error('Error during shutdown:', error.message);
    }
    process.exit(0);
  }
}

/**
 * Initialize and start the bot
 */
async function initializeBot() {
  const bot = new InstagramGroupChatBot();
  await bot.start();
}

// Start bot
initializeBot().catch(error => {
  console.error(chalk.red('Fatal error:'), error);
  process.exit(1);
});

module.exports = InstagramGroupChatBot;
