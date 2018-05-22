
let express = require("express");
let router = express.Router();
let startup = require("./startup");

const request = require("request");
const clientSessions = require("client-sessions");
const uuidv4 = require("uuid/v4");
const nodemailer = require("nodemailer");

const bcrypt = require("bcrypt");
const saltRounds = startup.saltRounds;


const mongoose = require("mongoose");
const ObjectID = require("mongodb").ObjectID;
const validd = require("mongoose").Types.ObjectId;
var path = require("path");
var fs = require("fs");

let formidable = require("formidable");

const perms = ["viewer", "user", "moderator", "admin"];
const permissions = new (require("./modules/permissions")) (perms);

let uri = "mongodb://admin:admin123@ds135399.mlab.com:35399/yemazon";
let options = {
  autoIndex: false,
  reconnectTries: Number.MAX_VALUE,
  reconnectInterval: 10000,
  poolSize: 35,
  bufferMaxEntries: 0,
	keepAlive: Number.MAX_VALUE
};
mongoose.connect(uri, options);
let db = mongoose.connection;
let products = require("./models/products");
let users = require("./models/users");
let messages = require("./models/messages");

let version = require("./keyVersion").version;

db.once("open",function() {
	console.log("Connected to remote db.");

	users.count({}, (err, count) => {
		console.log("Number of users: " + count);
	});
	products.count({}, (err, count) => {
		console.log("Number of products: " + count);
	});
	messages.count({}, (err, count) => {
		console.log("Number of chats: " + count);
	});
});
db.on("error",function(err){
	console.log(err);
});

let transporter = nodemailer.createTransport({
 service: startup.emailType,
 host: startup.host,
 auth: {
 		type:"login",
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
let requests = [];






router.use(function (req, res, next) {
	var found = false;
	for(let i in banned)
		if(banned[i] == getIP(req))
		{
			found = true;
			break;
		}
	if(found)
		return res.json({status: "You are banned"});
	else
		next();
});


//////////////////////////LOGIN SIGNUP STUFF///////////////////////////




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
		req.session_state.version = version;
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
		db.collection("users").insert(newUser);
		messages.update({name: "Global Lobby"}, {$push: {Users: req.body.username, messages: req.body.username + " has joined Yeemazon"}}, (err, use) => {
			if(err) throw err;
		});
		return res.json({redirect: "/session"});
	});
});




////////////////////////END OF LOGIN SIGNUP STUFF//////////////////////////////////////////////

/////////////////////GETTERS////////////////////////////////////////////////////////
router.get("/",handler);
router.get("/login",handler);
router.get("/session",handler);

function handler(req, res){
	res.sendFile(__dirname + ("\\public\\views\\" + ((req.session_state.active) ? "session.html" : "login.html")));
}

let getters = ["account", "item", "cart", "orders", "admin", "search", "signup", "lobby", "lobbyFinder", "itemCRUD"];

for(let i in getters)
	router.get("/" + getters[i], function(req, res){
		res.sendFile(__dirname + "\\public\\views\\" + getters[i] + ".html");
	});


	router.get("/userInfo",function(req,res) {
		if(!req.session_state || req.session_state.active === false || !req.session_state.key || !req.session_state.user || !req.session_state.user.username || req.session_state.version != version) {
			req.session_state.reset();
			console.log("Resetting session");
			return res.json({redirect: "/"})
		}
		var ip = getIP(req);
		users.findOne({username:req.session_state.user.username}, (err, user) => {
			if(err) throw err;
			var ipFound = false;
			for(let i in user.IPs)
				if(user.IPs[i] === ip) {
					ipFound = true;
					break;
				}

			var sessionFound = false;
			for(let i in user.sessionKeys)
				if(user.sessionKeys[i] === req.session_state.key)
					sessionFound = true;
			if(ipFound&&sessionFound)
				return res.json({user:user});
			else{
				req.session_state.reset();
				return res.json({redirect: "/"})
			}
		});
	});

router.use(function(req, res, next) {
	if(!req.session_state || req.session_state.active === false || !req.session_state.key || !req.session_state.user || !req.session_state.user.username || req.session_state.version != version) {
		req.session_state.reset();
		console.log("Invalid session request");
		return res.redirect("/login");
	}
	next();
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
	if(!validd.isValid(req.query._id)) return res.json({failed: "Not found"});
	products.findOne({_id:req.query._id},function(err,product){
		if (err) throw err;
		if(!product) return res.json({failed: "Not found"});
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

router.get("/allItems", function(req, res){
	products.find({},function(err,products){
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
	let bodyChecks = [req.query.permissionLevel];
	if(arrayItemsInvalid(bodyChecks)) return res.json({passed : false, reason : "Headers are invalid or not initialized"});

	let found = false;
	for(let i in perms)
		if(req.query.permissionLevel == perms[i])
		{
			found = true;
			break;
		}
	if(!found) return res.json({passed: false, reason: "Permission does not exist"});

	let key1 = uuidv4(), key2 = uuidv4();
	let target = "admin";
	let newMessage = {
		Users: [target],
		messages: ["<label permission = \"" + key1 + "\" style = \"cursor:pointer;\"> Click this to grant " + req.session_state.user.username + " " + req.query.permissionLevel + " permissions",
							 "<label permission = \"" + key2 + "\" style = \"cursor:pointer;\"> Click this to reject " + req.session_state.user.username + " " + req.query.permissionLevel + " permissions"],
		name: req.session_state.user.username + " is requesting " + req.query.permissionLevel + " permissions",
		creator: req.session_state.user.username
	};
	db.collection("messages").insert(newMessage);
	requests.push({key: key1, username: req.session_state.user.username, permission: req.query.permissionLevel, answer: true});
	requests.push({key: key2, username: req.session_state.user.username, permission: req.session_state.user.permission, answer: false});
	return res.json({passed: true, reason: "Requested " + req.query.permissionLevel + " to " + target});
});

router.get("/messageLength", function(req, res) {
	let bodyChecks = [req.query._id];
	if(arrayItemsInvalid(bodyChecks)) return res.json({passed : false, reason : "Headers are invalid or not initialized"});

	messages.findOne({_id: req.query._id}, (err, lobby) => {
		if(err) throw err;
		if(!lobby) return res.json({passed: false, reason:"Couldnt find lobby, it might have been deleted"});
		return res.json({length: lobby.messages.length});
	});
});

router.get("/messageChange", function(req, res) {
	let bodyChecks = [req.query._id, req.query.length];
	if(arrayItemsInvalid(bodyChecks)) return res.json({passed : false, reason : "Headers are invalid or not initialized"});

	messages.findOne({_id: req.query._id}, (err, lobby) => {
		if(err) throw err;
		if(!lobby) return res.json({passed: false, reason:"Couldnt find lobby, it might have been deleted"});

		let found = false;
		for(let i in lobby.Users)
			if(lobby.Users[i] === req.session_state.user.username)
				found = true;
		if(!found) return res.json({passed: false, reason: "You are not in this lobby"});

		if(req.query.length == lobby.messages.length)
			return res.json({upToDate:true});

		let start = parseInt(req.query.length);
		let length = (lobby.messages.length - parseInt(req.query.length)) + start;
		let ret = [];
		for(let i=start; i<length; i++) {
			ret.push(lobby.messages[i]);
		}
		return res.json({upToDate: false, messages: ret});
	});
});

router.get("/messages", function(req, res) {
	let bodyChecks = [req.query._id, req.query.length, req.query.start];
	if(arrayItemsInvalid(bodyChecks)) return res.json({passed : false, reason : "Headers are invalid or not initialized"});

	messages.findOne({_id: req.query._id}, (err, lobby) => {
		if(err) throw err;
		if(!lobby) return res.json({status:"Couldnt find lobby, it might have been deleted"});
		let found = false;
		for(let i in lobby.Users)
			if(lobby.Users[i] === req.session_state.user.username)
				found = true;
		if(!found) return res.json({passed: false, reason: "You are not in this lobby"});

		let ret = [];
		for(let i=req.query.start; i<(parseInt(req.query.length) + parseInt(req.query.start)); i++) {
			ret.push(lobby.messages[i]);
		}
		return res.json({messages: ret});
	});
});

router.get("/myLobbies", (req, res) => {
	messages.find({Users:req.session_state.user.username}, (err, lobbies) => {
		if(err) throw err;

		return res.json({lobbies: lobbies});
	});
});

router.get("/lobbyChange", function(req, res) {
	let bodyChecks = [req.query.length];
	if(arrayItemsInvalid(bodyChecks)) return res.json({passed : false, reason : "Headers are invalid or not initialized"});

	messages.find({Users: req.session_state.user.username}, (err, lobbies) => {
		if(err) throw err;
		if(!lobbies) return res.json({status:"Couldnt find any lobbies, you arent in any"});

		let ret = [];
		for(let i in lobbies)
			ret.push({_id: lobbies[i]._id, name: lobbies[i].name, length: lobbies[i].messages.length});

		if(req.query.length != lobbies.length)
			return res.json({upToDate: false, lobbies: ret});
		else
			return res.json({upToDate:true});
	});
});

router.get("/permissions", function(req, res) {
	return res.json({permissions: perms});
});

router.get("/picLink", function(req, res) {
	products.findOne({_id: req.query._id}, (err, product) => {
		if(err) throw err;
		if(!product) return res.json({passed: false, reason: "Could not find item"});
		return res.json({link: product.link});
	});
});

router.get("/myOrders", function(req, res) {
	users.findOne({username: req.session_state.user.username}, (err, user) => {
		if(err) throw err;
		return res.json({string: user.orders});
	});
});


	////////////////////END OF GETTERS/////////////////////////////////////////////////////////////////////////////


//////////////////////POST REQUESTS////////////////////////////////////////////////////////////////////////////


router.post("/logout", function(req, res){
	users.update({username:req.session_state.user.username}, { $pull: { sessionKeys: req.session_state.key}}, (err) => {
		if(err) throw err;
		req.session_state.reset();
		return res.json({redirect: "/"});
	})
});

router.post("/fileUpload", function (req, res) {
	if(!req.files.sample) return res.json({passed: false, reason: "You did not upload a file"});
	let link = uuidv4();
	let extend = req.files.sample.name.split(".")[1];
	req.files.sample.mv(__dirname + "\\public\\images\\" + link + "." + extend, (err) => {
		if(err) throw err;
		else {
			console.log("Upload");
			return res.json({passed: true, reason: "File Uploaded", link: (link + "." + extend)});
		}
	});
});

router.post("/addItem", function(req, res) {
	let bodyChecks = [req.body.name, req.body.description, req.body.price, req.body.keywords, req.body.picName];

	if(arrayItemsInvalid(bodyChecks)) return res.json({passed : false, reason : "Headers are invalid or not initialized"});

	users.findOne({username:req.session_state.user.username}, (err, user) => {
		if(err) throw err;

		let check = permissionAndXSSCheck(user, "user", bodyChecks);
		if(!check.passed)	return res.json(check);

		let newItem = { _id : new ObjectID(), name : req.body.name, description : req.body.description, price : req.body.price, link : "images/" + req.body.picName, keywords : req.body.keywords, creator : user.username, usersClicked : []

		};
		db.collection("products").insert(newItem);
		return res.json({passed:true, reason:"Success"});

	});

});

router.post("/changeItem", function(req, res) {

	let bodyChecks = [req.body._id, req.body.name, req.body.description, req.body.price, req.body.keywords, req.body.link];
	if(req.body.keywords[req.body.keywords.length - 1] == "")
		req.body.keywords.splice(req.body.keywords.length - 1, 1);
	if(arrayItemsInvalid(bodyChecks)) return res.json({passed : false, reason : "Headers are invalid or not initialized"});

	products.findOne({_id:req.body._id}, (err, item) => {
		if(err) throw err;
		if(!item)
			return res.json({passed:false, reason:"Item not found"});
		if(item.creator == req.session_state.user.username || permissions.checkPermission(req.session_state.user.permission, "moderator"))
		{
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
				item.link = "images/" + req.body.link;
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
		}
		else {
			return res.json({passed: false, reason: "You are not the creator of this item or you are not a moderator"});
		}
	});
});

router.post("/deleteItem", function(req, res) {
	let bodyChecks = [req.body._id];

	if(arrayItemsInvalid(bodyChecks)) return res.json({passed : false, reason : "Headers are invalid or not initialized"});

	products.findOne({_id:req.body._id}, (err, item) => {
		if(item.creator == req.session_state.user.username || permissions.checkPermission(req.session_state.user.permission, "moderator"))
		{
			products.remove({_id: req.body._id}, (err, prod) => {
				if(err) throw err;
				if(!prod) return res.json({passed: false, reason: "Couldnt find this item"});
				return res.json({passed: false, reason: "Item deleted"});
			});
		}
		else {
			return res.json({passed: false, reason: "You are not the creator of this item or you are not a moderator"});
		}

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
				return res.json({status: "Done"});
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

	if(!req.session_state.user) return res.json({status: "Howd you get here with an invalid key"});

	users.findOne({username:req.session_state.user.username}, (err, user) => {
			if(err) throw err;
			if(!user) return res.json({status:"You are not logged in"});

			if(req.body.messageSent)
			{
				let bodyChecks = [req.body.messageSent, req.body._id, req.body.message];
				if(arrayItemsInvalid(bodyChecks)) return res.json({passed : false, reason : "Headers are invalid or not initialized"});

				let result = possibleXSSInArray(bodyChecks);
				if(!result.passed) return res.json(result);

				let toSend = req.session_state.user.username + ":" + req.body.message;
				messages.update({_id:req.body._id}, {$push: {messages : toSend}}, function(err, lobby) {
					if(err) throw err;
					return res.json({passed:true, reason:"Delivered"});
				});
			}
			else if(req.body.inviteUser)
			{
				let bodyChecks = [req.body.inviteUser, req.body._id, req.body.invitee];
				if(arrayItemsInvalid(bodyChecks)) return res.json({passed : false, reason : "Headers are invalid or not initialized"});

				let result = possibleXSSInArray(bodyChecks);
				if(!result.passed) return res.json(result);

				var str = req.session_state.user.username + ":invited " + req.body.invitee;
				messages.update({_id:req.body._id}, {$push: {Users: req.body.invitee, messages: str}}, function(err, lobby){
					if(err) throw err;
					if(!lobby) res.json({passed:false, reason: "Lobby not found"});

					return res.json({passed:true, reason: "Invited"});
				});
			}
			else if(req.body.newLobby)
			{
				let bodyChecks = [req.body.newLobby, req.body.users, req.body.name];
				if(arrayItemsInvalid(bodyChecks)) return res.json({passed : false, reason : "Headers are invalid or not initialized"});

				let result = possibleXSSInArray(bodyChecks);
				if(!result.passed) return res.json(result);

				let list = req.body.users;
				let messages = [req.session_state.user.username + " has started a lobby"];
				let name = req.body.name;
				if(name == "Global Lobby") return res.json({passed: false, reason: "You arent allowed to name the lobby this"});

				let newLobby = {
					Users: list,
					messages : messages,
					name: name,
					creator: req.session_state.user.username
				};
				db.collection("messages").insert(newLobby);
				return res.json({passed: true, reason: "Lobby created with " + (req.body.users.length - 1) + " others"});
			}
			else if(req.body.removeLobby)
			{
				let bodyChecks = [req.body.removeLobby, req.body._id];
				if(arrayItemsInvalid(bodyChecks)) return res.json({passed : false, reason : "Headers are invalid or not initialized"});
				messages.findOne({_id: req.body._id}, (err, lobby) => {
					if(err) throw err;
					if(lobby.name == "Global Lobby") return res.json({passed: false, reason: "You arent allowed to delete the global lobby"});

					var found = false;
					for(let i in lobby.Users)
						if(req.session_state.user.username === lobby.Users[i])
							found = true;
					if(!found) return res.json({passed: false, reason: "You are not in this lobby"});
					if(lobby.creator == req.session_state.user.username || permissions.checkPermission(req.session_state.user.permission, "admin"))
					{
						messages.deleteOne({_id: req.body._id}, (err, lobby) => {
							if(err) throw err;

							return res.json({passed: true, reason: "Deleted lobby"});
						});
					}
					else
						return res.json({passed: false, reason: "You must be the creator of this lobby or an admin"});
				})

			}
			else if(req.body.leaveLobby)
			{
				let bodyChecks = [req.body.leaveLobby, req.body._id];
				if(arrayItemsInvalid(bodyChecks)) return res.json({passed : false, reason : "Headers are invalid or not initialized"});

				let str = req.session_state.user.username + " has left the lobby";
				messages.findOne({_id:req.body._id}, (err, lobby) => {
					if(lobby.name == "Global Lobby") return res.json({passed: false, reason: "You arent allowed to leave the global lobby"});

					if(lobby.Users.length == 1)
					{
						messages.deleteOne({_id: lobby._id}, (err, lobby) => {
							if(err) throw err;
							return res.json({passed: true, reason: "Deleted lobby"});
						});
					}
					else
					{
						messages.update({_id: req.body._id}, {$pull: {Users: req.session_state.user.username}}, (err, lobby) => {
							messages.update({_id: req.body._id}, {$push: {messages: str}}, (err, lobby) => {
								if(err) throw err;
								return res.json({passed: true, reason: "Left lobby"});
							});
						});
					}
				});
			}
		});
	});

router.post("/updatePermission", function(req, res) {
	let found = false;
	for(let i in requests)
		if(requests[i].key == req.body.key)
		{
			found = true;
			if(requests[i].answer == true) {
				if(permissions.checkPermission(req.session_state.user.permission, "admin"))
				{
					users.update({username: requests[i].username}, {$set: {permission: requests[i].permission}}, (err, user) => {
						if(err) throw err;
						return res.json({passed: true, reason: "Permission upgraded"});
					});
				}
				else
					return res.json({passed: false, reason: "You cannot grant permissions"});
			}
			else {
				let newMessage = {
					Users: [requests[i].username],
					messages: [req.session_state.user.username + " has rejected your promotion"],
					name: req.session_state.user.username + " has rejected your promotion",
					creator: requests[i].username
				};
				db.collection("messages").insert(newMessage);
				return res.json({passed: true, reason: "Rejected upgrade"});
			}
		}
	if(!found) return res.json({passed: false, reason: "Key not found"});
});

router.post("/orderItems", function(req, res){
	let bodyChecks = [req.body.itemIDs, req.body.orderAmounts];
	if(arrayItemsInvalid(bodyChecks)) return res.json({passed : false, reason : "Headers are invalid or not initialized"});

	products.find({_id:req.body.itemIDs}, (err, products) => {
		if(err) throw err;
		let str = "";
		for(let i in products) {
			products[i].numOrders += parseInt(req.body.orderAmounts[i]);
			str += parseInt(req.body.orderAmounts[i]) + ":" + products[i]._id + ",";
			products[i].save((err) => {
				if(err) throw err;
			});
		}
		str += "/";
		users.update({username: req.session_state.user.username}, {$set: {Cart: []}}, (err, user) => {
			if(err) throw err;
			users.update({username: req.session_state.user.username}, {$push: {orders: str}}, (err, user) => {
				if(err) throw err;
				return res.json({passed: true, reason: "Items ordered"});
			});
		});
	});
});

router.get("/updateSchema", function(req, res) {
	users.find({}, (err, users) => {
		let names = [];
		for(let i in users)
			names.push(users[i].username);
		let newLobby = {
			Users: names,
			messages : ["Global lobby started"],
			name: "Global Lobby",
			creator: "admin"
		};
		db.collection("messages").insert(newLobby);
	});

});

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
		else if(arrayCheck[i] == "" || arrayCheck[i] == null || typeof arrayCheck[i] == "undefined")
			error = true;
	return error;
}

function getIP(req) {
	return (req.headers["x-forwarded-for"] || req.connection.remoteAddress || req.socket.remoteAddress ||
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
function possibleXSSInArray(array)
{
	return (arrayContainsXSSInjection(array)) ? {passed: false, reason: "Possible XSS Injection found"} : {passed: true};
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

	let result = possibleXSSInArray(bodyChecks);
	if(!result.passed) return res.json(result);

	users.findOne({username:req.body.username}, (err, user) => {
		if(err) throw err;

		console.log("Login check for " + ip);

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
				req.session_state.version = version;
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
					  subject: "IP Verification link", // Subject line
					  html: "<a href=\"" + link + "\">Click here  to verify</a>"// plain text body
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

function sendEmail(FromEmail, FromPassword, ToEmail, Subject, Content) {
	let newTransport = nodemailer.createTransport({
	 service: startup.emailType,
	 host: startup.host,
	 auth: {
			type:"login",
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
		html: "<h3>" + Content + "</h3>"// plain text body
	};
	newTransport.sendMail(newMailOptions, function (err, info) {
		 console.log(err);
	});
}

function arraysAreEqual(value, other) {
	var type = Object.prototype.toString.call(value);

	if (type !== Object.prototype.toString.call(other)) return false;

	if (["[object Array]", "[object Object]"].indexOf(type) < 0) return false;

	var valueLen = type === "[object Array]" ? value.length : Object.keys(value).length;
	var otherLen = type === "[object Array]" ? other.length : Object.keys(other).length;
	if (valueLen !== otherLen) return false;

	var compare = function (item1, item2) {

		var itemType = Object.prototype.toString.call(item1);

		if (["[object Array]", "[object Object]"].indexOf(itemType) >= 0) {
			if (!isEqual(item1, item2)) return false;
		}

		else {

			if (itemType !== Object.prototype.toString.call(item2)) return false;

			if (itemType === "[object Function]") {
				if (item1.toString() !== item2.toString()) return false;
			} else {
				if (item1 !== item2) return false;
			}

		}
	};

	if (type === "[object Array]") {
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
