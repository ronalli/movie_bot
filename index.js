require('dotenv').config();
// const debugText = require('./helper');
const database = require('./database.json');
const helper = require('./helper');
const kb = require('./keyboard-buttons');
const keyboard = require('./keyboard');
const fs = require('fs');
const mongoose = require('mongoose');
const TelegramBot = require('node-telegram-bot-api');
const { getChatId } = require('./helper');
const TOKEN = process.env.API_TOKEN;
const mongoDB = 'mongodb://localhost/cinemadb';

helper.logStart();


mongoose.Promise = global.Promise
mongoose.connect(mongoDB, {
	useUnifiedTopology: true
}).then(() => {
	console.log('MongoDB connected');
}).catch((err) => {
	console.log(err);
})

require('./models/film.model')
require('./models/cinema.model')

const Film = mongoose.model('films')
const Cinema = mongoose.model('cinemas')

// database.films.forEach(f => new Film(f).save())
// database.cinemas.forEach(c => new Cinema(c).save().catch(err => console.log(err)))

//===================================================

const bot = new TelegramBot(TOKEN, {
	polling: true,
})

bot.on('message', msg => {
	const chatId = helper.getChatId(msg);
	switch (msg.text) {
		case kb.home.favourite:
			break;
		case kb.home.films:
			bot.sendMessage(chatId, `Выберите жанр:`, {
				reply_markup: {
					keyboard: keyboard.films
				}
			})
			break;
		case kb.film.action:
			sendFilmsByQuery(chatId, { type: 'action' })
			break;
		case kb.film.comedy:
			sendFilmsByQuery(chatId, { type: 'comedy' })
			break;
		case kb.film.random:
			sendFilmsByQuery(chatId, {})
			break;
		case kb.home.cinemas:
			bot.sendMessage(chatId, `Отправить местоположение`, {
				reply_markup: {
					keyboard: keyboard.cinemas
				}
			})
			break;
		case kb.back:
			bot.sendMessage(chatId, `${msg.from.first_name}, что хотите посмотреть?`, {
				reply_markup: {
					keyboard: keyboard.home
				}
			})
			break;
		default:
			break;
	}
	if (msg.location) {
		console.log(msg.location);
		getCinemasInCoord(chatId, msg.location)
	}

})


bot.onText(/\/start/, msg => {
	const text = `Здравствуйте, ${msg.from.first_name}\nВыберите команду для начала работы:`
	bot.sendMessage(helper.getChatId(msg), text, {
		reply_markup: {
			keyboard: keyboard.home,
		}
	});
})


bot.onText(/\/f(.+)/, (msg, [source, match]) => {
	const filmUuid = helper.getItemUuid(source);
	const chatId = helper.getChatId(msg);
	Film.findOne({ uuid: filmUuid }).then(film => {

		const caption = `Название: ${film.name}\nГод: ${film.year}\nРейтинг: ${film.rate}\nСтрана: ${film.country}`
		bot.sendPhoto(chatId, film.picture, {
			caption: caption,
			reply_markup: {
				inline_keyboard: [
					[
						{
							text: 'Добавить в избранное',
							callback_data: film.uuid
						},
						{
							text: 'Показать кинотеатры',
							callback_data: film.uuid
						}
					],
					[
						{
							text: `Кинопоиск ${film.name}`,
							url: film.link
						}

					]
				]
			}
		})
	})
})

//============================================

function getCinemasInCoord(chatId, location) {
	Cinema.find({}).then(cinemas => {
		const html = cinemas.map((c, i) => {
			return `<b>${i + 1}</b> ${c.name}. <em>Расстояние</em> - <strong>${1000}</strong>км. /c${c.uuid}`
		}).join('\n')
		sendHTML(chatId, html, 'home')
	})
}


function sendFilmsByQuery(chatId, query) {
	Film.find(query).then((films) => {
		// console.log(films);
		const html = films.map((f, i) => {
			return `<b>${i + 1}</b> ${f.name} - /f${f.uuid}`
		}).join('\n')

		sendHTML(chatId, html, 'films')

		// bot.sendMessage(chatId, html, {
		// 	parse_mode: 'HTML',
		// 	reply_markup: {
		// 		keyboard: keyboard.films
		// 	}
		// })
	})
}

function sendHTML(chatId, html, kbName = null) {
	const option = {
		parse_mode: 'HTML',
	}
	if (kbName) {
		option['reply_markup'] = {
			keyboard: keyboard[kbName]
		}
	}
	bot.sendMessage(chatId, html, option);
}



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


// bot.onText(/\/video/, msg => {
// 	bot.sendVideo(msg.chat.id, './other_file/video.mp4');
// })


// bot.onText(/\/video1/, msg => {
// 	bot.sendMessage(msg.chat.id, 'Начата загрузка видео');
// 	fs.readFile(`${__dirname}/other_file/video.mp4`, (err, video) => {
// 		bot.sendVideo(msg.chat.id, video, {
// 			caption: 'Super video format'
// 		}).then(() => {
// 			bot.sendMessage(msg.chat.id, 'Загрузка видео успешно завершена!');
// 		})
// 	})
// })


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

// console.log('Bot has been started....');