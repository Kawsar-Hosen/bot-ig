# Instagram Group Chat Bot - Backend

## Render-এ ডিপ্লয় করুন

### ১. GitHub-এ Push করুন
`backend/` ফোল্ডারটি আলাদা repo-তে পুশ করুন।

### ২. Render-এ নতুন Web Service তৈরি করুন
- **Build Command:** `npm install`
- **Start Command:** `npm start`
- **Environment:** Node

### ৩. Environment Variable (ঐচ্ছিক)
- `PORT` — Render স্বয়ংক্রিয়ভাবে সেট করে

### ৪. ফ্রন্টএন্ড কানেক্ট করুন
Lovable প্রজেক্টে `.env` অথবা `VITE_API_URL` সেট করুন:
```
VITE_API_URL=https://your-app-name.onrender.com
```

## API Endpoints

| Method | Path | বিবরণ |
|--------|------|-------|
| POST | /login | Session ID দিয়ে লগইন |
| POST | /logout | লগআউট |
| POST | /start | বট চালু |
| POST | /stop | বট বন্ধ |
| GET | /status | বটের বর্তমান স্ট্যাটাস |
| GET | /features | ফিচার সেটিংস |
| POST | /features | ফিচার আপডেট |
| GET | /templates | মেসেজ টেমপ্লেট |
| POST | /templates | টেমপ্লেট আপডেট |
| GET | /leaderboard | লিডারবোর্ড |
| GET | /logs | লগস (?type=filter) |
