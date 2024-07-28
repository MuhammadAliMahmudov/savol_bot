const TelegramBot = require('node-telegram-bot-api');
require("dotenv").config();
const token = process.env.token;
const bot = new TelegramBot(token, { polling: true });

let courseInfo = "Bu yerda kurs haqida ma'lumot bo'ladi.";
const adminId = '1679325441'; // Replace with the actual admin's user ID
const adminUsername = '@ilminur01'; // Replace with the actual admin's username without '@'

// Keyboard options
const mainKeyboard = {
    keyboard: [
        [{ text: 'Kursga yozilish' }],
        [{ text: 'Qayta ishga tushirish' }]
    ],
    resize_keyboard: true
};

const educationTypeKeyboard = {
    keyboard: [
        [{ text: 'Individual' }, { text: 'Umumiy' }]
    ],
    resize_keyboard: true
};

bot.onText(/\/start|Qayta ishga tushirish/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, `${courseInfo}`, {
        reply_markup: mainKeyboard
    });
});

bot.onText(/\/admin/, (msg) => {
    const chatId = msg.chat.id;
    if (chatId.toString() === adminId) {
        bot.sendMessage(chatId, "Admin paneli:", {
            reply_markup: {
                keyboard: [
                    ['Start xabarini yangilash'],
                    ['Foydalanuvchi bilan muloqot']
                ],
                resize_keyboard: true
            }
        });
    } else {
        bot.sendMessage(chatId, "Sizda admin huquqlari yo'q.");
    }
});

let adminAction = '';

bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    if (chatId.toString() === adminId) {
        switch (text) {
            case 'Start xabarini yangilash':
                adminAction = 'updateStartMessage';
                bot.sendMessage(chatId, "Yangi start xabarini kiriting:");
                break;
            case 'Foydalanuvchi bilan muloqot':
                adminAction = 'chatWithUser';
                bot.sendMessage(chatId, "Foydalanuvchi ID sini kiriting:");
                break;
            default:
                if (adminAction === 'updateStartMessage') {
                    courseInfo = text;
                    bot.sendMessage(chatId, "Start xabari yangilandi!");
                    adminAction = '';
                } else if (adminAction === 'chatWithUser') {
                    const userId = text;
                    bot.sendMessage(userId, "Admin siz bilan bog'lanmoqchi. Iltimos, javob bering.");
                    bot.sendMessage(chatId, `Foydalanuvchi ${userId} ga xabar yuborildi. Endi siz u bilan bot orqali suhbatlasha olasiz.`);
                    adminAction = 'chatting' + userId;
                } else if (adminAction.startsWith('chatting')) {
                    const userId = adminAction.replace('chatting', '');
                    bot.sendMessage(userId, "Admin: " + text);
                }
        }
    } else {
        if (text === 'Kursga yozilish') {
            bot.sendMessage(chatId, "O'qish turini tanlang:", {
                reply_markup: educationTypeKeyboard
            });
        } else if (text === 'Individual' || text === 'Umumiy') {
            const userData = {
                userId: msg.from.id,
                firstName: msg.from.first_name,
                lastName: msg.from.last_name,
                username: msg.from.username,
                educationType: text
            };

            const adminMessage = `
Yangi talaba ma'lumotlari:
Telegram profili:
🆔 User ID: t.me/@id${userData.userId}
👤 Ism: ${userData.firstName}
📝 Familiya: ${userData.lastName || 'Ko\'rsatilmagan'}
🏷 Username: ${userData.username ? '@' + userData.username : 'Ko\'rsatilmagan'}
Kiritilgan ma'lumotlar:
📚 O'qish turi: ${userData.educationType}
            `;
            
            bot.sendMessage(adminId, adminMessage, {
                reply_markup: {
                    inline_keyboard: [[
                        { text: "Foydalanuvchi bilan bog'lanish", callback_data: `connect:${userData.userId}` }
                    ]]
                }
            });

            bot.sendMessage(chatId, "Rahmat! Sizning ma'lumotlaringiz adminga yuborildi. Admin tez orada siz bilan aloqaga chiqadi.", {
                reply_markup: {
                    inline_keyboard: [[
                        { text: "Admin bilan bog'lanish", url: `@${adminUsername}` }
                    ]]
                }
            });

            // Asosiy menyuga qaytish
            setTimeout(() => {
                bot.sendMessage(chatId, "Asosiy menyuga qaytish uchun 'Qayta ishga tushirish' tugmasini bosing.", {
                    reply_markup: mainKeyboard
                });
            }, 2000);
        } else if (adminAction.startsWith('chatting') && chatId.toString() === adminAction.replace('chatting', '')) {
            bot.sendMessage(adminId, "Foydalanuvchi: " + text);
        }
    }
});

bot.on('callback_query', (callbackQuery) => {
    const action = callbackQuery.data;
    const msg = callbackQuery.message;
    const chatId = msg.chat.id;

    if (action.startsWith('connect:')) {
        const userId = action.split(':')[1];
        bot.sendMessage(chatId, `Foydalanuvchi ${userId} bilan muloqot boshlandi. Xabaringizni yozing:`);
        adminAction = 'chatting' + userId;
    }
});

console.log('Bot is running...');