# 🚀 Quick Start Guide - 5 Minutes Setup

## Step 1: Get Your SESSION_ID (2 minutes)

### On Desktop:
1. Open Instagram.com in your browser
2. Log in with your account
3. Press **F12** (or Ctrl+Shift+I on Linux)
4. Click **Application** tab
5. Expand **Cookies** → **instagram.com**
6. Find **sessionid** cookie
7. Copy the **Value** (starts with a long string)

**Example:**
```
sessionid = "1234567:ABCDEF..."
```

### On Mobile:
Unfortunately, you need a computer for this step.

---

## Step 2: Setup Bot (2 minutes)

### Option A: Quick Setup (Recommended)
```bash
# 1. Extract bot files
unzip instagram-group-chat-bot.zip
cd instagram-group-chat-bot

# 2. Install dependencies
npm install

# 3. Create .env file
cp .env.example .env

# 4. Edit .env (paste your SESSION_ID)
# On Windows: Open .env with Notepad
# On Mac/Linux: nano .env
#
# Replace: SESSION_ID=your_session_id_here
# With your actual sessionid from step 1

# 5. Run bot
npm start
```

### Option B: Manual Setup
1. Create folder: `instagram-bot`
2. Extract all files here
3. Open terminal in this folder
4. Run: `npm install`
5. Open `.env` file and add SESSION_ID
6. Run: `npm start`

---

## Step 3: Verify Bot is Running (1 minute)

You should see:
```
🔐 Attempting login with SESSION_ID...
✅ Successfully logged in as @your_username
👂 Listening for messages...
```

**If you see this, your bot is working! ✅**

---

## First Time Tests

### Test 1: New Member Welcome
- Add a test account to the group
- Bot automatically sends welcome message

### Test 2: Try Commands
In the group chat, type:
```
/rules
/leaderboard
/stats
```

### Test 3: Auto Reply
In the group chat, type:
```
assalam
```
Bot will auto reply!

---

## Common Issues & Quick Fixes

### Issue: "SESSION_ID not found"
**Fix:** Make sure you added SESSION_ID to `.env` file correctly (no quotes needed)

### Issue: "Login failed"
**Fix:** 
1. Get a fresh SESSION_ID
2. Make sure bot is not already running
3. Try logging in manually first

### Issue: "npm command not found"
**Fix:**
- Install Node.js from nodejs.org
- Restart your terminal

### Issue: Bot can't find messages
**Fix:**
1. Make sure bot is in the group
2. Wait 10 seconds for message polling to start
3. Try sending a test message

---

## Keep Bot Running 24/7

### Option 1: Using PM2 (Recommended)
```bash
# Install PM2
npm install -g pm2

# Start bot with PM2
pm2 start bot.js --name instagram-bot

# Auto-start on reboot
pm2 startup
pm2 save

# Check status
pm2 status
```

### Option 2: Using Screen (Linux/Mac)
```bash
# Start bot in background
screen -S bot
npm start

# Detach (Ctrl+A then D)
# Reattach later with: screen -r bot
```

### Option 3: Cloud VPS (Digital Ocean, AWS, etc.)
```bash
# SSH into server
ssh user@your-server

# Clone and setup
git clone your-repo
cd instagram-bot
npm install
pm2 start bot.js
```

---

## Configuration Quick Reference

### Essential Settings
```env
# Must have
SESSION_ID=your_sessionid

# Nice to have
ADMIN_USERNAMES=admin1,admin2
OWNER_USERNAME=your_username
```

### Customize Replies
Edit `messages.js` to change:
- Welcome message
- Rules text
- Bangla replies
- Announcements

### Adjust Performance
```env
# Check for messages more often (faster response)
POLLING_INTERVAL=2000

# Check less often (lower resource usage)
POLLING_INTERVAL=5000

# Auto announce every 1 hour instead of 2
AUTO_ANNOUNCEMENT_INTERVAL=3600000
```

---

## Useful Commands

### Check Bot Status
```bash
pm2 status
```

### View Logs
```bash
npm start

# Or with PM2
pm2 logs instagram-bot
```

### Stop Bot
```bash
Ctrl+C (if running directly)

# Or with PM2
pm2 stop instagram-bot
```

### Restart Bot
```bash
pm2 restart instagram-bot
```

### Uninstall
```bash
rm -rf instagram-bot
```

---

## Next Steps

1. ✅ Bot is running
2. ✅ Test it in a group
3. ⭐ Set admins: `ADMIN_USERNAMES=`
4. 📝 Customize messages: Edit `messages.js`
5. 🔐 Keep SESSION_ID secret
6. 📊 Monitor with `pm2 status`

---

## Support

### If Something Breaks:
1. Check error message in console
2. Restart bot: `npm start`
3. Check .env file is correct
4. Get fresh SESSION_ID
5. Check README.md for full documentation

### Useful Files:
- **bot.js** - Main bot logic
- **config.js** - Settings
- **messages.js** - Customize messages
- **README.md** - Full documentation

---

## Security Reminder ⚠️

- 🔒 Never share SESSION_ID
- 🔒 Keep .env file safe
- 🔒 Don't commit .env to GitHub
- 🔒 Use strong passwords
- 🔒 Change SESSION_ID monthly

---

## Done! 🎉

Your Instagram bot is now running!

Questions? Check **README.md** for full documentation.

Happy botting! 🚀✨
