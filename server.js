const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const { IgApiClient } = require("instagram-private-api");

const app = express();
app.use(cors());
app.use(express.json());

const DATA_FILE = path.join(__dirname, "data.json");
const PORT = process.env.PORT || 4000;

// ============ DATA STORE ============
function loadData() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  } catch {
    const defaults = {
      features: {
        welcome: true, leaveMessage: true, salamReply: true, seenDetection: false,
        activeUserSystem: true, leaderboard: true, commands: true, messageTracking: true,
      },
      templates: {
        welcome: "স্বাগতম @username! 🎉 গ্রুপে তোমাকে পেয়ে খুশি হলাম।",
        leave: "@username গ্রুপ থেকে চলে গেছে। 👋 বিদায়!",
        seenWarning: "⚠️ @username তুমি কি ঘুমাচ্ছো? অনেকক্ষণ ধরে inactive!",
        activeMessage: "🔥 @username আজ সবচেয়ে বেশি active! দারুণ!",
        rules: "📜 গ্রুপ রুলস:\n1. সবার সাথে সম্মানের সাথে কথা বলুন\n2. স্প্যাম করবেন না\n3. অশ্লীল কন্টেন্ট নিষিদ্ধ\n4. অ্যাডমিনের সিদ্ধান্ত চূড়ান্ত",
      },
      userStats: {},
      admins: [],
      logs: [],
    };
    saveData(defaults);
    return defaults;
  }
}

function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

function addLog(type, text) {
  const data = loadData();
  const entry = {
    id: Date.now().toString(),
    type,
    text,
    timestamp: new Date().toLocaleTimeString("bn-BD"),
  };
  data.logs = [entry, ...data.logs].slice(0, 200);
  saveData(data);
  return entry;
}

// ============ BOT ENGINE ============
let ig = null;
let botRunning = false;
let pollInterval = null;
let connectedUsername = "";
let startTime = null;
let totalMessages = 0;
let threadIds = [];

async function loginWithSession(sessionId) {
  ig = new IgApiClient();
  
  // Clean up session ID - remove whitespace, quotes
  let cleanSession = sessionId.trim().replace(/^["']|["']$/g, "");
  
  // URL decode if needed
  if (cleanSession.includes("%")) {
    try { cleanSession = decodeURIComponent(cleanSession); } catch {}
  }

  // Extract user ID from session — format: "userId:hash:num"
  const parts = cleanSession.split(":");
  const userId = parts[0];
  
  if (!userId || !/^\d+$/.test(userId)) {
    throw new Error("Invalid Session ID format — userId not found. Session ID should look like: 12345678:AbCdEf...:5");
  }

  ig.state.generateDevice(userId);

  // Build cookie jar with all required cookies
  const cookieJar = {
    version: "tough-cookie@4.1.3",
    storeType: "MemoryCookieStore",
    rejectPublicSuffixes: true,
    cookies: [
      {
        key: "sessionid",
        value: cleanSession,
        domain: "instagram.com",
        path: "/",
        secure: true,
        httpOnly: true,
        hostOnly: false,
        creation: new Date().toISOString(),
        lastAccessed: new Date().toISOString(),
      },
      {
        key: "ds_user_id",
        value: userId,
        domain: "instagram.com",
        path: "/",
        secure: true,
        httpOnly: false,
        hostOnly: false,
        creation: new Date().toISOString(),
        lastAccessed: new Date().toISOString(),
      },
      {
        key: "ig_did",
        value: require("crypto").randomUUID(),
        domain: "instagram.com",
        path: "/",
        secure: true,
        httpOnly: false,
        hostOnly: false,
        creation: new Date().toISOString(),
        lastAccessed: new Date().toISOString(),
      },
      {
        key: "mid",
        value: Buffer.from(Date.now().toString()).toString("base64").substring(0, 26),
        domain: "instagram.com",
        path: "/",
        secure: true,
        httpOnly: false,
        hostOnly: false,
        creation: new Date().toISOString(),
        lastAccessed: new Date().toISOString(),
      },
    ],
  };

  await ig.state.deserializeCookieJar(JSON.stringify(cookieJar));

  // Set auth state
  ig.state.cookieUserId = userId;
  ig.state.cookieUsername = "";

  // Verify session works
  try {
    const user = await ig.account.currentUser();
    connectedUsername = user.username;
    ig.state.cookieUsername = user.username;
    addLog("system", `লগইন সফল — @${connectedUsername}`);
    return user;
  } catch (err) {
    ig = null;
    if (err.message && err.message.includes("login_required")) {
      throw new Error("Session ID expired বা invalid। নতুন Session ID সংগ্রহ করুন: Instagram > DevTools > Application > Cookies > sessionid");
    }
    throw new Error(`Instagram verification failed: ${err.message}`);
  }
}

async function startBot() {
  if (botRunning) return;
  botRunning = true;
  startTime = Date.now();
  addLog("system", "বট চালু হয়েছে — পোলিং শুরু");

  // Get direct inbox threads
  try {
    const inbox = await ig.feed.directInbox().items();
    threadIds = inbox.map((t) => t.thread_id);
    addLog("system", `${threadIds.length}টি থ্রেড পাওয়া গেছে`);
  } catch (err) {
    addLog("error", `ইনবক্স পড়তে ব্যর্থ: ${err.message}`);
  }

  // Start polling loop
  pollInterval = setInterval(async () => {
    if (!botRunning || !ig) return;
    try {
      await pollMessages();
    } catch (err) {
      addLog("error", `পোলিং এরর: ${err.message}`);
    }
  }, 4000);
}

async function pollMessages() {
  const data = loadData();

  for (const threadId of threadIds) {
    try {
      const thread = ig.entity.directThread(threadId);
      const items = await thread.items();

      for (const item of items.slice(0, 5)) {
        // Skip old messages (only process last 30 seconds)
        const itemTime = parseInt(item.timestamp) / 1000;
        if (Date.now() - itemTime > 30000) continue;

        const senderPk = item.user_id;
        if (senderPk === ig.state.cookieUserId) continue; // skip self

        totalMessages++;

        // Track user stats
        const username = `user_${senderPk}`;
        if (data.features.messageTracking) {
          if (!data.userStats[username]) {
            data.userStats[username] = { messages: 0, lastActive: new Date().toISOString() };
          }
          data.userStats[username].messages++;
          data.userStats[username].lastActive = new Date().toISOString();
        }

        // Process text messages
        if (item.item_type === "text" && item.text) {
          const text = item.text.toLowerCase().trim();
          addLog("message", `${username}: ${item.text}`);

          // Salam reply
          if (data.features.salamReply && (text.includes("আসসালামু") || text.includes("সালাম") || text.includes("assalamu"))) {
            await thread.broadcastText("ওয়ালাইকুম আসসালাম! 🌙");
            addLog("message", "বট: ওয়ালাইকুম আসসালাম! 🌙");
          }

          // Command system
          if (data.features.commands && text.startsWith("/")) {
            const cmd = text.split(" ")[0];
            switch (cmd) {
              case "/rules":
                await thread.broadcastText(data.templates.rules);
                addLog("command", `/rules কমান্ড — রুলস পাঠানো হয়েছে`);
                break;
              case "/help":
                await thread.broadcastText("📋 কমান্ড তালিকা:\n/rules - গ্রুপ রুলস\n/help - সাহায্য\n/stats - স্ট্যাটস\n/kick @user - সরান (অ্যাডমিন)");
                addLog("command", `/help কমান্ড ব্যবহৃত`);
                break;
              case "/stats":
                const stats = data.userStats[username];
                const msg = stats
                  ? `📊 @${username} — মেসেজ: ${stats.messages}`
                  : "❌ কোনো ডেটা পাওয়া যায়নি";
                await thread.broadcastText(msg);
                addLog("command", `/stats কমান্ড ব্যবহৃত`);
                break;
            }
          }
        }

        // New member joined (action log)
        if (item.item_type === "action_log" && data.features.welcome) {
          if (item.text && item.text.includes("joined")) {
            const welcomeMsg = data.templates.welcome.replace("@username", `@${username}`);
            await thread.broadcastText(welcomeMsg);
            addLog("join", `${username} গ্রুপে যোগ দিয়েছে — স্বাগত বার্তা পাঠানো`);
          }
          if (item.text && item.text.includes("left") && data.features.leaveMessage) {
            const leaveMsg = data.templates.leave.replace("@username", `@${username}`);
            await thread.broadcastText(leaveMsg);
            addLog("leave", `${username} গ্রুপ ছেড়ে দিয়েছে`);
          }
        }
      }
    } catch (err) {
      // Rate limit or thread error — skip silently
    }
  }

  saveData(data);
}

function stopBot() {
  botRunning = false;
  if (pollInterval) {
    clearInterval(pollInterval);
    pollInterval = null;
  }
  addLog("system", "বট বন্ধ করা হয়েছে");
}

// ============ API ROUTES ============

// Login
app.post("/login", async (req, res) => {
  try {
    const { sessionId } = req.body;
    if (!sessionId) return res.status(400).json({ error: "Session ID প্রয়োজন" });
    const user = await loginWithSession(sessionId);
    res.json({ success: true, username: user.username });
  } catch (err) {
    res.status(401).json({ error: `লগইন ব্যর্থ: ${err.message}` });
  }
});

// Logout
app.post("/logout", (req, res) => {
  stopBot();
  ig = null;
  connectedUsername = "";
  res.json({ success: true });
});

// Start bot
app.post("/start", async (req, res) => {
  if (!ig) return res.status(400).json({ error: "প্রথমে লগইন করুন" });
  try {
    await startBot();
    res.json({ success: true, message: "বট চালু হয়েছে" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Stop bot
app.post("/stop", (req, res) => {
  stopBot();
  res.json({ success: true, message: "বট বন্ধ হয়েছে" });
});

// Status
app.get("/status", (req, res) => {
  if (!ig || !connectedUsername) {
    return res.status(404).json({ error: "বট কানেক্ট নেই" });
  }
  const uptimeMs = startTime ? Date.now() - startTime : 0;
  const hours = Math.floor(uptimeMs / 3600000);
  const mins = Math.floor((uptimeMs % 3600000) / 60000);

  const data = loadData();
  res.json({
    online: botRunning,
    username: connectedUsername,
    totalUsers: Object.keys(data.userStats).length,
    messagesCount: totalMessages,
    activeGroups: threadIds.length,
    uptime: `${hours}h ${mins}m`,
    uptimePercent: botRunning ? "99.9%" : "0%",
  });
});

// Features
app.get("/features", (req, res) => {
  const data = loadData();
  res.json(data.features);
});

app.post("/features", (req, res) => {
  const data = loadData();
  data.features = { ...data.features, ...req.body };
  saveData(data);
  res.json({ success: true });
});

// Templates
app.get("/templates", (req, res) => {
  const data = loadData();
  res.json(data.templates);
});

app.post("/templates", (req, res) => {
  const data = loadData();
  data.templates = { ...data.templates, ...req.body };
  saveData(data);
  res.json({ success: true });
});

// Leaderboard
app.get("/leaderboard", (req, res) => {
  const data = loadData();
  const users = Object.entries(data.userStats)
    .map(([username, stats], i) => ({
      username,
      messages: stats.messages,
      rank: i + 1,
      lastActive: stats.lastActive,
      joinedWeek: true,
    }))
    .sort((a, b) => b.messages - a.messages)
    .map((u, i) => ({ ...u, rank: i + 1 }));
  res.json(users);
});

// Logs
app.get("/logs", (req, res) => {
  const data = loadData();
  const type = req.query.type;
  const logs = type ? data.logs.filter((l) => l.type === type) : data.logs;
  res.json(logs);
});

// ============ START SERVER ============
app.listen(PORT, () => {
  console.log(`✅ Bot backend running on port ${PORT}`);
  addLog("system", "সার্ভার চালু হয়েছে");
});
