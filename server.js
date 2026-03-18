/**
 * Instagram Group Chat Bot Backend Server
 * Deploy on Render with start command: npm start
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { IgApiClient } = require('instagram-private-api');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Instagram client
const ig = new IgApiClient();

// Bot state
let botState = {
  running: false,
  connected: false,
  loggedInUser: null,
  lastError: null,
  startTime: null
};

// Data storage paths
const DATA_DIR = path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const LOGS_FILE = path.join(DATA_DIR, 'logs.json');
const MESSAGES_FILE = path.join(DATA_DIR, 'messages.json');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initialize data files
const initDataFile = (filePath, defaultData) => {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2));
  }
};

initDataFile(USERS_FILE, { users: {} });
initDataFile(LOGS_FILE, { logs: [] });
initDataFile(MESSAGES_FILE, {
  welcome: 'স্বাগতম গ্রুপে! নিয়ম মেনে চলুন।',
  rules: '📜 গ্রুপের নিয়মাবলী:\n1. সবার সাথে সম্মান বজায় রাখুন\n2. স্প্যাম করবেন না\n3. অশ্লীল কন্টেন্ট নিষিদ্ধ\n4. এডমিনদের কথা মানুন',
  seenWarning: '👀 @{username} আপনি দেখলেন কিন্তু কথা বলছেন না?',
  activeUser: '🎉 @{username} আজকের সবচেয়ে একটিভ ইউজার! {count} টি মেসেজ!'
});
initDataFile(SETTINGS_FILE, {
  autoWelcome: true,
  seenDetection: true,
  leaderboard: true,
  commands: true,
  pollInterval: 5000
});

// Helper functions
const readJSON = (filePath) => {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (e) {
    return null;
  }
};

const writeJSON = (filePath, data) => {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
};

const addLog = (type, message, details = {}) => {
  const logs = readJSON(LOGS_FILE) || { logs: [] };
  const logEntry = {
    id: Date.now(),
    type,
    message,
    details,
    timestamp: new Date().toISOString()
  };
  logs.logs.unshift(logEntry);
  // Keep only last 500 logs
  logs.logs = logs.logs.slice(0, 500);
  writeJSON(LOGS_FILE, logs);
  console.log(`[${type.toUpperCase()}] ${message}`, details);
  return logEntry;
};

// Track processed messages to avoid duplicates
let processedMessages = new Set();
let lastSeenCheck = {};
let botInterval = null;
let hourlyLeaderboardInterval = null;
let targetThreadId = null;

// Bot functions
const processMessage = async (item, thread) => {
  try {
    const messageId = item.item_id;
    
    // Skip if already processed
    if (processedMessages.has(messageId)) return;
    processedMessages.add(messageId);
    
    // Keep set size manageable
    if (processedMessages.size > 1000) {
      const arr = Array.from(processedMessages);
      processedMessages = new Set(arr.slice(-500));
    }
    
    const userId = item.user_id;
    const username = item.user?.username || `user_${userId}`;
    const text = item.text || '';
    
    // Update user stats
    const usersData = readJSON(USERS_FILE) || { users: {} };
    if (!usersData.users[userId]) {
      usersData.users[userId] = {
        username,
        messageCount: 0,
        lastActive: null,
        joinedAt: new Date().toISOString()
      };
    }
    usersData.users[userId].messageCount++;
    usersData.users[userId].lastActive = new Date().toISOString();
    usersData.users[userId].username = username;
    writeJSON(USERS_FILE, usersData);
    
    addLog('message', `${username}: ${text.substring(0, 50)}...`, { userId, username });
    
    const settings = readJSON(SETTINGS_FILE) || {};
    const messages = readJSON(MESSAGES_FILE) || {};
    
    // Auto reply to "salam"
    if (text.toLowerCase().includes('salam') || text.toLowerCase().includes('সালাম')) {
      await thread.broadcastText('ওয়ালাইকুম আসসালাম ❤️');
      addLog('reply', 'Replied to salam greeting');
    }
    
    // Commands
    if (settings.commands) {
      if (text.toLowerCase() === '/rules' || text.toLowerCase() === '/নিয়ম') {
        await thread.broadcastText(messages.rules || 'Rules not set');
        addLog('command', 'Sent rules');
      }
      
      if (text.toLowerCase() === '/leaderboard' || text.toLowerCase() === '/top') {
        const topUsers = getTopUsers(5);
        let leaderboardText = '🏆 টপ ইউজার:\n';
        topUsers.forEach((u, i) => {
          leaderboardText += `${i + 1}. @${u.username} - ${u.messageCount} মেসেজ\n`;
        });
        await thread.broadcastText(leaderboardText);
        addLog('command', 'Sent leaderboard');
      }
      
      if (text.toLowerCase() === '/help' || text.toLowerCase() === '/সাহায্য') {
        await thread.broadcastText('📋 কমান্ড সমূহ:\n/rules - গ্রুপের নিয়ম\n/leaderboard - টপ ইউজার\n/help - সাহায্য');
        addLog('command', 'Sent help');
      }
    }
    
    // Active user recognition (every 5 messages milestone)
    if (usersData.users[userId].messageCount % 5 === 0 && settings.leaderboard) {
      const msg = (messages.activeUser || '🎉 @{username} চালিয়ে যান! {count} টি মেসেজ!')
        .replace('{username}', username)
        .replace('{count}', usersData.users[userId].messageCount);
      await thread.broadcastText(msg);
      addLog('milestone', `${username} reached ${usersData.users[userId].messageCount} messages`);
    }
    
  } catch (error) {
    addLog('error', `Error processing message: ${error.message}`);
  }
};

const getTopUsers = (limit = 10) => {
  const usersData = readJSON(USERS_FILE) || { users: {} };
  return Object.values(usersData.users)
    .sort((a, b) => b.messageCount - a.messageCount)
    .slice(0, limit);
};

const checkSeenUsers = async (thread, participants) => {
  const settings = readJSON(SETTINGS_FILE) || {};
  if (!settings.seenDetection) return;
  
  const messages = readJSON(MESSAGES_FILE) || {};
  const now = Date.now();
  const twoMinutes = 2 * 60 * 1000;
  
  for (const participant of participants) {
    const userId = participant.pk;
    const username = participant.username;
    
    // Skip self
    if (userId === botState.loggedInUser?.pk) continue;
    
    const lastCheck = lastSeenCheck[userId] || 0;
    const usersData = readJSON(USERS_FILE) || { users: {} };
    const userLastActive = usersData.users[userId]?.lastActive;
    
    if (userLastActive) {
      const timeSinceActive = now - new Date(userLastActive).getTime();
      
      // If user hasn't been active for 2 minutes and we haven't warned them recently
      if (timeSinceActive > twoMinutes && now - lastCheck > twoMinutes * 3) {
        const warning = (messages.seenWarning || '👀 @{username} কোথায় হারিয়ে গেলেন?')
          .replace('{username}', username);
        await thread.broadcastText(warning);
        lastSeenCheck[userId] = now;
        addLog('seen', `Warned inactive user: ${username}`);
      }
    }
  }
};

const hourlyLeaderboard = async (thread) => {
  const settings = readJSON(SETTINGS_FILE) || {};
  if (!settings.leaderboard) return;
  
  const topUsers = getTopUsers(3);
  if (topUsers.length === 0) return;
  
  let text = '⏰ ঘণ্টার টপ ইউজার:\n';
  topUsers.forEach((u, i) => {
    text += `${['🥇', '🥈', '🥉'][i]} @${u.username} - ${u.messageCount} মেসেজ\n`;
  });
  
  await thread.broadcastText(text);
  addLog('leaderboard', 'Sent hourly leaderboard');
};

const runBotLoop = async () => {
  if (!botState.running || !botState.connected) return;
  
  try {
    // Get inbox
    const inbox = ig.feed.directInbox();
    const threads = await inbox.items();
    
    if (threads.length === 0) {
      addLog('info', 'No threads found');
      return;
    }
    
    // Process first group thread or specified thread
    for (const threadData of threads) {
      // Check if it's a group chat
      if (threadData.is_group) {
        const thread = ig.entity.directThread(threadData.thread_id);
        
        // Get thread items
        const threadFeed = ig.feed.directThread({ thread_id: threadData.thread_id });
        const items = await threadFeed.items();
        
        // Process new messages
        for (const item of items.slice(0, 10)) {
          if (item.item_type === 'text') {
            await processMessage(item, thread);
          }
        }
        
        // Check seen users
        await checkSeenUsers(thread, threadData.users);
        
        // Store for hourly leaderboard
        if (!targetThreadId) {
          targetThreadId = threadData.thread_id;
        }
      }
    }
    
  } catch (error) {
    addLog('error', `Bot loop error: ${error.message}`);
    botState.lastError = error.message;
  }
};

// API Routes
app.get('/', (req, res) => {
  res.send('IG Bot Running');
});

app.get('/status', (req, res) => {
  res.json({
    running: botState.running,
    connected: botState.connected,
    user: botState.loggedInUser ? {
      username: botState.loggedInUser.username,
      pk: botState.loggedInUser.pk
    } : null,
    startTime: botState.startTime,
    lastError: botState.lastError,
    uptime: botState.startTime ? Math.floor((Date.now() - botState.startTime) / 1000) : 0
  });
});

app.post('/login', async (req, res) => {
  try {
    const { session, username, password } = req.body;
    
    addLog('info', 'Login attempt started');
    
    if (session) {
      // Login with session
      try {
        const sessionData = JSON.parse(Buffer.from(session, 'base64').toString());
        await ig.state.deserialize(sessionData);
        
        // Verify session
        const user = await ig.account.currentUser();
        botState.loggedInUser = user;
        botState.connected = true;
        
        addLog('success', `Logged in as ${user.username} using session`);
        
        res.json({ 
          success: true, 
          message: `Logged in as ${user.username}`,
          user: { username: user.username, pk: user.pk }
        });
      } catch (sessionError) {
        throw new Error('Invalid session. Please get a new session ID.');
      }
    } else if (username && password) {
      // Login with credentials
      ig.state.generateDevice(username);
      
      await ig.simulate.preLoginFlow();
      const auth = await ig.account.login(username, password);
      
      // Save session for future use
      const serialized = await ig.state.serialize();
      delete serialized.constants;
      const sessionString = Buffer.from(JSON.stringify(serialized)).toString('base64');
      
      botState.loggedInUser = auth;
      botState.connected = true;
      
      addLog('success', `Logged in as ${auth.username}`);
      
      res.json({ 
        success: true, 
        message: `Logged in as ${auth.username}`,
        user: { username: auth.username, pk: auth.pk },
        session: sessionString
      });
    } else {
      throw new Error('Please provide session or username/password');
    }
    
  } catch (error) {
    addLog('error', `Login failed: ${error.message}`);
    botState.lastError = error.message;
    res.status(400).json({ 
      success: false, 
      error: error.message 
    });
  }
});

app.post('/start', async (req, res) => {
  try {
    if (!botState.connected) {
      throw new Error('Not connected to Instagram. Please login first.');
    }
    
    if (botState.running) {
      return res.json({ success: true, message: 'Bot is already running' });
    }
    
    botState.running = true;
    botState.startTime = Date.now();
    botState.lastError = null;
    
    const settings = readJSON(SETTINGS_FILE) || {};
    const pollInterval = settings.pollInterval || 5000;
    
    // Start bot loop
    botInterval = setInterval(runBotLoop, pollInterval);
    
    // Start hourly leaderboard
    hourlyLeaderboardInterval = setInterval(async () => {
      if (targetThreadId && botState.running) {
        const thread = ig.entity.directThread(targetThreadId);
        await hourlyLeaderboard(thread);
      }
    }, 60 * 60 * 1000); // Every hour
    
    addLog('success', 'Bot started');
    
    res.json({ success: true, message: 'Bot started successfully' });
    
  } catch (error) {
    addLog('error', `Failed to start bot: ${error.message}`);
    res.status(400).json({ success: false, error: error.message });
  }
});

app.post('/stop', (req, res) => {
  try {
    if (!botState.running) {
      return res.json({ success: true, message: 'Bot is already stopped' });
    }
    
    botState.running = false;
    
    if (botInterval) {
      clearInterval(botInterval);
      botInterval = null;
    }
    
    if (hourlyLeaderboardInterval) {
      clearInterval(hourlyLeaderboardInterval);
      hourlyLeaderboardInterval = null;
    }
    
    addLog('info', 'Bot stopped');
    
    res.json({ success: true, message: 'Bot stopped successfully' });
    
  } catch (error) {
    addLog('error', `Failed to stop bot: ${error.message}`);
    res.status(400).json({ success: false, error: error.message });
  }
});

app.get('/logs', (req, res) => {
  const logs = readJSON(LOGS_FILE) || { logs: [] };
  const limit = parseInt(req.query.limit) || 100;
  const type = req.query.type;
  
  let filteredLogs = logs.logs;
  if (type) {
    filteredLogs = filteredLogs.filter(l => l.type === type);
  }
  
  res.json({ logs: filteredLogs.slice(0, limit) });
});

app.get('/users', (req, res) => {
  const usersData = readJSON(USERS_FILE) || { users: {} };
  const users = Object.entries(usersData.users)
    .map(([id, data]) => ({ id, ...data }))
    .sort((a, b) => b.messageCount - a.messageCount);
  
  res.json({ users });
});

app.get('/leaderboard', (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  const topUsers = getTopUsers(limit);
  res.json({ leaderboard: topUsers });
});

app.get('/settings', (req, res) => {
  const settings = readJSON(SETTINGS_FILE) || {};
  res.json(settings);
});

app.post('/settings', (req, res) => {
  try {
    const currentSettings = readJSON(SETTINGS_FILE) || {};
    const newSettings = { ...currentSettings, ...req.body };
    writeJSON(SETTINGS_FILE, newSettings);
    addLog('info', 'Settings updated');
    res.json({ success: true, settings: newSettings });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

app.get('/messages', (req, res) => {
  const messages = readJSON(MESSAGES_FILE) || {};
  res.json(messages);
});

app.post('/messages', (req, res) => {
  try {
    const currentMessages = readJSON(MESSAGES_FILE) || {};
    const newMessages = { ...currentMessages, ...req.body };
    writeJSON(MESSAGES_FILE, newMessages);
    addLog('info', 'Message templates updated');
    res.json({ success: true, messages: newMessages });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

app.get('/stats', (req, res) => {
  const usersData = readJSON(USERS_FILE) || { users: {} };
  const logs = readJSON(LOGS_FILE) || { logs: [] };
  
  const totalUsers = Object.keys(usersData.users).length;
  const totalMessages = Object.values(usersData.users).reduce((sum, u) => sum + u.messageCount, 0);
  const totalLogs = logs.logs.length;
  const errorCount = logs.logs.filter(l => l.type === 'error').length;
  
  res.json({
    totalUsers,
    totalMessages,
    totalLogs,
    errorCount,
    botUptime: botState.startTime ? Math.floor((Date.now() - botState.startTime) / 1000) : 0,
    isRunning: botState.running,
    isConnected: botState.connected
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  addLog('error', `Server error: ${err.message}`);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Instagram Bot Server running on port ${PORT}`);
  addLog('info', `Server started on port ${PORT}`);
});
