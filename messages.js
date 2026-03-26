/**
 * Welcome message for new members
 */
const WELCOME_MESSAGE = (username) => `🌙✨ 𓆩 𝐀𝐬𝐬𝐚𝐥𝐚𝐦𝐮 𝐖𝐚𝐥𝐚𝐢𝐤𝐮𝐦 𓆪 🌌🪄

𝐌𝐞𝐦𝐛𝐞𝐫𝐬 : @${username}

🌸 𝐖𝐞𝐥𝐜𝐨𝐦𝐞 𝐓𝐨 𝐎𝐮𝐫 𝐀𝐝𝐝𝐚/𝐅𝐮𝐧/𝐌𝐞𝐦𝐨𝐫𝐢𝐞𝐬 𝐅𝐚𝐦𝐢𝐥𝐲 🌸

👑 𝐌𝐮𝐠-𝐞𝐫 𝐏𝐨𝐥𝐚𝐩𝐚𝐢𝐧 ☕️✨️ – 𝐃𝐫𝐞𝐚𝐦𝐬 & 𝐕𝐢𝐛𝐞𝐬 👑

🌷 𝐈𝐧𝐭𝐫𝐨𝐝𝐮𝐜𝐞 𝐘𝐨𝐮𝐫𝐬𝐞𝐥𝐟 🌷
💫 𝐒𝐩𝐫𝐞𝐚𝐝 𝐋𝐨𝐯𝐞, 𝐌𝐚𝐠𝐢𝐜 & 𝐏𝐨𝐬𝐢𝐭𝐢𝐯𝐢𝐭𝐲 💫
✨ 𝐒𝐡𝐢𝐧𝐞 𝐁𝐫𝐢𝐠𝐡𝐭, 𝐒𝐭𝐚𝐲 𝐀𝐜𝐭𝐢𝐯𝐞, 𝐒𝐭𝐚𝐲 𝐂𝐨𝐧𝐧𝐞𝐜𝐭𝐞𝐝 ✨

🌌 𝐋𝐞𝐭'𝐬 𝐂𝐫𝐞𝐚𝐭𝐞 𝐌𝐨𝐨𝐧𝐥𝐢𝐭 𝐌𝐞𝐦𝐨𝐫𝐢𝐞𝐬 𝐓𝐨𝐠𝐞𝐭𝐡𝐞𝐫 🌙💗🫶`;

/**
 * Member leave message
 */
const LEAVE_MESSAGE = (username) =>
  `👋 @${username} আমাদের গ্রুপ ছেড়ে চলে গেছেন। তাদের মিস করব! 💔\n\n🌙 ভাল থাকবেন সবসময় 🌸`;

/**
 * Rules message - exact as provided
 */
const RULES_MESSAGE = `𝐌𝐮𝐠-𝐞𝐫 𝐏𝐨𝐥𝐚𝐩𝐚𝐢𝐧 ☕️💫

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

/**
 * Congratulation message for most active user (Bangla)
 */
const CONGRATULATION_MESSAGE = (username, count) =>
  `🏆 অভিনন্দন! @${username}!\n\n🎉 আপনি এই গ্রুপের সবচেয়ে সক্রিয় সদস্য!\n💬 আপনার মেসেজ: ${count}\n\n👏 চমৎকার! আরও মেসেজ পাঠান এবং আমাদের সাথে সংযুক্ত থাকুন! 💪💖`;

/**
 * Inactive user encouragement
 */
const INACTIVE_MESSAGE = (username) =>
  `👀 @${username}, আমরা আপনাকে মিস করছি!\n\n💬 একটু কথা বলুন না... 😊\n🌙 আমরা আপনার মতামত শুনতে আগ্রহী! ✨`;

/**
 * Motivational message (Bangla)
 */
const MOTIVATIONAL_MESSAGE = `💫 হেই সবাই! 💫\n\n🌙 আমাদের সুন্দর পরিবারে সবাইকে স্বাগতম!\n💖 একসাথে হাসি, ভাগাভাগি এবং মজা করুন।\n\n🎯 মনে রাখবেন:\n✨ প্রতিটি মুহূর্ত মূল্যবান\n💬 প্রতিটি কণ্ঠস্বর গুরুত্বপূর্ণ\n🤝 একসাথে আমরা আরও শক্তিশালী\n\n🌸 আজও সক্রিয় থাকুন এবং আনন্দ ছড়িয়ে দিন! 🌸`;

/**
 * Leaderboard header
 */
const LEADERBOARD_HEADER = `🏆 সাপ্তাহিক লিডারবোর্ড 🏆\n\n`;

/**
 * Command help message
 */
const HELP_MESSAGE = `📖 উপলব্ধ কমান্ড:\n\n
/rules - গ্রুপের নিয়মকানুন দেখান
/leaderboard - শীর্ষ চ্যাটকারীদের তালিকা
/stats - আপনার পরিসংখ্যান দেখুন
/kick @username - ব্যবহারকারী অপসারণ (শুধু অ্যাডমিন)

💡 এই কমান্ডগুলি ব্যবহার করে গ্রুপকে সংগঠিত রাখুন!`;

module.exports = {
  WELCOME_MESSAGE,
  LEAVE_MESSAGE,
  RULES_MESSAGE,
  CONGRATULATION_MESSAGE,
  INACTIVE_MESSAGE,
  MOTIVATIONAL_MESSAGE,
  LEADERBOARD_HEADER,
  HELP_MESSAGE
};
