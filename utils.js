const chalk = require('chalk');

/**
 * Sleep for specified milliseconds
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Get current time formatted
 */
const getCurrentTime = () => {
  const now = new Date();
  return now.toLocaleString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });
};

/**
 * Format welcome message with username
 */
const formatWelcomeMessage = (username) => {
  return `🌙✨ 𓆩 𝐀𝐬𝐬𝐚𝐥𝐚𝐦𝐮 𝐖𝐚𝐥𝐚𝐢𝐤𝐮𝐦 𓆪 🌌🪄

𝐌𝐞𝐦𝐛𝐞𝐫𝐬 : @${username}

🌸 𝐖𝐞𝐥𝐜𝐨𝐦𝐞 𝐓𝐨 𝐎𝐮𝐫 𝐀𝐝𝐝𝐚/𝐅𝐮𝐧/𝐌𝐞𝐦𝐨𝐫𝐢𝐞𝐬 𝐅𝐚𝐦𝐢𝐥𝐲 🌸

👑 𝐌𝐮𝐠-𝐞𝐫 𝐏𝐨𝐥𝐚𝐩𝐚𝐢𝐧 ☕️✨️ – 𝐃𝐫𝐞𝐚𝐦𝐬 & 𝐕𝐢𝐛𝐞𝐬 👑

🌷 𝐈𝐧𝐭𝐫𝐨𝐝𝐮𝐜𝐞 𝐘𝐨𝐮𝐫𝐬𝐞𝐥𝐟 🌷
💫 𝐒𝐩𝐫𝐞𝐚𝐝 𝐋𝐨𝐯𝐞, 𝐌𝐚𝐠𝐢𝐜 & 𝐏𝐨𝐬𝐢𝐭𝐢𝐯𝐢𝐭𝐲 💫
✨ 𝐒𝐡𝐢𝐧𝐞 𝐁𝐫𝐢𝐠𝐡𝐭, 𝐒𝐭𝐚𝐲 𝐀𝐜𝐭𝐢𝐯𝐞, 𝐒𝐭𝐚𝐲 𝐂𝐨𝐧𝐧𝐞𝐜𝐭𝐞𝐝 ✨

🌌 𝐋𝐞𝐭'𝐬 𝐂𝐫𝐞𝐚𝐭𝐞 𝐌𝐨𝐨𝐧𝐥𝐢𝐭 𝐌𝐞𝐦𝐨𝐫𝐢𝐞𝐬 𝐓𝐨𝐠𝐞𝐭𝐡𝐞𝐫 🌙💗🫶`;
};

/**
 * Format leaderboard message
 */
const formatLeaderboardMessage = (leaderboard) => {
  let message = `🏆 সাপ্তাহিক লিডারবোর্ড 🏆\n\n`;

  const medals = ['🥇', '🥈', '🥉'];

  leaderboard.forEach((entry, index) => {
    const medal = medals[index] || `#${index + 1}`;
    message += `${medal} ${entry.rank}. User #${entry.userId}\n   💬 ${entry.count} মেসেজ\n\n`;
  });

  message += `\n💪 চমৎকার কাজ সবাই! আরও সক্রিয় থাকুন! 🌟`;
  return message;
};

/**
 * Format date to Bangladeshi format
 */
const formatDateBangla = (date) => {
  const options = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  };
  return new Date(date).toLocaleString('bn-BD', options);
};

/**
 * Check if username is valid
 */
const isValidUsername = (username) => {
  const regex = /^[a-zA-Z0-9._-]{1,30}$/;
  return regex.test(username);
};

/**
 * Extract username from mention (@username)
 */
const extractUsername = (mention) => {
  return mention.replace('@', '').toLowerCase();
};

/**
 * Get emoji for rank
 */
const getRankEmoji = (rank) => {
  const emojis = {
    1: '🥇',
    2: '🥈',
    3: '🥉'
  };
  return emojis[rank] || `#${rank}`;
};

/**
 * Log event with timestamp
 */
const logEvent = (type, message, data = {}) => {
  const timestamp = getCurrentTime();
  const colors = {
    info: 'blue',
    success: 'green',
    warning: 'yellow',
    error: 'red',
    debug: 'gray'
  };

  const color = colors[type] || 'blue';
  const prefix = {
    info: 'ℹ️',
    success: '✅',
    warning: '⚠️',
    error: '❌',
    debug: '🔍'
  };

  console.log(
    chalk[color](
      `${prefix[type]} [${timestamp}] ${message}`,
      data && Object.keys(data).length > 0 ? JSON.stringify(data) : ''
    )
  );
};

/**
 * Parse command arguments
 */
const parseCommand = (text) => {
  const parts = text.split(' ');
  return {
    command: parts[0].toLowerCase(),
    args: parts.slice(1)
  };
};

/**
 * Create a unique key for thread and user combination
 */
const createThreadUserKey = (threadId, userId) => {
  return `${threadId}_${userId}`;
};

/**
 * Retry async function with exponential backoff
 */
const retryAsync = async (fn, maxRetries = 3, delay = 1000) => {
  let lastError;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (i < maxRetries - 1) {
        const waitTime = delay * Math.pow(2, i);
        await sleep(waitTime);
      }
    }
  }

  throw lastError;
};

/**
 * Sanitize message text (remove harmful characters)
 */
const sanitizeMessage = (text) => {
  if (!text) return '';
  return text
    .trim()
    .slice(0, 4096) // Instagram message limit
    .replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F]/g, ''); // Remove control characters
};

/**
 * Get time difference from now
 */
const getTimeDifference = (timestamp) => {
  const now = Date.now();
  const diff = now - timestamp;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return `${seconds}s ago`;
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return 'more than a week ago';
};

module.exports = {
  sleep,
  getCurrentTime,
  formatWelcomeMessage,
  formatLeaderboardMessage,
  formatDateBangla,
  isValidUsername,
  extractUsername,
  getRankEmoji,
  logEvent,
  parseCommand,
  createThreadUserKey,
  retryAsync,
  sanitizeMessage,
  getTimeDifference
};
