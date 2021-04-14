require('dotenv').config();
const debugText = require('./helper');
const fs = require('fs');
const TelegramBot = require('node-telegram-bot-api');


const TOKEN = process.env.API_TOKEN;

// const inline_keyboard = [
// 	[
// 		{
// 			text: 'Forward',
// 			callback_data: 'forward'
// 		}
// 	],
// 	[
// 		{
// 			text: 'Reply',
// 			callback_data: 'reply'
// 		}
// 	],
// 	[
// 		{
// 			text: 'Edit',
// 			callback_data: 'edit'
// 		}
// 	],
// 	[
// 		{
// 			text: 'Delete',
// 			callback_data: 'delete'
// 		}
// 	]
// ]


const bot = new TelegramBot(TOKEN, {
	polling: true,
})


// bot.onText(/\/video/, msg => {
// 	bot.sendVideo(msg.chat.id, './other_file/video.mp4');
// })


bot.onText(/\/video1/, msg => {
	bot.sendMessage(msg.chat.id, 'Начата загрузка видео');
	fs.readFile(`${__dirname}/other_file/video.mp4`, (err, video) => {
		bot.sendVideo(msg.chat.id, video, {
			caption: 'Super video format'
		}).then(() => {
			bot.sendMessage(msg.chat.id, 'Загрузка видео успешно завершена!');
		})
	})
})


// bot.onText(/\/doc/, msg => {
// 	bot.sendDocument(msg.chat.id, './other_file/main.txt');
// })

// bot.onText(/\/doc1/, msg => {
// 	bot.sendMessage(msg.chat.id, 'Начата загрузка документа');
// 	fs.readFile(`${__dirname}/other_file/file.zip`, (err, file) => {
// 		bot.sendDocument(msg.chat.id, file).then(() => {
// 			bot.sendMessage(msg.chat.id, 'Файл успешно загружен!');
// 		})
// 	})
// })



// bot.onText(/\/audio/, msg => {
// 	bot.sendAudio(msg.chat.id, fs.readFileSync(__dirname + '/other_file/music.mp3'));
// })

// bot.onText(/\/audio2/, msg => {
// 	bot.sendMessage(msg.chat.id, 'Старт загрузки аудиофайла');
// 	fs.readFile(__dirname + '/other_file/music.mp3', (err, data) => {
// 		bot.sendAudio(msg.chat.id, data).then(() => {
// 			bot.sendMessage(msg.chat.id, 'Загрузка успешно завершена!')
// 		})
// 	})
// })


// bot.onText(/\/pic/, msg => {
// 	bot.sendPhoto(msg.chat.id, fs.readFileSync(__dirname + '/other_file/dog.webp'));
// })


// bot.onText(/\/pic2/, msg => {
// 	bot.sendPhoto(msg.chat.id, './other_file/dog.webp', {
// 		caption: 'This is my dog!!',
// 	});
// })


// bot.on('callback_query', query => {
// 	const { chat, message_id, text } = query.message;
// 	switch (query.data) {
// 		case 'forward':
// 			bot.forwardMessage(chat.id, chat.id, message_id);
// 			break;
// 		case 'reply':
// 			bot.sendMessage(chat.id, 'Отвечаю на сообщение', {
// 				reply_to_message_id: message_id
// 			})
// 			break;
// 		case 'edit':
// 			bot.editMessageText(`${text} (edited)`, {
// 				chat_id: chat.id,
// 				message_id: message_id,
// 				reply_markup: { inline_keyboard }
// 			})
// 			break;
// 		case 'delete':
// 			bot.deleteMessage(chat.id, message_id)
// 			break;
// 	}

// 	bot.answerCallbackQuery(query.id)

// })


// bot.onText(/\/start/, (msg, [source, match]) => {
// 	const chatId = msg.chat.id;
// 	bot.sendMessage(chatId, 'Keyboard', {
// 		reply_markup: {
// 			inline_keyboard
// 		}
// 	})
// })


// bot.on('inline_query', query => {
// 	const result = [];

// 	for (let i = 0; i < 5; i++) {
// 		result.push({
// 			type: 'article',
// 			id: i.toString(),
// 			title: `Title ${i}`,
// 			input_message_content: {
// 				message_text: `Article #${i + 1}`
// 			}
// 		})
// 	}

// 	bot.answerInlineQuery(query.id, result, {
// 		cache_time: 0
// 	})

// })


// bot.on('message', (msg) => {
// 	const chatId = msg.chat.id;
// 	bot.sendMessage(chatId, debugText(msg));
// })


// bot.onText(/\/start/, (msg) => {
// 	const chatId = msg.chat.id;
// 	bot.sendMessage(chatId, `Привет, ${msg.from.first_name}`);
// })

// bot.onText(/\/help/, (msg) => {
// 	const chatId = msg.chat.id;
// 	bot.sendMessage(chatId, `Я помог, чем смог`);
// 	bot.sendMessage(chatId, debugText(msg));
// })

// bot.onText(/\/test/, (msg) => {
// 	const chatId = msg.chat.id;
// 	bot.sendMessage(chatId, `Тест прошел успешно`);
// })


// bot.on('message', msg => {
// 	const chatId = msg.chat.id;
// 	bot.sendMessage(chatId, 'Inline keyboard', {
// 		reply_markup: {
// 			inline_keyboard: [
// 				[
// 					{
// 						text: 'Google',
// 						url: 'https://google.com.ua/',
// 						callback_data: 'google'
// 					}
// 				],
// 				[
// 					{
// 						text: 'First',
// 						callback_data: 'first'
// 					},
// 					{
// 						text: 'Second',
// 						callback_data: 'second'
// 					}
// 				],
// 			]
// 		}
// 	})
// })


// bot.on('callback_query', query => {
// 	const chatId = query.message.chat.id;
// 	// bot.sendMessage(chatId, debugText(query));
// 	bot.answerCallbackQuery(query.id, `${query.data}`);
// })

bot.on("polling_error", (err) => console.log(err));


// bot.on('message', (msg) => {

// 	const chatId = msg.chat.id;

// 	switch (msg.text) {
// 		case 'Открыть': {
// 			bot.sendMessage(chatId, 'https://media2.giphy.com/media/yFb5bKTItbB4dZ9xfd/giphy.gif');
// 			break;
// 		}
// 		case 'Закрыть': {
// 			bot.sendMessage(chatId, 'Закрываю клавиатуру', {
// 				reply_markup: {
// 					remove_keyboard: true,
// 				}
// 			})
// 			break;
// 		}
// 		default: {
// 			bot.sendMessage(chatId, `Привет ${msg.from.first_name}`, {
// 				reply_markup: {
// 					keyboard: [
// 						['Открыть'],
// 						[{
// 							text: 'Отправить местоположение',
// 							request_location: true,
// 						}],
// 						['Закрыть'],
// 						[
// 							{
// 								text: 'Отправить контакт',
// 								request_contact: true,
// 							}
// 						]

// 					],
// 					one_time_keyboard: true
// 				}
// 			})
// 			break;
// 		}
// 	}
// })

console.log('Bot has been started....');