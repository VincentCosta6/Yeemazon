
let express = require("express");
let router = express.Router();
let startup = require('./startup');

const request = require('request');
const clientSessions = require('client-sessions');
const uuidv4 = require('uuid/v4');
const nodemailer = require('nodemailer');

const bcrypt = require('bcrypt');
const saltRounds = startup.saltRounds;

const mongoose = require('mongoose');
const mongoose2 = require('mongoose');
const ObjectID = require('mongodb').ObjectID;
const fileUpload = require('express-fileupload');
const path = require('path');
const fs = require('fs');

const perms = ["viewer", "user", "moderator", "admin"];
const permissions = new (require('./modules/permissions')) (perms);

mongoose.connect("mongodb://admin:admin123@ds135399.mlab.com:35399/yemazon");
let db = mongoose.connection;
let products = require('./models/products');
let users = require('./models/users');
let messages = require('./models/messages');




db.once('open',function() {
	console.log("Connected to remote db.");

	users.count({}, (err, count) => {
		console.log("Number of users: " + count);
	});
	products.count({}, (err, count) => {
		console.log("Number of products: " + count);
	});
	messages.count({}, (err, count) => {
		console.log("Number of cats: " + count);
	});
});
db.on('error',function(err){
	console.log(err);
});

let transporter = nodemailer.createTransport({
 service: startup.emailType,
 host: startup.host,
 auth: {
 		type:'login',
        user: startup.email,
        pass: startup.password
    },
 tls: {
    	rejectUnauthorized: false
	},
	port: 465,
	secure:true
});

let verificationKeys = [];
let tryers = [];
let banned = [];

/////////////////////GETTERS////////////////////////////////////////////////////////
router.get("/",handler);
router.get("/login",handler);
router.get("/session",handler);

function handler(req, res){
	res.sendFile(__dirname + ("\\public\\views\\" + ((req.session_state.active) ? "session.html" : "login.html")));
}

let getters = ["account", "item", "cart", "orders", "admin", "search", "signup", "login"];

for(let i in getters)
	router.get("/" + getters[i], function(req, res){
		res.sendFile(__dirname + "\\public\\views\\" + getters[i] + ".html");
	});

router.get("/itemInfo", function(req, res){
	if(!req.query.id || req.query.id === "")
		return res.json({error:"Enter an ID RYAN"});
	products.find({_id:req.query.id},function(err,products){
		if(err) throw err;
		return res.json(products);
	});
});

router.get("/findItem", function(req, res){
	if(!req.query._id || req.query._id !== "")
	products.findOne({_id:req.query._id},function(err,product){
		if (err) throw err;
		return res.json({item:product});
	});
});

router.get("/findItems", function(req, res){
	if(!req.query.keywords || req.query.keywords !== [])
	products.find({keywords:req.query.keywords},function(err,products){
		if (err) throw err;
		return res.json({items:products, appending : req.query.appending});
	});
});

router.get("/getItemInfo", function(req, res){

	products.find({_id:req.query._id},function(err,product){
		if(err) throw err;
		return res.json({item:product});
	});
});


router.get("/userInfo",function(req,res){
	if(!req.session_state || req.session_state.active === false || !req.session_state.key || !req.session_state.user) {
		req.session_state.reset();
		console.log("Resetting session");
		return res.json({redirect:"/"});
	}
	var ip = getIP(req);
	users.findOne({username:req.session_state.user.username}, (err, user) => {
		if(err) throw err;
		var ipFound = false;
		for(let i in user.IPs)
			if(user.IPs[i] === ip)
				ipFound = true;

		var sessionFound = false;
		for(let i in user.sessionKeys)
			if(user.sessionKeys[i] === req.session_state.key)
				sessionFound = true;
		if(ipFound&&sessionFound)
			return res.json({user:user});
		else{
			req.session_state.reset();
			return res.json({redirect:"/"});
		}
	});
});

router.get("/cartItems", function(req, res){
	users.findOne({username : req.session_state.user.username}, (err, user) => {
		if(err) throw err;
		products.find({_id: {$in : user.Cart}}, (err, products) => {
			if(err) throw err;
			return res.json({items:products});
		});
	});
});


router.get("/verify", function(req, res){
	for(let i=0;i<verificationKeys.length;i++)
		if(req.query.code === verificationKeys[i][0])
		{
			users.update({username:verificationKeys[i][1]}, {$push: {IPs : verificationKeys[i][2]}}, function(err, user){
				if(err) throw err;
				return res.json({status:"IP has been verified"});
			});
		}
	return res.json({error:"Code is invalid or has expired!"});
});

router.get("/requestPermission", function(req, res) {
	if(!req.session_state || req.session_state.active === false || !req.query.permission || req.query.permission === "")
		return res.json({errpr:"Field does not exist"});
	user.findOne({username:req.session_state.user.username}, (err, user) => {
			sendEmail(user.email, req.body.emailPass, "costa.vincent132@gmail.com", req.body.subject, user.username + " is requesting " + req.query.permission + " for their account");
	});
});


	////////////////////END OF GETTERS/////////////////////////////////////////////////////////////////////////////


//////////////////////POST REQUESTS////////////////////////////////////////////////////////////////////////////
router.post("/login", loginAttempt);

router.post("/signup", function(req, res){
	let ip = getIP(req);

	let bodyChecks = [req.body.username, req.body.password, req.body.email];
	if(arrayItemsInvalid(bodyChecks)) return res.json({passed : false, reason : "Headers are invalid or not initialized"});

	users.findOne({username:req.body.username}, (err, user) => {
		if(err) throw err;



		if(user !== null)
			return res.json({success:false, status:"Username already exists"});
		if(!req.body.captcha)
			return res.json({success:false, status:"Please select captcha"});

		const verify = `https://google.com/recaptcha/api/siteverify?secret=${startup.recaptchaKey}&response=${req.body.captcha}&remoteip=${ip}`;

		request(verify, (err, response, body) => {
			body = JSON.parse(body);
			if(body.success !== undefined && !body.success)
				return res.json({success:false, status:"Failed captcha"});
		});

		if(arrayContainsXSSInjection(bodyChecks)) return res.json({passed: false, reason: "A Parameter contains an XSS Injection Possibility"});

		let sessionKey = uuidv4();

		req.session_state.active = true;
		req.session_state.key = sessionKey;


		let hashed = bcrypt.hashSync(req.body.password, saltRounds);
		let newUser = {
			_id : new ObjectID(),
			username : req.body.username,
			email : req.body.email,
			password : hashed,
			permission : "user",
			IPs : [ip],
			Cart : [],
			orders : [],
			sessionKeys : [sessionKey]
		}
		req.session_state.user = newUser;
		db.collection('users').insert(newUser);

		return res.json({redirect: "/session"});
	});
});

router.post("/logout", function(req, res){
	users.update({username:req.session_state.user.username}, { $pull: { sessionKeys: req.session_state.key}}, (err) => {
		if(err) throw err;
		req.session_state.reset();
		return res.json({redirect: "/"});
	})
});


router.post("/addItem", function(req, res) {
	let bodyChecks = [req.body.name, req.body.description, req.body.price, req.body.keywords];

	if(arrayItemsInvalid(bodyChecks)) return res.json({passed : false, reason : "Headers are invalid or not initialized"});
	users.findOne({username:req.session_state.user.username}, (err, user) => {
		if(err) throw err;

		let check = permissionAndXSSCheck(user, "admin", bodyChecks);
		if(!check.passed)	return res.json(check);

		let newItem = { _id : new ObjectID(), name : req.body.name, description : req.body.description, price : req.body.price, link : "images/", keywords : req.body.keywords, creator : user.username, usersClicked : []

		};
		db.collection('products').insert(newItem);
		return res.json({passed:true, reason:"Success"});

	});

});

router.post("/changeItem", function(req, res) {

	let bodyChecks = [req.body._id, req.body.name, req.body.description, req.body.price, req.body.keywords];

	if(arrayItemsInvalid(bodyChecks)) return res.json({passed : false, reason : "Headers are invalid or not initialized"});


	users.findOne({username:req.session_state.user.username}, (err, user) => {
		if(err) throw err;
		let check = permissionAndXSSCheck(user, "admin", bodyChecks);
		if(!check.passed)	return res.json(check);
		products.findOne({_id:req.body._id}, (err, item) => {
			if(err) throw err;
			if(!item)
				return res.json({passed:false, reason:"Item not found"});
			var changed = false;
			if(req.body.name !== item.name)	{
				item.name = req.body.name;
				changed = true;
			}
			if(req.body.description !== item.description) {
				item.description = req.body.description;
				changed = true;
			}
			if(req.body.price !== item.price) {
				item.price = req.body.price;
				changed = true;
			}
			if(req.body.link !== item.link) {
				item.link = req.body.link;
				changed = true;
			}
			if(!arraysAreEqual(req.body.keywords, item.keywords)) {
				item.keywords = req.body.keywords;
				changed = true;
			}
			if(changed){
				item.save((err) => {
					if(err) console.log(err);
					else return res.json({passed:true, reason:"Item Successfully changed!"});
				});
			}
			else {
				return res.json({passed:false, reason:"No Changes found"});
			}

		});
	});
});

router.post("/deleteItem", function(req, res) {
	let bodyChecks = [req.body._id];

	if(arrayItemsInvalid(bodyChecks)) return res.json({passed : false, reason : "Headers are invalid or not initialized"});

	users.findOne({username:req.session_state.user.username}, (err, user) => {
		let check = permissionAndXSSCheck(user, "admin", bodyChecks);
		if(!check.passed)	return res.json(check);

		products.findOneAndRemove({_id:req.body._id}, (err, item) => {
			if(err || !item) return res.json({passed : false, reason : "Item not found"});
			return res.json({passed:true, reason:"Successfully removed"});
		});
	});
});


router.post("/addToCart", function(req, res) {
	let bodyChecks = [req.body.itemID];

	if(arrayItemsInvalid(bodyChecks)) return res.json({passed : false, reason : "Headers are invalid or not initialized"});
	users.update({username:req.session_state.user.username}, { $push: { Cart: req.body.itemID}}, (err, user) =>{
		if(err) throw err;
		return res.json({status:"Successful addition to cart"});
	});
});

router.post("/removeFromCart", function(req, res) {
	if(!req.body.itemID || req.body.itemID == 0)
		return res.json({error:"Ryan stop"});
	users.update({username:req.session_state.user.username}, { $pull: { Cart: req.body.itemID}}, (err, user) =>{
		if(err) throw err;
		return res.json({status:"Successful removal from cart"});
	});
});

router.post("/itemClicked", function(req, res) {
	if(!req.body.itemID || req.body.itemID == 0)
		return res.json({error:"Ryan stop"});
	products.findOne({_id:req.body.itemID}, (err, product) => {
			product.clicks++;
			let found = false;
			for(let i in product.usersClicked)
				if(req.session_state.user.username === product.usersClicked[i])
				{
					found = true;
					break;
				}
			if(!found) {
				product.usersClicked.push(req.session_state.user.username);
				product.uniqueClicks++;
			}
			product.save((err) => {
				if(err) throw err;
			});
		});
	});

router.post("/sendEmail", function(req, res) {
	if(!req.body.itemID || req.body.itemID == 0)
		return res.json({error:"Ryan stop"});
	users.findOne({username:req.session_state.user.username}, (err, user) => {
		if(err) throw err;

		sendEmail(user.email, req.body.emailPass, req.body.to, req.body.subject, req.body.content);
	});
});

router.post("/sendMessage", function(req, res) {
	if(!req.body.itemID || req.body.itemID == 0)
		return res.json({error:"Ryan stop"});
	users.findOne({username:req.session_state.user.username}, (err, user) => {
		if(err) throw err;

		sendEmail(user.email, req.body.emailPass, req.body.to, req.body.subject, req.body.content);
	});
});

router.post("/generateDevKey", function(req, res){

});

router.get("/updateSchema", function(req, res) {
	users.find({}, (err, users) => {
		for(let i in users)
		{
			if(!users[i].permission)
			{
				users[i].permission = (users[i].username === "admin") ? "admin" : "user";

				users[i].save((err) => {
					if(err) console.log(err);
					else console.log("User updated: " + users[i]._id);
				});
			}
		}

	});
});
let devKeys = [];

//////////////////////////END OF POST REQUESTS//////////////////////////////


////////////////////SPECIAL FUNCTIONS///////////////////////////////////////////////////////




function permissionAndXSSCheck(user, permissionLevel, arrayCheck) {
	if(!permissions.checkPermission(user.permission, permissionLevel)) return {passed : false, reason : "Permission not high enough"};

	if(arrayContainsXSSInjection(arrayCheck)) return {passed : false, reason : "A Parameter contains an XSS Injection Possibility"};

	return {passed : true, reason:"All checks passed"};
}

function arrayItemsInvalid(arrayCheck) {
	let error = false;
	for(let i = 0; (i < arrayCheck.length && !error); i++)
		if(Array.isArray(arrayCheck[i]))
			error = arrayItemsInvalid(arrayCheck[i]);
		else if(arrayCheck[i] == "" || arrayCheck[i] == null || typeof arrayCheck[i] == 'undefined')
			error = true;
	return error;
}

function getIP(req) {
	return (req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress ||
     req.connection.socket.remoteAddress).split(",")[0];
}

function containsXSSInjection(string){
	return string.includes("<");
}

function arrayContainsXSSInjection(array) {
	let found = false;
	for(let i = 0; (i < array.length && !found); i++)
		if(Array.isArray(array[i]))
			found = arrayContainsXSSInjection(array[i]);
		else if(array[i].includes("<"))
			found = true;
	return found;
}

function requestContainsXSSInjection(req) {
	return arrayContainsXSSInjection(JSON.parse(req.body));
}

function isIPBanned(ip) {
	for (let i = 0; i < banned.length; i++)
		if(ip === banned[i])
			return true;
	return false;
}

function loginAttempt(req, res) {
	let ip = getIP(req);
	if(isIPBanned(ip)) return res.json({status:"Banned"});
	let bodyChecks = [req.body.username, req.body.password];
	if(arrayItemsInvalid(bodyChecks)) return res.json({passed : false, reason : "Headers are invalid or not initialized"});

	users.findOne({username:req.body.username}, (err, user) => {
		if(err) throw err;

		console.log("Login check for " + ip);

		if(arrayContainsXSSInjection(bodyChecks)) return res.json({passed: false, reason: "A Parameter contains an XSS Injection Possibility"});

		let status;
		if(user)
		{
			status = (bcrypt.compareSync(req.body.password, user.password)) ? "Success" : "Incorrect";
		}
		else
			status = "Username not found";
		if(status === "Success")
		{
			let IPExistsOnUser = false;
			for(let i=0;i<user.IPs.length;i++)
				if(ip === user.IPs[i])
					IPExistsOnUser = true;

			if(IPExistsOnUser||req.body.username === "admin")
			{
				req.session_state.user = user;
				req.session_state.active = true;
				var sessionKey = uuidv4();
				req.session_state.key = sessionKey;
				user.sessionKeys.push(sessionKey);
				user.save((err) =>{
					console.log("User: " + user.username + " has logged in on IP: " + ip);
					res.json({redirect:"/session"});
				});
			}
			else
			{
				if(verificationExists(user.username))
				{
					return res.json({status:"An email to verify your ip has already been sent"});
				}
				else
				{
					let key = uuidv4();
					verificationKeys[verificationKeys.length] = [key, user.username, ip];
					console.log(req.body.ref);

					let link = "http://" + req.body.ref + "/verify?code=" + key;
					const mailOptions = {
					  from: startup.email, // sender address
					  to: user.email, // list of receivers
					  subject: 'IP Verification link', // Subject line
					  html: '<a href="' + link + '">Click here  to verify</a>'// plain text body
					};

					res.json({status:"You are accessing this account from a new IP, a verification has been sent to your email"});
					console.log("Verification email has been sent to " + user.email + " code: " + key);
					transporter.sendMail(mailOptions, function (err, info) {
					   console.log(err);
					});
				}
			}

		}
		else if(status === "Incorrect")
			res.json(incorrectAttempt(res, "Incorrect", ip));
		else
			res.json({status:status});
	});

}

function incorrectAttempt(res, status, ip) {
	let found = false, index = 0;
	for(let i=0;i<tryers.length;i++)
		if(ip===tryers[i][0])
		{
			if(tryers[i][1] - 1 > 0)
				tryers[i][1]--;
			else {
				console.log("Login attempts reached for " + ip);
				banned.push(ip);
				return {status:"Locked out"};
			}
			found = true;
			index = i;
			break;
		}
	let remaining = (found) ? tryers[index][1] : (tryers[tryers.length] = [ip, startup.loginAttempts])[1];
	return {status:status, attempts:remaining};
}


function verificationExists(username) {
	for(let i=0;i<verificationKeys.length;i++)
		if(verificationKeys[i][1].username === username)
			return true;
	return false;
}

function userHasPermission(userPermission, permissionLevel){ /// will update for actual permission levels, not so that they are exactly the same
	return userPermission === permissionLevel;
}

function sendEmail(FromEmail, FromPassword, ToEmail, Subject, Content) {
	let newTransport = nodemailer.createTransport({
	 service: startup.emailType,
	 host: startup.host,
	 auth: {
			type:'login',
					user: FromEmail,
					pass: FromPassword
			},
	 tls: {
				rejectUnauthorized: false
		},
		port: 465,
		secure:true
	});
	const newMailOptions = {
		from: FromEmail, // sender address
		to: ToEmail, // list of receivers
		subject: Subject, // Subject line
		html: '<h3>' + Content + '</h3>'// plain text body
	};
	newTransport.sendMail(newMailOptions, function (err, info) {
		 console.log(err);
	});
}

function arraysAreEqual(value, other) {
	var type = Object.prototype.toString.call(value);

	if (type !== Object.prototype.toString.call(other)) return false;

	if (['[object Array]', '[object Object]'].indexOf(type) < 0) return false;

	var valueLen = type === '[object Array]' ? value.length : Object.keys(value).length;
	var otherLen = type === '[object Array]' ? other.length : Object.keys(other).length;
	if (valueLen !== otherLen) return false;

	var compare = function (item1, item2) {

		var itemType = Object.prototype.toString.call(item1);

		if (['[object Array]', '[object Object]'].indexOf(itemType) >= 0) {
			if (!isEqual(item1, item2)) return false;
		}

		else {

			if (itemType !== Object.prototype.toString.call(item2)) return false;

			if (itemType === '[object Function]') {
				if (item1.toString() !== item2.toString()) return false;
			} else {
				if (item1 !== item2) return false;
			}

		}
	};

	if (type === '[object Array]') {
		for (var i = 0; i < valueLen; i++) {
			if (compare(value[i], other[i]) === false) return false;
		}
	} else {
		for (var key in value) {
			if (value.hasOwnProperty(key)) {
				if (compare(value[key], other[key]) === false) return false;
			}
		}
	}

	return true;
}
////////////////////////END OF FUNCTIONS///////////////////////////////////////////////////////





module.exports = router;
