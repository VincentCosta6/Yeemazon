const mongoose = require('mongoose');

let productSchema = mongoose.Schema({
	name: {
		type: String,
		require: true
	},
	description: {
		type: String,
		require: true
	},
	price: {
		type: String,
		require: true
	},
	link: {
		type: String,
		require: true
	},
	keywords: [{
		type: String,
		require : true
	}],
	clicks : { 
		type : Number,
		require : true
	},
	usersClicked : [{
		type : String,
		require : true
	}],
	numOrders : {
		type : Number
	},
	creator : {
		type : String
	}
});

let products = module.exports = mongoose.model('products',productSchema);
