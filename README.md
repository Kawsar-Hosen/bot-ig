# 🤖 Instagram Group Chat Bot

A powerful, feature-rich Node.js bot for Instagram group chats with real-time message handling, moderation, leaderboards, and smart interactions.

## ✨ Features

### Core Features
- ✅ **Session-based Login** - Use SESSION_ID for secure authentication
- 👋 **Welcome System** - Auto welcome messages with custom formatting for new members
- 📊 **Activity Tracking** - Track message count per user with leaderboards
- 👑 **Admin System** - Role-based permissions for moderation commands
- 🚫 **Moderation** - Kick users, manage group settings
- 💬 **Smart Replies** - Auto-reply to greetings in Bangla/English
- 📱 **Real-time Polling** - Fast message detection (3-5 second intervals)
- 🎯 **Leaderboard System** - Weekly top chatters with rankings
- 📣 **Auto Announcements** - Motivational messages and top user announcements every 2 hours
- 🔔 **Activity Monitoring** - Track seen but inactive users
- ⚡ **Performance Optimized** - Efficient polling, duplicate prevention, rate limiting

### Commands
```
/rules           - Display group rules
/leaderboard     - Show top 10 active users
/stats           - View your personal stats
/kick @username  - Remove user (admin only)
/addadmin @user  - Add new admin (owner only)
```

## 🚀 Installation

### Prerequisites
- Node.js 14+ 
- npm or yarn
- Instagram account with active session

### Step 1: Clone/Download Project
```bash
cd your-project-directory
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Get SESSION_ID

**Method 1: Browser DevTools**
1. Open Instagram web (instagram.com)
2. Log in to your account
3. Press `F12` to open DevTools
4. Go to **Application** → **Cookies** → **instagram.com**
5. Find the `sessionid` cookie
6. Copy its value

**Method 2: Using Chrome Inspector**
```javascript
// Run this in browser console at instagram.com
document.cookie
```

### Step 4: Setup Environment Variables
```bash
cp .env.example .env
```

Edit `.env` file:
```env
SESSION_ID=your_copied_sessionid_here
ADMIN_USERNAMES=admin1,admin2
OWNER_USERNAME=your_username
POLLING_INTERVAL=3000
AUTO_ANNOUNCEMENT_INTERVAL=7200000
```

### Step 5: Run the Bot
```bash
npm start
```

You should see:
```
🔐 Attempting login with SESSION_ID...
✅ Successfully logged in as @your_username
👂 Listening for messages...
```

## 📖 Configuration Guide

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `SESSION_ID` | Instagram session ID (required) | - |
| `ADMIN_USERNAMES` | Comma-separated admin usernames | - |
| `OWNER_USERNAME` | Bot owner username | owner |
| `POLLING_INTERVAL` | Message check interval (ms) | 3000 |
| `AUTO_ANNOUNCEMENT_INTERVAL` | Announcement interval (ms) | 7200000 |
| `SALAM_REPLY` | Auto-reply for greetings | Bangla message |
| `PROXY_URL` | Optional proxy URL | null |
| `LOG_LEVEL` | Logging level | info |

## 💡 Usage Examples

### Welcome New Member
Bot automatically detects new members and sends welcome message:
```
🌙✨ 𓆩 𝐀𝐬𝐬𝐚𝐥𝐚𝐦𝐮 𝐖𝐚𝐥𝐚𝐢𝐤𝐮𝐦 𓆪 🌌🪄
𝐌𝐞𝐦𝐛𝐞𝐫𝐬 : @username
...
```

### Check Leaderboard
```
User: /leaderboard
Bot: 🏆 সাপ্তাহিক লিডারবোর্ড 🏆
     🥇 1. User #12345
        💬 45 মেসেজ
     🥈 2. User #67890
        💬 38 মেসেজ
     ...
```

### View Your Stats
```
User: /stats
Bot: 📊 Your Stats:
     💬 Messages: 15
     📱 Last Active: 3/26/2025, 2:30:45 PM
```

### Kick a User (Admin)
```
Admin: /kick @spammer
Bot: 👋 @spammer has been removed from the group
```

### Display Rules
```
User: /rules
Bot: [Full rules message displayed]
```

## 🔧 Advanced Features

### Tracking System
The bot tracks:
- **Message Count** - Total messages per user
- **Last Activity** - Timestamp of last message
- **Active Period** - When user is most active
- **Seen Status** - Detects read receipts

### Moderation Features
- **User Removal** - Admin can kick users
- **Auto Moderation** - Detect spam patterns
- **Admin Management** - Add/remove admins dynamically
- **Audit Logs** - Track all admin actions

### Intelligence Features
- **Bangla Support** - Native Bangla messages
- **Smart Replies** - Context-aware responses
- **Greeting Detection** - Auto-reply to greetings
- **Activity Analysis** - Identify inactive members

## 📊 Leaderboard System

Updates weekly with:
- Top 10 most active users
- Message count rankings
- Emoji rankings (🥇🥈🥉)
- Motivational messages

Weekly announcement includes:
```
🏆 আমাদের সবচেয়ে সক্রিয় সদস্য: @topuser
💬 মেসেজ: 150
👍 চমৎকার কাজ! আরও মেসেজ পাঠান এবং সক্রিয় থাকুন! 🎉
```

## ⚠️ Troubleshooting

### Issue: "SESSION_ID not found"
**Solution:** Make sure you added SESSION_ID to `.env` file correctly

### Issue: "Login failed"
**Causes:**
- Invalid SESSION_ID
- Session expired
- Bot already running with same account
- Instagram temporarily blocked login

**Solutions:**
1. Get fresh SESSION_ID
2. Try logging in from incognito window
3. Wait 24 hours if rate limited
4. Check IP address (may need to whitelist)

### Issue: "Throttled" errors
**Cause:** Too many requests too quickly

**Solution:** Increase `POLLING_INTERVAL` in `.env`:
```env
POLLING_INTERVAL=5000  # Changed from 3000
```

### Issue: Bot not responding to messages
**Check:**
1. Is bot actually running? (Check console)
2. Is SESSION_ID valid? (Try logging in manually)
3. Are there any error messages in console?
4. Is polling interval too high?

### Issue: Welcome message not sending
**Check:**
1. New member detection might be delayed
2. Instagram API rate limits
3. Check console for error messages

## 🔐 Security Tips

1. **Never share SESSION_ID** - Keep it secret like a password
2. **Use .env file** - Never hardcode credentials
3. **Add to .gitignore** - Keep `.env` out of version control
4. **Rotate SESSION_ID** - Change it monthly if possible
5. **Use Proxy** - For extra privacy, use a proxy server
6. **Verify Admins** - Only add trusted users as admins

## 📈 Performance Tips

1. **Adjust Polling Interval**
   ```env
   # Less responsive but lower resource
   POLLING_INTERVAL=5000
   
   # More responsive but higher resource
   POLLING_INTERVAL=2000
   ```

2. **Reduce Memory Usage**
   - Clear old processed messages (every 1000)
   - Limit leaderboard cache size

3. **Handle Rate Limiting**
   - Use proxy for multiple bots
   - Space out announcements
   - Increase delays between commands

## 🛠️ File Structure

```
instagram-group-chat-bot/
├── bot.js              # Main bot logic
├── config.js           # Configuration
├── messages.js         # Message templates
├── utils.js            # Utility functions
├── package.json        # Dependencies
├── .env.example        # Environment template
├── .env                # Actual credentials (not in git)
└── README.md          # This file
```

## 📝 Message Templates

All messages are customizable in `messages.js`:
- Welcome message
- Leave message
- Rules message
- Congratulation message
- Motivational message
- Leaderboard format

## 🔄 Auto Announcements

Bot automatically announces every 2 hours:
```
🏆 সাপ্তাহিক লিডারবোর্ড 🏆
🥇 1. @topuser - 150 মেসেজ
🥈 2. @user2 - 120 মেসেজ
...
```

Customize interval in `.env`:
```env
# Every 1 hour
AUTO_ANNOUNCEMENT_INTERVAL=3600000

# Every 30 minutes
AUTO_ANNOUNCEMENT_INTERVAL=1800000
```

## 🎯 Best Practices

1. **Test before deploying** - Run in a test group first
2. **Monitor logs** - Check console for errors
3. **Update regularly** - Keep dependencies updated
4. **Backup session** - Save SESSION_ID securely
5. **Use production server** - Run on VPS/Cloud not local machine
6. **Monitor rate limits** - Space out bulk operations
7. **Maintain admin list** - Remove inactive admins
8. **Announce rules** - Use /rules regularly

## 🚀 Deployment

### Using Node.js hosting (Heroku, Railway, etc.)

1. Push code to GitHub
2. Connect repository to hosting platform
3. Add environment variables
4. Deploy

### Using VPS (Digital Ocean, AWS, etc.)

```bash
# SSH into server
ssh user@your-server

# Clone repository
git clone your-repo

# Install Node.js and npm
sudo apt update
sudo apt install nodejs npm

# Install dependencies
npm install

# Create .env file
nano .env

# Use PM2 for continuous running
npm install -g pm2
pm2 start bot.js --name instagram-bot
pm2 startup
pm2 save
```

## 📞 Support

For issues or questions:
1. Check troubleshooting section
2. Review error messages in console
3. Check Instagram API status
4. Verify SESSION_ID is current

## 📄 License

MIT License - Free to use and modify

## ⭐ Features Checklist

- [x] Session-based login
- [x] Welcome new members
- [x] Message tracking
- [x] Leaderboard system
- [x] Admin system
- [x] Moderation commands
- [x] Auto announcements
- [x] Smart replies
- [x] Bangla support
- [x] Error handling
- [x] Rate limiting
- [x] Performance optimization

## 🎉 Final Notes

This bot is designed to enhance group chat experience with automation and engagement tracking. Always respect Instagram's terms of service and use responsibly.

Happy botting! 🚀✨
