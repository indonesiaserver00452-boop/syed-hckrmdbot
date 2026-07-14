require('dotenv').config();
require('./setting/config');
const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs').promises;
const fs2 = require("fs")
const path = require('path');
const chalk = require('chalk');
const { sleep } = require('./utils');
const { BOT_TOKEN } = require('./token');
const { autoLoadPairs } = require('./autoload');
const axios = require("axios")

const bot = new TelegramBot(BOT_TOKEN, { polling: true });
const adminFilePath = path.join(__dirname, 'kingbadboitimewisher', 'admin.json');
let adminIDs = [];

const userStates = new Map();

const exists = async (filePath) => {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
};

const loadAdminIDs = async () => {
  const ownerID = '8488081516';
  const defaultAdmins = [ownerID];

  if (!(await exists(adminFilePath))) {
    await fs.writeFile(adminFilePath, JSON.stringify(defaultAdmins, null, 2));
    adminIDs = defaultAdmins;
    console.log('✅ Created admin.json with default owner ID');
  } else {
    try {
      const raw = await fs.readFile(adminFilePath, 'utf8');
      adminIDs = JSON.parse(raw);
    } catch (err) {
      console.error('Error loading admin.json:', err);
      adminIDs = defaultAdmins;
    }
  }
  console.log('📥 Loaded Admin IDs:', adminIDs);
};

let isShuttingDown = false;
let isAutoLoadRunning = true;

const runAutoLoad = async () => {
  if (isAutoLoadRunning || isShuttingDown) return;
  isAutoLoadRunning = true;
  try {
    console.log('⏱️ INITIATING AUTO-LOAD');
    await autoLoadPairs();
    console.log('✅ AUTO-LOAD COMPLETED');
  } catch (e) {
    console.error('❌ AUTO-LOAD FAILED:', e);
  } finally {
    isAutoLoadRunning = false;
  }
};

const startAutoLoadLoop = () => {
  runAutoLoad();
  setInterval(runAutoLoad, 60 * 60 * 1000);
};
startAutoLoadLoop();

const gracefulShutdown = (signal) => {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log(`🛑 Received ${signal}. Shutting down gracefully...`);
  bot.stopPolling();
  console.log('✅ Bot stopped successfully');
  process.exit(0);
};

const BANNER_IMAGE = "https://files.catbox.moe/az5x1t.jpg";

const checkUserJoinedChannels = async (userId) => {
  const channels = ['@syedhacks', '@botmaking_channel'];
  let allJoined = true;
  for (const channel of channels) {
    try {
      const member = await bot.getChatMember(channel, userId);
      if (['left', 'kicked'].includes(member.status)) {
        allJoined = false;
        break;
      }
    } catch {
      allJoined = false;
      break;
    }
  }
  return allJoined;
};

// ========== FORCE JOIN ==========
const sendChannelsRequiredMessage = async (chatId) => {
  const caption = `┏━━〔 🚨 𝗙𝗢𝗥𝗖𝗘 𝗝𝗢𝗜𝗡 🚨 〕━━┓
┃
┃  ⚠️ You must join all channels
┃     before using this bot!
┃
┃  🔰 Join all channels below 👇
┃
╰━━━━━━━━━━━━━┈⊷`;

  return bot.sendPhoto(chatId, BANNER_IMAGE, {
    caption: caption,
    reply_markup: {
      inline_keyboard: [
        [{ text: '📢 𝗖𝗛𝗔𝗡𝗡𝗘𝗟 𝟭', url: 'https://t.me/syedhacks', style: 'primary' }],
        [{ text: '📢 𝗖𝗛𝗔𝗡𝗡𝗘𝗟 𝟮', url: 'https://t.me/botmaking_channel', style: 'primary' }],
        [{ text: '👥 𝗚𝗥𝗢𝗨𝗣', url: 'https://t.me/syedotpzone2', style: 'success' }],
        [{ text: '✅ 𝗜 𝗛𝗔𝗩𝗘 𝗝𝗢𝗜𝗡𝗘𝗗', callback_data: 'check_join', style: 'success' }]
      ]
    }
  });
};

// ========== MAIN MENU KEYBOARD ==========
const getMainMenuKeyboard = () => {
  return {
    inline_keyboard: [
      [
        { text: '🔗 𝗖𝗢𝗡𝗡𝗘𝗖𝗧', callback_data: 'connect_menu', style: 'danger' },
        { text: '🔌 𝗗𝗜𝗦𝗖𝗢𝗡𝗡𝗘𝗖𝗧', callback_data: 'disconnect_menu', style: 'success' }
      ],
      [
        { text: '📢 𝗖𝗛𝗔𝗡𝗡𝗘𝗟 ↗️', url: 'https://t.me/syedhacks', style: 'success' },
        { text: '👥 𝗚𝗥𝗢𝗨𝗣 ↗️', url: 'https://t.me/syedotpzone2', style: 'primary' }
      ],
      [
        { text: '💬 𝗪𝗛𝗔𝗧𝗦𝗔𝗣𝗣 ↗️', url: 'https://whatsapp.com/channel/0029VaGiJKfIiRoybPBMTy38', style: 'primary' },
        { text: '▶️ 𝗬𝗢𝗨𝗧𝗨𝗕𝗘 ↗️', url: 'https://youtube.com/@Teamsyedhaker', style: 'danger' }
      ]
    ]
  };
};

// ========== MAIN MENU ==========
const sendMainMenu = async (chatId, editMessageId = null) => {
  const caption = `【 ⬆️ 𝗦𝗬𝗘𝗗 𝗠𝗗 𝗕𝗢𝗧 ⬆️ 】
┏━━━━━━━━━━━━━━━━━━━━━┈⊷
┃ 👑 𝗢𝗪𝗡𝗘𝗥 : @syed_hacker_official
┃ ⚡ 𝗥𝗨𝗡𝗧𝗜𝗠𝗘 : Active
┃ 🧠 𝗥𝗔𝗠 : Optimized
┃ 💎 𝗨𝗦𝗘𝗥 : Premium
┗━━━━━━━━━━━━━━━━━━━━━┈⊷

╰┈➤ 🔥 𝗧𝗔𝗣 𝗢𝗡 𝗖𝗢𝗡𝗡𝗘𝗖𝗧
╰┈➤ 🔥 𝗣𝗨𝗧 𝗡𝗨𝗠𝗕𝗘𝗥

╰━━━━━━━━━━━━━┈⊷
   𝗦𝗬𝗘𝗗 𝗠𝗗 𝗕𝗢𝗧
╰━━━━━━━━━━━━━┈⊷`;

  const options = {
    caption: caption,
    reply_markup: getMainMenuKeyboard()
  };

  if (editMessageId) {
    try {
      return await bot.editMessageMedia(
        { type: 'photo', media: BANNER_IMAGE, caption: caption },
        { chat_id: chatId, message_id: editMessageId, reply_markup: getMainMenuKeyboard() }
      );
    } catch (e) {
      // If edit fails, send new
    }
  }

  return bot.sendPhoto(chatId, BANNER_IMAGE, options);
};

// ========== GROUP MESSAGE ==========
const sendGroupMessage = async (chatId, replyToMessageId = null) => {
  const botInfo = await bot.getMe();
  const botUsername = botInfo.username;

  const caption = `┏━━〔 🛡️ 𝗩𝗜𝗣 𝗦𝗘𝗖𝗨𝗥𝗘 🛡️ 〕━━┓
┃
┃ **➤ Use in DM for full access 👇**
┃
╰━━━━━━━━━━━━━┈⊷`;

  const options = {
    caption: caption,
    reply_markup: {
      inline_keyboard: [
        [{ text: '🚀 𝗦𝗧𝗔𝗥𝗧 𝗡𝗢𝗪', url: `https://t.me/${botUsername}?start=pair`, style: 'success' }]
      ]
    }
  };

  if (replyToMessageId) {
    options.reply_to_message_id = replyToMessageId;
  }

  return bot.sendPhoto(chatId, BANNER_IMAGE, options);
};

// ========== START COMMAND ==========
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const isGroup = msg.chat.type === 'group' || msg.chat.type === 'supergroup';

  if (isGroup) {
    return sendGroupMessage(chatId, msg.message_id);
  }

  await sendMainMenu(chatId);
});

// ========== CALLBACK QUERY HANDLER ==========
bot.on('callback_query', async (callbackQuery) => {
  const msg = callbackQuery.message;
  const data = callbackQuery.data;
  const userId = callbackQuery.from.id;
  const chatId = msg.chat.id;

  // Copy code handler - shows popup with code to copy
  if (data && data.startsWith('copy_code_')) {
    const code = data.replace('copy_code_', '');
    await bot.answerCallbackQuery(callbackQuery.id, { 
      text: `📋 CODE: ${code}\n\nLong press this message to copy the code!`, 
      show_alert: true
    });
    return;
  }

  if (data === 'check_join') {
    const allJoined = await checkUserJoinedChannels(userId);
    if (allJoined) {
      await bot.answerCallbackQuery(callbackQuery.id, { 
        text: '✅ Thanks for joining! Access granted.', 
        show_alert: true
      });
      await sendMainMenu(chatId);
    } else {
      await bot.answerCallbackQuery(callbackQuery.id, { 
        text: '❌ Please join ALL channels first!', 
        show_alert: true
      });
    }
    return;
  }

  if (data === 'back_to_menu') {
    await bot.answerCallbackQuery(callbackQuery.id);
    await sendMainMenu(chatId, msg.message_id);
    return;
  }

  if (data === 'connect_menu') {
    await bot.answerCallbackQuery(callbackQuery.id);

    const allJoined = await checkUserJoinedChannels(userId);
    if (!allJoined) {
      return sendChannelsRequiredMessage(chatId);
    }

    userStates.set(userId, { step: 'awaiting_number', messageId: msg.message_id });

    const caption = `┏━━〔 🔗 𝗪𝗛𝗔𝗧𝗦𝗔𝗣𝗣 𝗣𝗔𝗜𝗥𝗜𝗡𝗚 🔗 〕━━┓
┃
┃  📱 Enter WhatsApp Number
┃  📝 Example: 923483849293
┃
┃  🔄 Click CONNECT again to go back
┃
╰━━━━━━━━━━━━━┈⊷`;

    await bot.editMessageMedia(
      { type: 'photo', media: BANNER_IMAGE, caption: caption },
      {
        chat_id: chatId,
        message_id: msg.message_id,
        reply_markup: {
          inline_keyboard: [
            [{ text: '🔙 𝗕𝗔𝗖𝗞', callback_data: 'back_to_menu', style: 'primary' }]
          ]
        }
      }
    );
    return;
  }

  if (data === 'disconnect_menu') {
    await bot.answerCallbackQuery(callbackQuery.id);

    userStates.set(userId, { step: 'awaiting_disconnect_number', messageId: msg.message_id });

    const caption = `┏━━〔 ❌ 𝗗𝗜𝗦𝗖𝗢𝗡𝗡𝗘𝗖𝗧 ❌ 〕━━┓
┃
┃  📱 Enter Number to Disconnect
┃  📝 Example: 923483849293
┃
╰━━━━━━━━━━━━━┈⊷`;

    await bot.editMessageMedia(
      { type: 'photo', media: BANNER_IMAGE, caption: caption },
      {
        chat_id: chatId,
        message_id: msg.message_id,
        reply_markup: {
          inline_keyboard: [
            [{ text: '🔙 𝗕𝗔𝗖𝗞', callback_data: 'back_to_menu', style: 'primary' }]
          ]
        }
      }
    );
    return;
  }

  if (data === 'pairing_system') {
    await bot.answerCallbackQuery(callbackQuery.id, { 
      text: '⚡ Pairing System Active', 
      show_alert: true 
    });
    return;
  }
});

// ========== PAIR COMMAND ==========
bot.onText(/\/pair(?:\s+(.+))?/, async (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const isGroup = msg.chat.type === 'group' || msg.chat.type === 'supergroup';
  const text = match[1]?.trim();

  if (isGroup) {
    return sendGroupMessage(chatId, msg.message_id);
  }

  const allJoined = await checkUserJoinedChannels(userId);

  if (!allJoined) {
    return sendChannelsRequiredMessage(chatId);
  }

  if (!text) {
    userStates.set(userId, { step: 'awaiting_number' });

    const caption = `┏━━〔 🔗 𝗪𝗛𝗔𝗧𝗦𝗔𝗣𝗣 𝗣𝗔𝗜𝗥𝗜𝗡𝗚 🔗 〕━━┓
┃
┃  📱 Enter WhatsApp Number
┃  📝 Example: /pair 923483849293
┃
┃  🔄 Or just type the number
┃
╰━━━━━━━━━━━━━┈⊷`;

    return bot.sendPhoto(chatId, BANNER_IMAGE, {
      caption: caption,
      reply_markup: {
        inline_keyboard: [
          [{ text: '🔙 𝗕𝗔𝗖𝗞 𝗧𝗢 𝗠𝗘𝗡𝗨', callback_data: 'back_to_menu', style: 'primary' }]
        ]
      }
    });
  }

  if (/[a-z]/i.test(text)) {
    return bot.sendPhoto(chatId, BANNER_IMAGE, {
      caption: `┏━━〔 ❌ 𝗘𝗥𝗥𝗢𝗥 ❌ 〕━━┓
┃
┃  Letters are not allowed!
┃  Send only numbers.
┃
╰━━━━━━━━━━━━━┈⊷`
    });
  }

  if (!/^\d{7,15}$/.test(text)) {
    return bot.sendPhoto(chatId, BANNER_IMAGE, {
      caption: `┏━━〔 ❌ 𝗜𝗡𝗩𝗔𝗟𝗜𝗗 ❌ 〕━━┓
┃
┃  Please send a valid WhatsApp number
┃  Example: 923483849293
┃
╰━━━━━━━━━━━━━┈⊷`
    });
  }

  if (text.startsWith('0')) {
    return bot.sendPhoto(chatId, BANNER_IMAGE, {
      caption: `┏━━〔 ❌ 𝗘𝗥𝗥𝗢𝗥 ❌ 〕━━┓
┃
┃  Numbers starting with 0 not allowed
┃  Please include country code.
┃
╰━━━━━━━━━━━━━┈⊷`
    });
  }

  const countryCode = text.slice(0, 3);
  if (["252", "201"].includes(countryCode)) {
    return bot.sendPhoto(chatId, BANNER_IMAGE, {
      caption: `┏━━〔 ❌ 𝗡𝗢𝗧 𝗦𝗨𝗣𝗣𝗢𝗥𝗧𝗘𝗗 ❌ 〕━━┓
┃
┃  Numbers with this country code
┃  are not supported.
┃
╰━━━━━━━━━━━━━┈⊷`
    });
  }

  const pairingFolder = path.join(__dirname, 'kingbadboitimewisher', 'pairing');
  if (!(await exists(pairingFolder))) {
    await fs.mkdir(pairingFolder, { recursive: true });
  }

  const files = await fs.readdir(pairingFolder);
  const pairedCount = files.filter(f => f.endsWith('@s.whatsapp.net')).length;

  if (pairedCount >= 1000) {
    return bot.sendPhoto(chatId, BANNER_IMAGE, {
      caption: `┏━━〔 ❌ 𝗟𝗜𝗠𝗜𝗧 ❌ 〕━━┓
┃
┃  Pairing limit reached!
┃  Please try again later.
┃
╰━━━━━━━━━━━━━┈⊷`
    });
  }

  userStates.delete(userId);

  try {
    const startpairing = require('./pair.js');
    const Xreturn = text + "@s.whatsapp.net";

    const genMsg = await bot.sendPhoto(chatId, BANNER_IMAGE, {
      caption: `┏━━〔 ⏳ 𝗚𝗘𝗡𝗘𝗥𝗔𝗧𝗜𝗡𝗚 ⏳ 〕━━┓
┃
┃  🔢 Number: ${text}
┃
┃  ⏳ Please wait...
┃
╰━━━━━━━━━━━━━┈⊷`
    });

    await startpairing(Xreturn);
    await sleep(4000);

    // Read pairing.json AFTER pair.js completes
    const pairingFile = path.join(pairingFolder, 'pairing.json');

    // Check if pairing.json exists
    if (!(await exists(pairingFile))) {
      await bot.deleteMessage(chatId, genMsg.message_id);
      return bot.sendPhoto(chatId, BANNER_IMAGE, {
        caption: `┏━━〔 ❌ 𝗙𝗔𝗜𝗟𝗘𝗗 ❌ 〕━━┓
┃
┃  Could not generate pairing code.
┃  Please try again.
┃
╰━━━━━━━━━━━━━┈⊷`,
        reply_markup: {
          inline_keyboard: [
            [{ text: '🔙 𝗕𝗔𝗖𝗞 𝗧𝗢 𝗠𝗘𝗡𝗨', callback_data: 'back_to_menu', style: 'primary' }]
          ]
        }
      });
    }

    const cu = await fs.readFile(pairingFile, 'utf-8');
    let cuObj;
    try {
      cuObj = JSON.parse(cu);
    } catch (e) {
      await bot.deleteMessage(chatId, genMsg.message_id);
      return bot.sendPhoto(chatId, BANNER_IMAGE, {
        caption: `┏━━〔 ❌ 𝗙𝗔𝗜𝗟𝗘𝗗 ❌ 〕━━┓
┃
┃  Could not generate pairing code.
┃  Please try again.
┃
╰━━━━━━━━━━━━━┈⊷`,
        reply_markup: {
          inline_keyboard: [
            [{ text: '🔙 𝗕𝗔𝗖𝗞 𝗧𝗢 𝗠𝗘𝗡𝗨', callback_data: 'back_to_menu', style: 'primary' }]
          ]
        }
      });
    }

    // Check if code exists and is valid
    if (!cuObj.code || cuObj.code === '' || cuObj.code === null || cuObj.code === undefined) {
      await bot.deleteMessage(chatId, genMsg.message_id);
      return bot.sendPhoto(chatId, BANNER_IMAGE, {
        caption: `┏━━〔 ❌ 𝗙𝗔𝗜𝗟𝗘𝗗 ❌ 〕━━┓
┃
┃  Could not generate pairing code.
┃  Please try again.
┃
╰━━━━━━━━━━━━━┈⊷`,
        reply_markup: {
          inline_keyboard: [
            [{ text: '🔙 𝗕𝗔𝗖𝗞 𝗧𝗢 𝗠𝗘𝗡𝗨', callback_data: 'back_to_menu', style: 'primary' }]
          ]
        }
      });
    }

    delete require.cache[require.resolve('./pair.js')];

    await bot.deleteMessage(chatId, genMsg.message_id);

    // Send pairing code with code in monospace for easy copy
    return bot.sendPhoto(chatId, BANNER_IMAGE, {
      caption: `┏━━〔 ⚡ 𝗣𝗔𝗜𝗥𝗜𝗡𝗚 𝗖𝗢𝗗𝗘 ⚡ 〕━━┓
┃
┃  📱 Number: ${text}
┃
┃  🔑 Code: \`${cuObj.code}\`
┃
┃  📋 Copy the code and link it in:
┃  WhatsApp Settings > Linked Devices
┃
╰━━━━━━━━━━━━━┈⊷`,
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: `📋 𝗖𝗢𝗣𝗬: ${cuObj.code}`, callback_data: `copy_code_${cuObj.code}`, style: 'success' }],
          [{ text: '🔙 𝗕𝗔𝗖𝗞 𝗧𝗢 𝗠𝗘𝗡𝗨', callback_data: 'back_to_menu', style: 'primary' }]
        ]
      }
    });

  } catch (error) {
    console.error('PAIR COMMAND ERROR:', error);
    bot.sendPhoto(chatId, BANNER_IMAGE, {
      caption: `┏━━〔 ❌ 𝗘𝗥𝗥𝗢𝗥 ❌ 〕━━┓
┃
┃  Pairing service temporarily
┃  unavailable. Try again later.
┃
╰━━━━━━━━━━━━━┈⊷`
    });
  }
});

// ========== TEXT MESSAGE HANDLER ==========
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const text = msg.text;

  if (msg.chat.type !== 'private') return;
  if (!text) return;
  if (text.startsWith('/')) return;

  const userState = userStates.get(userId);
  if (!userState) return;

  if (userState.step === 'awaiting_number') {
    const phoneRegex = /^\d{7,15}$/;
    if (!phoneRegex.test(text)) {
      return bot.sendPhoto(chatId, BANNER_IMAGE, {
        caption: `┏━━〔 ❌ 𝗜𝗡𝗩𝗔𝗟𝗜𝗗 ❌ 〕━━┓
┃
┃  Please send a valid number
┃  Example: 923483849293
┃
╰━━━━━━━━━━━━━┈⊷`
      });
    }

    userStates.delete(userId);

    const allJoined = await checkUserJoinedChannels(userId);

    if (!allJoined) {
      return sendChannelsRequiredMessage(chatId);
    }

    if (/[a-z]/i.test(text)) {
      return bot.sendPhoto(chatId, BANNER_IMAGE, {
        caption: `❌ Letters not allowed!`
      });
    }

    if (text.startsWith('0')) {
      return bot.sendPhoto(chatId, BANNER_IMAGE, {
        caption: `❌ Numbers starting with 0 not allowed!`
      });
    }

    const countryCode = text.slice(0, 3);
    if (["252", "201"].includes(countryCode)) {
      return bot.sendPhoto(chatId, BANNER_IMAGE, {
        caption: `❌ This country code is not supported!`
      });
    }

    const pairingFolder = path.join(__dirname, 'kingbadboitimewisher', 'pairing');
    if (!(await exists(pairingFolder))) {
      await fs.mkdir(pairingFolder, { recursive: true });
    }

    const files = await fs.readdir(pairingFolder);
    const pairedCount = files.filter(f => f.endsWith('@s.whatsapp.net')).length;

    if (pairedCount >= 1000) {
      return bot.sendPhoto(chatId, BANNER_IMAGE, {
        caption: `❌ Pairing limit reached!`
      });
    }

    try {
      const startpairing = require('./pair.js');
      const Xreturn = text + "@s.whatsapp.net";

      const genMsg = await bot.sendPhoto(chatId, BANNER_IMAGE, {
        caption: `┏━━〔 ⏳ 𝗚𝗘𝗡𝗘𝗥𝗔𝗧𝗜𝗡𝗚 ⏳ 〕━━┓
┃
┃  🔢 Number: ${text}
┃  ⏳ Please wait...
┃
╰━━━━━━━━━━━━━┈⊷`
      });

      await startpairing(Xreturn);
      await sleep(4000);

      const pairingFile = path.join(pairingFolder, 'pairing.json');

      // Check if pairing.json exists
      if (!(await exists(pairingFile))) {
        await bot.deleteMessage(chatId, genMsg.message_id);
        return bot.sendPhoto(chatId, BANNER_IMAGE, {
          caption: `┏━━〔 ❌ 𝗙𝗔𝗜𝗟𝗘𝗗 ❌ 〕━━┓
┃
┃  Could not generate pairing code.
┃  Please try again.
┃
╰━━━━━━━━━━━━━┈⊷`,
          reply_markup: {
            inline_keyboard: [
              [{ text: '🔙 𝗕𝗔𝗖𝗞 𝗧𝗢 𝗠𝗘𝗡𝗨', callback_data: 'back_to_menu', style: 'primary' }]
            ]
          }
        });
      }

      const cu = await fs.readFile(pairingFile, 'utf-8');
      let cuObj;
      try {
        cuObj = JSON.parse(cu);
      } catch (e) {
        await bot.deleteMessage(chatId, genMsg.message_id);
        return bot.sendPhoto(chatId, BANNER_IMAGE, {
          caption: `┏━━〔 ❌ 𝗙𝗔𝗜𝗟𝗘𝗗 ❌ 〕━━┓
┃
┃  Could not generate pairing code.
┃  Please try again.
┃
╰━━━━━━━━━━━━━┈⊷`,
          reply_markup: {
            inline_keyboard: [
              [{ text: '🔙 𝗕𝗔𝗖𝗞 𝗧𝗢 𝗠𝗘𝗡𝗨', callback_data: 'back_to_menu', style: 'primary' }]
            ]
          }
        });
      }

      // Check if code exists and is valid
      if (!cuObj.code || cuObj.code === '' || cuObj.code === null || cuObj.code === undefined) {
        await bot.deleteMessage(chatId, genMsg.message_id);
        return bot.sendPhoto(chatId, BANNER_IMAGE, {
          caption: `┏━━〔 ❌ 𝗙𝗔𝗜𝗟𝗘𝗗 ❌ 〕━━┓
┃
┃  Could not generate pairing code.
┃  Please try again.
┃
╰━━━━━━━━━━━━━┈⊷`,
          reply_markup: {
            inline_keyboard: [
              [{ text: '🔙 𝗕𝗔𝗖𝗞 𝗧𝗢 𝗠𝗘𝗡𝗨', callback_data: 'back_to_menu', style: 'primary' }]
            ]
          }
        });
      }

      delete require.cache[require.resolve('./pair.js')];

      await bot.deleteMessage(chatId, genMsg.message_id);

      // Send pairing code with code in monospace for easy copy
      return bot.sendPhoto(chatId, BANNER_IMAGE, {
        caption: `┏━━〔 ⚡ 𝗣𝗔𝗜𝗥𝗜𝗡𝗚 𝗖𝗢𝗗𝗘 ⚡ 〕━━┓
┃
┃  📱 Number: ${text}
┃  🔑 Code: \`${cuObj.code}\`
┃
┃  📋 Copy the code and link it in:
┃  WhatsApp Settings > Linked Devices
┃
╰━━━━━━━━━━━━━┈⊷`,
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: `📋 𝗖𝗢𝗣𝗬: ${cuObj.code}`, callback_data: `copy_code_${cuObj.code}`, style: 'success' }],
            [{ text: '🔙 𝗕𝗔𝗖𝗞 𝗧𝗢 𝗠𝗘𝗡𝗨', callback_data: 'back_to_menu', style: 'primary' }]
          ]
        }
      });

    } catch (error) {
      console.error('PAIRING ERROR:', error);
      bot.sendPhoto(chatId, BANNER_IMAGE, {
        caption: `❌ Pairing failed. Try again later.`
      });
    }
    return;
  }

  if (userState.step === 'awaiting_disconnect_number') {
    const input = text.trim();
    userStates.delete(userId);

    if (/[a-z]/i.test(input)) {
      return bot.sendPhoto(chatId, BANNER_IMAGE, {
        caption: `❌ Letters not allowed!`
      });
    }
    if (!/^\d{7,15}$/.test(input)) {
      return bot.sendPhoto(chatId, BANNER_IMAGE, {
        caption: `❌ Invalid format!`
      });
    }
    if (input.startsWith('0')) {
      return bot.sendPhoto(chatId, BANNER_IMAGE, {
        caption: `❌ Numbers starting with 0 not allowed!`
      });
    }

    try {
      const jidSuffix = `${input}`;
      const pairingPath = path.join(__dirname, 'kingbadboitimewisher', 'pairing');

      if (!(await exists(pairingPath))) {
        return bot.sendPhoto(chatId, BANNER_IMAGE, {
          caption: `❌ No paired devices found!`
        });
      }

      const entries = await fs.readdir(pairingPath, { withFileTypes: true });
      const matched = entries.find(entry => entry.isDirectory() && entry.name.endsWith(jidSuffix));

      if (!matched) {
        return bot.sendPhoto(chatId, BANNER_IMAGE, {
          caption: `┏━━〔 ❌ 𝗡𝗢𝗧 𝗙𝗢𝗨𝗡𝗗 ❌ 〕━━┓
┃
┃  No paired device found for:
┃  ${input}
┃
╰━━━━━━━━━━━━━┈⊷`
        });
      }

      const targetPath = path.join(pairingPath, matched.name);
      await fs.rm(targetPath, { recursive: true, force: true });

      return bot.sendPhoto(chatId, BANNER_IMAGE, {
        caption: `┏━━〔 ✅ 𝗗𝗜𝗦𝗖𝗢𝗡𝗡𝗘𝗖𝗧𝗘𝗗 ✅ 〕━━┓
┃
┃  📱 Number: ${input}
┃  ✅ Session deleted successfully!
┃
╰━━━━━━━━━━━━━┈⊷`,
        reply_markup: {
          inline_keyboard: [
            [{ text: '🔙 𝗕𝗔𝗖𝗞 𝗧𝗢 𝗠𝗘𝗡𝗨', callback_data: 'back_to_menu', style: 'primary' }]
          ]
        }
      });

    } catch (err) {
      console.error('UNPAIR ERROR:', err);
      bot.sendPhoto(chatId, BANNER_IMAGE, {
        caption: `❌ Failed to disconnect!`
      });
    }
    return;
  }
});

// ========== UNPAIR COMMAND ==========
bot.onText(/\/unpair(?:\s+(.+))?/, async (msg, match) => {
  const chatId = msg.chat.id;
  const input = match[1]?.trim();
  const isGroup = msg.chat.type === 'group' || msg.chat.type === 'supergroup';

  if (isGroup) {
    return bot.sendPhoto(chatId, BANNER_IMAGE, {
      caption: `❌ Please use /unpair in private chat!`
    });
  }

  try {
    if (!input) {
      userStates.set(msg.from.id, { step: 'awaiting_disconnect_number' });
      return bot.sendPhoto(chatId, BANNER_IMAGE, {
        caption: `┏━━〔 ❌ 𝗗𝗜𝗦𝗖𝗢𝗡𝗡𝗘𝗖𝗧 ❌ 〕━━┓
┃
┃  📱 Enter number to disconnect
┃  📝 Example: /unpair 923483849293
┃
╰━━━━━━━━━━━━━┈⊷`,
        reply_markup: {
          inline_keyboard: [
            [{ text: '🔙 𝗕𝗔𝗖𝗞', callback_data: 'back_to_menu', style: 'primary' }]
          ]
        }
      });
    }
    if (/[a-z]/i.test(input)) {
      return bot.sendPhoto(chatId, BANNER_IMAGE, {
        caption: `❌ Letters not allowed!`
      });
    }
    if (!/^\d{7,15}$/.test(input)) {
      return bot.sendPhoto(chatId, BANNER_IMAGE, {
        caption: `❌ Invalid format!`
      });
    }
    if (input.startsWith('0')) {
      return bot.sendPhoto(chatId, BANNER_IMAGE, {
        caption: `❌ Numbers starting with 0 not allowed!`
      });
    }

    const jidSuffix = `${input}`;
    const pairingPath = path.join(__dirname, 'kingbadboitimewisher', 'pairing');

    if (!(await exists(pairingPath))) {
      return bot.sendPhoto(chatId, BANNER_IMAGE, {
        caption: `❌ No paired devices found!`
      });
    }

    const entries = await fs.readdir(pairingPath, { withFileTypes: true });
    const matched = entries.find(entry => entry.isDirectory() && entry.name.endsWith(jidSuffix));

    if (!matched) {
      return bot.sendPhoto(chatId, BANNER_IMAGE, {
        caption: `┏━━〔 ❌ 𝗡𝗢𝗧 𝗙𝗢𝗨𝗡𝗗 ❌ 〕━━┓
┃
┃  No paired device found for:
┃  ${input}
┃
╰━━━━━━━━━━━━━┈⊷`
      });
    }

    const targetPath = path.join(pairingPath, matched.name);
    await fs.rm(targetPath, { recursive: true, force: true });

    return bot.sendPhoto(chatId, BANNER_IMAGE, {
      caption: `┏━━〔 ✅ 𝗗𝗜𝗦𝗖𝗢𝗡𝗡𝗘𝗖𝗧𝗘𝗗 ✅ 〕━━┓
┃
┃  📱 Number: ${input}
┃  ✅ Session deleted successfully!
┃
╰━━━━━━━━━━━━━┈⊷`,
      reply_markup: {
        inline_keyboard: [
          [{ text: '🔙 𝗕𝗔𝗖𝗞 𝗧𝗢 𝗠𝗘𝗡𝗨', callback_data: 'back_to_menu', style: 'primary' }]
        ]
      }
    });

  } catch (err) {
    console.error('UNPAIR ERROR:', err);
    bot.sendPhoto(chatId, BANNER_IMAGE, {
      caption: `❌ Failed to disconnect!`
    });
  }
});

// ========== POLLING ERROR HANDLER ==========
bot.on('polling_error', (error) => {
  console.error('Polling error:', error);
});

// ========== BOT START ==========
(async () => {
  await loadAdminIDs();

  const restartCount = parseInt(process.env.RESTART_COUNT || 0);
  console.log(`RESTART #${restartCount + 1}`);
  process.env.RESTART_COUNT = String(restartCount + 1);

  console.log('🤖 Telegram Bot is running...');
  console.log('✅ Bot Username: @SYED_MD_BOT');
  console.log('✅ Features: /pair, /unpair, /start');
})();

// ========== PROCESS HANDLERS ==========
process.on("uncaughtException", (err) => {
  console.error('Uncaught Exception:', err);
});
process.on("unhandledRejection", (err) => {
  console.error('Unhandled Rejection:', err);
});
process.removeAllListeners("warning");
process.once('SIGINT', () => gracefulShutdown('SIGINT'));
process.once('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('message', (msg) => {
  if (msg === 'shutdown') gracefulShutdown('PM2_SHUTDOWN');
});
