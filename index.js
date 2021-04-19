require('dotenv').config();
const database = require('./database.json');
const helper = require('./helper');
const kb = require('./keyboard-buttons');
const keyboard = require('./keyboard');
const geolib = require('geolib');
const _ = require('lodash');
const fs = require('fs');
const mongoose = require('mongoose');
const TelegramBot = require('node-telegram-bot-api');
const { getChatId } = require('./helper');
const { films } = require('./keyboard');
const TOKEN = process.env.API_TOKEN;
const mongoDB = 'mongodb://localhost/cinemadb';

helper.logStart();


const ACTION_TYPE = {
	TOGGLE_FAV_FILM: 'tff',
	SHOW_CINEMAS: 'sc',
	SHOW_CINEMAS_MAP: 'scm',
	SHOW_FILMS: 'sf'
}

mongoose.Promise = global.Promise
mongoose.connect(mongoDB, {
	useUnifiedTopology: true,
	useNewUrlParser: true
}).then(() => {
	console.log('MongoDB connected');
}).catch((err) => {
	console.log(err);
})

require('./models/film.model')
require('./models/cinema.model')
require('./models/user.model')

const Film = mongoose.model('films')
const Cinema = mongoose.model('cinemas')
const User = mongoose.model('users')

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
			showFavouriteFilms(chatId, msg.from.id)
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
		// console.log(msg.location);
		getCinemasInCoord(chatId, msg.location)
	}

})


bot.on('callback_query', query => {
	const userId = query.from.id;
	let data;
	try {
		data = JSON.parse(query.data)
	} catch (e) {
		throw new Error('Data is not an object')
	}

	// console.log(query);

	const { type } = data;

	switch (type) {
		case ACTION_TYPE.SHOW_CINEMAS_MAP:
			const { lat, lon } = data
			bot.sendLocation(query.message.chat.id, lat, lon)
			break;
		case ACTION_TYPE.SHOW_FILMS:
			showFilmsByQuery(userId, data)
			break;
		case ACTION_TYPE.SHOW_CINEMAS:
			showCinemasByQuery(userId, data)
			// console.log(query);
			break;
		case ACTION_TYPE.TOGGLE_FAV_FILM:
			toggleFavouriteFilm(userId, query.id, data)
			break;
		default:
			break;
	}

})

bot.on('inline_query', query => {
	Film.find({}).then(films => {
		const results = films.map((f, i) => {
			const caption = `Название: ${f.name}\nГод: ${f.year}\nРейтинг: ${f.rate}\nСтрана: ${f.country}`
			return {
				id: f.uuid,
				type: 'photo',
				photo_url: f.picture,
				thumb_url: f.picture,
				caption: caption,
				reply_markup: {
					inline_keyboard: [
						[
							{
								text: `Кинопоиск: ${f.name}`,
								url: f.link
							}
						]
					]
				}
			}
		})
		bot.answerInlineQuery(query.id, results, {
			cache_time: 0
		})
	})
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


	Promise.all([
		Film.findOne({ uuid: filmUuid }), User.findOne({ telegramId: msg.from.id })
	])
		.then(([film, user]) => {

			let isFav = false;
			if (user) {
				isFav = user.films.indexOf(film.uuid) !== -1
			}

			const favText = isFav ? 'Удалить из избранного' : 'Добавить в избранное'

			const caption = `Название: ${film.name}\nГод: ${film.year}\nРейтинг: ${film.rate}\nСтрана: ${film.country}`
			bot.sendPhoto(chatId, film.picture, {
				caption: caption,
				reply_markup: {
					inline_keyboard: [
						[
							{
								text: favText,
								callback_data: JSON.stringify({
									type: ACTION_TYPE.TOGGLE_FAV_FILM,
									filmUuid: film.uuid,
									isFav: isFav
								})
							},
							{
								text: 'Показать кинотеатры',
								callback_data: JSON.stringify({
									type: ACTION_TYPE.SHOW_CINEMAS,
									cinemasUuid: film.cinemas
								})
							}
						],
						[
							{
								text: `Кинопоиск`,
								url: film.link
							}

						]
					]
				}
			})
		})
})


bot.onText(/\/c(.+)/, (msg, [source, match]) => {
	const cinemaUuid = helper.getItemUuid(source);
	const chatId = helper.getChatId(msg)

	Cinema.findOne({ uuid: cinemaUuid }).then(cinema => {

		// console.log(a);
		bot.sendMessage(chatId, `Кинотеатр: ${cinema.name}`, {
			reply_markup: {
				inline_keyboard: [
					[
						{
							text: `Официальный сайт`,
							url: cinema.url
						},
						{
							text: 'Показать на карте',
							callback_data: JSON.stringify({
								type: ACTION_TYPE.SHOW_CINEMAS_MAP,
								lat: cinema.location.latitude,
								lon: cinema.location.longitude
							})
						}
					],
					[
						{
							text: 'Показать фильмы',
							callback_data: JSON.stringify({
								type: ACTION_TYPE.SHOW_FILMS,
								filmUuids: cinema.films
							})
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

		cinemas.forEach(c => {
			c.distance = geolib.getDistance(location, c.location) / 1000;
		})

		cinemas = _.sortBy(cinemas, 'distance');

		const html = cinemas.map((c, i) => {
			return `<b>${i + 1}</b> ${c.name}. <em>Расстояние</em> - <strong>${c.distance}</strong>км. /c${c.uuid}`
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

function toggleFavouriteFilm(userId, queryId, { filmUuid, isFav }) {

	let userPromise

	User.findOne({ telegramId: userId })
		.then(user => {
			if (user) {
				if (isFav) {
					user.films = user.films.filter(fUuid => fUuid !== filmUuid)
				} else {
					user.films.push(filmUuid)
				}
				userPromise = user
			} else {
				userPromise = new User({
					telegramId: userId,
					films: [filmUuid]
				})
			}

			const answerText = isFav ? 'Удалено' : 'Добавлено'

			userPromise.save().then(_ => {
				bot.answerCallbackQuery(queryId, { text: answerText })
			}).catch(err => console.log(err))
		}).catch(err => console.log(err))
}

function showFavouriteFilms(chatId, telegramId) {
	let html = 'Вы пока ничего не добавили в избранное!'
	User.findOne({ telegramId }).then(user => {
		if (user) {
			// console.log(user);
			Film.find({ uuid: { '$in': user.films } }).then(films => {
				if (films.length) {
					// console.log(films);
					html = films.map((f, i) => {
						return `<b>${i + 1}</b>. ${f.name} - ${f.rate} (/f${f.uuid})`
					}).join('\n')
				}
				sendHTML(chatId, html, 'home');
			})
		}

	})
}

function showCinemasByQuery(chatId, { cinemasUuid }) {
	// console.log(cinemasUuid);
	let html
	Cinema.find({ uuid: { '$in': cinemasUuid } }).then(cinemas => {
		html = cinemas.map((c, i) => {
			return `<b>${i + 1}</b>. ${c.name} - (/c${c.uuid})`
		}).join('\n')
		sendHTML(chatId, `Кинотеатры, где показывают фильмы:\n${html}`, 'fome')
	})
}

function showFilmsByQuery(userId, { filmUuids }) {
	let html
	Film.find({ uuid: { '$in': filmUuids } }).then(films => {
		html = films.map((f, i) => {
			return `${i + 1}. ${f.name}`
		}).join('\n')
		sendHTML(userId, `Фильмы, которые показывают в кинотеатре: \n${html}`, 'home')
	})
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