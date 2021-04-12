require('dotenv').config();
const debugText = require('./helper');
const TelegramBot = require('node-telegram-bot-api');

const TOKEN = process.env.API_TOKEN;

const bot = new TelegramBot(TOKEN, {
	polling: true
})


// bot.on('message', (msg) => {
// 	const chatId = msg.chat.id;
// 	bot.sendMessage(chatId, debugText(msg));
// })


// bot.onText(/\/start/, (msg) => {
// 	const chatId = msg.chat.id;
// 	bot.sendMessage(chatId, `Привет, ${msg.from.first_name}`);
// })

bot.onText(/\/help/, (msg) => {
	const chatId = msg.chat.id;
	bot.sendMessage(chatId, `Я помог, чем смог`);
	bot.sendMessage(chatId, debugText(msg));
})

bot.onText(/\/test/, (msg) => {
	const chatId = msg.chat.id;
	bot.sendMessage(chatId, `Тест прошел успешно`);
})

bot.on('message', (msg) => {

	const chatId = msg.chat.id;

	switch (msg.text) {
		case 'Открыть': {
			bot.sendMessage(chatId, 'https://media2.giphy.com/media/yFb5bKTItbB4dZ9xfd/giphy.gif');
			break;
		}
		case 'Закрыть': {
			bot.sendMessage(chatId, 'Закрываю клавиатуру', {
				reply_markup: {
					remove_keyboard: true,
				}
			})
			break;
		}
		default: {
			bot.sendMessage(chatId, `Привет ${msg.from.first_name}`, {
				reply_markup: {
					keyboard: [
						['Открыть'],
						[{
							text: 'Отправить местоположение',
							request_location: true,
						}],
						['Закрыть'],
						[
							{
								text: 'Отправить контакт',
								request_contact: true,
							}
						]

					],
					one_time_keyboard: true
				}
			})
			break;
		}
	}


})

console.log('Bot has been started....');