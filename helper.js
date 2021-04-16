// function debugText(obj = {}) {
// 	return JSON.stringify(obj, null, 4);
// }

// module.exports = debugText;

module.exports = {
	logStart() {
		console.log('Bot has been start....');
	},

	getChatId(msg) {
		return msg.chat.id;
	},

	getItemUuid(source) {
		return source.substr(2, source.length);
	}
}
