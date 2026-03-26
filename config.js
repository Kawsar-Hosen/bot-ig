require('dotenv').config();

module.exports = {
  // Instagram Authentication
  SESSION_ID: process.env.SESSION_ID,
  
  // Proxy (optional)
  PROXY_URL: process.env.PROXY_URL || null,

  // Bot Settings
  POLLING_INTERVAL: parseInt(process.env.POLLING_INTERVAL) || 3000, // 3 seconds
  AUTO_ANNOUNCEMENT_INTERVAL: parseInt(process.env.AUTO_ANNOUNCEMENT_INTERVAL) || 7200000, // 2 hours
  
  // Admin Settings
  ADMIN_USERNAMES: (process.env.ADMIN_USERNAMES || '').split(',').filter(u => u),
  OWNER_USERNAME: process.env.OWNER_USERNAME || 'owner',
  
  // Messages
  SALAM_REPLY: process.env.SALAM_REPLY || '🌙 ওয়ালাইকুম আস্সালাম! কেমন আছেন? 😊',
  NOT_ADMIN_MESSAGE: '❌ আপনি অ্যাডমিন নন এই কমান্ড ব্যবহার করতে পারবেন না।',
  
  // Logging
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  ENABLE_DEBUG: process.env.ENABLE_DEBUG === 'true'
};
