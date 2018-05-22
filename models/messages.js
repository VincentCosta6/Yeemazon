const mongoose = require('mongoose');

let messageSchema = mongoose.Schema({
	Users: [{
		type: String,
		required: true
	}],
	messages: [{
		type:String
	}],
	name: {
		type: String
	},
	creator: {
		type: String
	}
});

let messages = module.exports = mongoose.model('messages', messageSchema);
