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
    require: true
  }],
  clicks: {
    type: Number,
    default: 0,
    require: true
  },
  usersClicked: [{
    type: String,
    require: true
  }],
  numOrders: {
    type: Number,
    default: 0
  },
  creator: {
    type: String,
    required: true
  }
});

let products = module.exports = mongoose.model('products', productSchema);
