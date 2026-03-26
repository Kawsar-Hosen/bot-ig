# 📖 Complete Setup & Usage Guide

## Project Structure

```
instagram-group-chat-bot/
├── bot.js                    # Basic bot (2KB) - Use for simple groups
├── advanced-bot.js          # Advanced bot (10KB) - Use for production
├── config.js                # Configuration loader
├── messages.js              # Message templates
├── utils.js                 # Utility functions
├── sessionManager.js        # Session persistence
├── errorHandler.js          # Error handling & recovery
├── databaseManager.js       # Data storage
├── package.json             # Dependencies
├── .env.example            # Environment template
├── .env                    # Your configuration (NEVER commit)
├── .gitignore              # Git ignore rules
├── README.md               # Full documentation
├── QUICKSTART.md           # 5-minute setup guide
├── sessions/               # Session storage (auto-created)
├── data/                   # Database storage (auto-created)
└── logs/                   # Log files (auto-created)
```

## File Explanations

### Core Files

#### `bot.js` - Basic Bot
- **Size**: ~2KB (only essential features)
- **Use When**: Testing, simple groups, low resource
- **Start With**: `npm start`
- **Features**: Message handling, basic commands, polling
- **Best For**: Getting started quickly

#### `advanced-bot.js` - Production Bot
- **Size**: ~10KB (all features)
- **Use When**: Production, large groups, need reliability
- **Start With**: `node advanced-bot.js`
- **Features**: Everything + session management, database, error recovery
- **Best For**: Long-term deployment

### Configuration

#### `config.js`
Loads environment variables and provides defaults.

**What it does:**
- Reads `.env` file
- Provides default values
- Validates required settings

**Edit this if you want:**
- Default polling interval
- Default announcement timing
- Environment-specific settings

#### `.env`
Your secret credentials (NEVER commit to GitHub)

**Required**:
```env
SESSION_ID=your_sessionid
```

**Optional**:
```env
ADMIN_USERNAMES=user1,user2
OWNER_USERNAME=you
POLLING_INTERVAL=3000
```

### Features

#### `messages.js`
All bot messages and templates

**Includes**:
- Welcome message (customizable with username)
- Leave message
- Rules (exact format as required)
- Congratulation messages
- Bangla motivational messages
- Leaderboard format

**How to customize**:
```javascript
// Edit messages.js
const WELCOME_MESSAGE = (username) => `Your custom welcome for @${username}`;
```

#### `utils.js`
Helper functions used throughout

**Includes**:
- `sleep()` - Wait for milliseconds
- `getCurrentTime()` - Get formatted time
- `formatWelcomeMessage()` - Format welcome with username
- `formatLeaderboardMessage()` - Create leaderboard display
- `sanitizeMessage()` - Clean message text
- `parseCommand()` - Parse commands from text
- More... (30+ utilities)

**Use in your code**:
```javascript
const { sleep, getCurrentTime } = require('./utils');
await sleep(1000);
console.log(getCurrentTime());
```

### Session Management

#### `sessionManager.js`
Saves and restores Instagram sessions

**Handles**:
- Session persistence to file
- Session expiration checks
- Auto-login on restart
- Session logging

**Location**: Saves to `./sessions/` folder

**Automatic**: Used by advanced-bot.js

**Manual use**:
```javascript
const SessionManager = require('./sessionManager');
const manager = new SessionManager();

// Save session
manager.saveSession(sessionData, userId);

// Load session
const session = manager.loadSession();

// Check status
manager.printSessionStatus();
```

### Error Handling

#### `errorHandler.js`
Comprehensive error handling and recovery

**Features**:
- Error logging and tracking
- Critical error detection
- Recovery suggestions
- Error statistics
- Global error handlers

**Automatic**: Used by advanced-bot.js

**Manual use**:
```javascript
const ErrorHandler = require('./errorHandler');
const handler = new ErrorHandler();

try {
  // Your code
} catch (error) {
  handler.handleError(error, 'CONTEXT_NAME');
  handler.printErrorReport();
}
```

### Database

#### `databaseManager.js`
Persistent data storage

**Stores**:
- User message counts
- Leaderboards (weekly, monthly, all-time)
- Admin lists
- Group settings
- Activity logs

**Location**: Saves to `./data/` folder

**Automatic**: Used by advanced-bot.js

**Manual use**:
```javascript
const DatabaseManager = require('./databaseManager');
const db = new DatabaseManager();

// Save user stats
db.saveUserStats(userId, { messageCount: 10 });

// Get leaderboard
const board = db.getLeaderboard('weekly');

// Backup data
db.backup();

// View stats
db.printStats();
```

## Running the Bot

### Option 1: Basic Bot (Recommended for Testing)

```bash
npm start
```

**Output**:
```
🔐 Attempting login with SESSION_ID...
✅ Successfully logged in as @your_username
👂 Listening for messages...
```

**Stop**: Press `Ctrl+C`

### Option 2: Advanced Bot (Recommended for Production)

```bash
node advanced-bot.js
```

**Output**:
```
🤖 Advanced Instagram Group Chat Bot v1.0
🚀 Starting bot...
✅ Bot fully operational
📊 Services started:
  ✓ Message polling
  ✓ Auto announcements
  ✓ Health monitoring
  ✓ Database persistence
```

**Stop**: Press `Ctrl+C`

### Option 3: Using PM2 (Always Running)

```bash
# Install PM2 globally
npm install -g pm2

# Start bot with PM2
pm2 start advanced-bot.js --name insta-bot

# Check status
pm2 status

# View logs
pm2 logs insta-bot

# Stop bot
pm2 stop insta-bot

# Restart bot
pm2 restart insta-bot

# Auto-start on reboot
pm2 startup
pm2 save
```

## Commands Reference

### User Commands

#### `/rules`
**Who**: Anyone
**Effect**: Displays group rules
```
Input:  /rules
Output: [Full rules message]
```

#### `/leaderboard`
**Who**: Anyone
**Effect**: Shows top 10 active users
```
Input:  /leaderboard
Output: 🏆 সাপ্তাহিক লিডারবোর্ড 🏆
        🥇 1. @user1 - 150 মেসেজ
        🥈 2. @user2 - 120 মেসেজ
        ...
```

#### `/stats`
**Who**: Anyone
**Effect**: Shows your personal statistics
```
Input:  /stats
Output: 📊 Your Stats:
        💬 Messages: 45
        📱 Last Active: 3/26/2025, 2:30 PM
```

#### `/info`
**Who**: Anyone (Advanced bot only)
**Effect**: Shows bot information
```
Input:  /info
Output: 🤖 Bot Information
        ⏱️  Uptime: 2h 30m
        📨 Messages: 1250
        ...
```

#### `/help`
**Who**: Anyone (Advanced bot only)
**Effect**: Shows all available commands
```
Input:  /help
Output: 📖 Available Commands:
        /rules - Show group rules
        /leaderboard - Top users
        ...
```

### Admin Commands

#### `/kick @username`
**Who**: Admins only
**Effect**: Removes user from group
```
Input:  /kick @spammer
Output: 👋 @spammer has been removed
```

**Verification**:
- Only admins in `ADMIN_USERNAMES` can use this
- Command is logged in database

### Owner Commands

#### `/addadmin @username`
**Who**: Owner only (OWNER_USERNAME)
**Effect**: Adds new admin
```
Input:  /addadmin @newadmin
Output: ✅ @newadmin is now an admin
```

## Auto Features

### Welcome New Members
**Trigger**: New member joins group
**Auto Response**: Sends beautiful welcome message with:
- Islamic greeting (Assalamu Walaaikum)
- Member mention (@username)
- Group description
- Welcome instructions
- Motivational message

**Example**:
```
🌙✨ 𓆩 𝐀𝐬𝐬𝐚𝐥𝐚𝐦𝐮 𝐖𝐚𝐥𝐚𝐢𝐤𝐮𝐦 𓆪 🌌🪄
𝐌𝐞𝐦𝐛𝐞𝐫𝐬 : @newuser
...
```

### Salam Auto-Reply
**Trigger**: Someone types "salam", "assalam", or "assalamualaikum"
**Auto Response**: Replies with Bangla greeting
**Default**: "🌙 ওয়ালাইকুম আস্সালাম! কেমন আছেন? 😊"
**Customize**: Edit `config.js` `SALAM_REPLY`

### Auto Announcements
**Trigger**: Every 2 hours (configurable)
**Auto Response**: Announces top active user
**Message**: Congratulates user and encourages activity
**Customizable**: Set `AUTO_ANNOUNCEMENT_INTERVAL` in `.env`

### Leaderboard Tracking
**Automatic**: Tracks every message
**Updates**: Every time bot runs
**Shows**: Top 10 users with message counts
**Resets**: Kept separate for weekly/monthly/all-time

## Configuration Guide

### Essential Settings

```env
# Instagram Session
SESSION_ID=your_sessionid_here

# Admin Users (comma-separated)
ADMIN_USERNAMES=user1,user2,user3

# Bot Owner (can use special commands)
OWNER_USERNAME=your_username
```

### Performance Settings

```env
# How often to check for messages (in milliseconds)
POLLING_INTERVAL=3000
# Default: 3000 (3 seconds)
# For slower response: 5000
# For faster response: 2000 (uses more resources)

# How often to announce top user (in milliseconds)
AUTO_ANNOUNCEMENT_INTERVAL=7200000
# Default: 7200000 (2 hours)
# Every 1 hour: 3600000
# Every 30 min: 1800000
```

### Message Customization

```env
# Auto-reply when someone says salam
SALAM_REPLY=🌙 ওয়ালাইকুম আস্সালাম! কেমন আছেন? 😊

# Proxy (optional, for privacy)
PROXY_URL=http://proxy.com:8080

# Logging
LOG_LEVEL=info
ENABLE_DEBUG=false
```

## Data Storage

### Session Data (`./sessions/`)
- `instagram-session.json` - Your Instagram session
- `session.log` - Session history

### Database (`./data/`)
- `user-stats.json` - User message counts and stats
- `leaderboard.json` - Weekly/monthly/all-time rankings
- `settings.json` - Admin lists and group settings
- `activity-log.json` - All bot actions logged
- `backup-*.json` - Automatic backups

### Logs
Console output shows:
- Messages received
- Commands executed
- Errors and warnings
- Bot status updates

## Troubleshooting

### Bot Won't Start

**Check**:
1. Is Node.js installed? (`node --version`)
2. Did you run `npm install`?
3. Is `.env` file present with SESSION_ID?

**Fix**:
```bash
npm install
cp .env.example .env
# Edit .env with your SESSION_ID
npm start
```

### "SESSION_ID not found" Error

**Check**:
1. Is SESSION_ID in `.env` file?
2. Is it the correct value?
3. Is `.env` file in the correct directory?

**Fix**:
1. Get fresh SESSION_ID from Instagram
2. Add it to `.env`:
   ```env
   SESSION_ID=your_actual_sessionid
   ```
3. Restart bot

### Bot Processes Messages Slowly

**Check**:
1. Is `POLLING_INTERVAL` too high?
2. Is connection slow?
3. Too many messages at once?

**Fix**:
```env
# Lower this value for faster response
POLLING_INTERVAL=2000
```

### Bot Not Detecting New Members

**Common Causes**:
1. Bot not in group
2. New members added before bot started
3. Instagram API timing issues

**Try**:
1. Make sure bot is admin in group
2. Restart bot with `npm start`
3. Add a new test member manually

### Commands Not Working

**Check**:
1. Is command spelled correctly? (/rules not /rule)
2. Are you admin for admin commands?
3. Check console for error messages

**Fix**:
1. Check spelling
2. Add username to `ADMIN_USERNAMES` in `.env`
3. Restart bot

## Monitoring & Maintenance

### View Bot Status

**Using PM2**:
```bash
pm2 status
pm2 logs insta-bot --lines 50
```

**Using Console**:
- Watch console output while bot runs
- Type `/info` to see bot stats

### Database Maintenance

**View Statistics**:
```bash
# With advanced-bot.js, it prints stats automatically
# Or use in code:
const db = require('./databaseManager');
db.printStats();
```

**Backup Data**:
```bash
# Automatic: Advanced bot backs up every hour
# Manual: Run this in code
db.backup();
```

**Clear Old Data** (if needed):
```bash
# Edit advanced-bot.js to clear old messages
# Or delete ./data/ folder to reset
```

## Best Practices

1. ✅ **Use Advanced Bot** for production
2. ✅ **Save SESSION_ID securely** - Never share it
3. ✅ **Run on cloud/VPS** - Not local computer
4. ✅ **Use PM2** for always-on operation
5. ✅ **Monitor logs** - Check console regularly
6. ✅ **Backup data** - Keep copies of database
7. ✅ **Update dependencies** - Run `npm update` monthly
8. ✅ **Rotate SESSION_ID** - Change every 3 months

## Support & Help

### For Issues:
1. Check QUICKSTART.md for fast solutions
2. Check README.md for detailed documentation
3. Check error message in console
4. Try restarting bot

### Get Logs:
```bash
# All recent messages
npm start 2>&1 | tee bot.log

# With PM2
pm2 logs insta-bot > bot.log
```

### Debug Mode:
```env
ENABLE_DEBUG=true
LOG_LEVEL=debug
```

---

**Questions?** Check the README.md file for complete documentation.

**Ready?** Follow QUICKSTART.md to get running in 5 minutes!

Happy botting! 🚀✨
