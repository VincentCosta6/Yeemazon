
var express = require("express");
var router = express.Router();

const request = require('request');
var clientSessions = require('client-sessions');
const uuidv4 = require('uuid/v4');

router.get("/",handler);
router.get("/login",handler);
router.get("/session",handler);

function handler(req, res)
{
	res.sendFile(__dirname + ("\\public\\views\\" + ((req.session_state.active) ? "session.html" : "login.html")));
}

router.get("/signup",function(req,res){
	res.sendFile(__dirname + "/public/views/signup.html");
});

var UserData = new (require("./userData")) ("admin", "costa.vincent132@gmail.com", "password");
var loggers = [];
var verificationKeys = [];

var items = null/*new (require("./itemMod"))()*/;

router.get("/findItems", function(req, res){
	var keywords = req.query.keywords;
	var category = req.query.category;

	res.json(({items:items.find(category, keywords)}));
});
router.get("/verify", function(req, res){
	for(let i=0;i<verificationKeys.length;i++)
		if(req.query.code === verificationKeys[i][0])
		{
			var user = verificationKeys[i][1];
			UserData.findReturnUser(user.getName()).addIP(verificationKeys[i][2]);
			console.log(user.getmyIPs());
			console.log("Correct code");
			loggers[loggers.length] = [user, verificationKeys[i][2]];
		}
});

router.get("/getItemInfo", function(req, res){
	var itemID = req.query.itemID;

	res.json({items:items.findById(itemID)});
});

router.get("/userInfo",function(req,res){
	
	res.json( (getUserfromIP(req)) ? {username:req.session_state.username, password : req.session_state.password} : 
		{redirect:"/"});

	console.log("Userinfo requested");
});

router.get("/login",function(req,res){
	res.sendFile(__dirname + "/public/views/login.html");
});

var tryers = [];
var banned = [];
router.post("/login", loginAttempt);


router.post("/signup", function(req, res){
	var ip = getIP(req);
	if(getUserfromIP(req) !== undefined)
		return res.json({success:false, status: "You are currently logged in, please sign out first"});

	if(!req.body.captcha)
		return res.json({success:false, status:"Please select captcha"});

	const key = '6LfhUk4UAAAAAEf3g2FRVkhLt75ikTv66-iufaMW';
	const verify = `https://google.com/recaptcha/api/siteverify?secret=${key}&response=${req.body.captcha}&remoteip=${ip}`;

	request(verify, (err, response, body) => {
		body = JSON.parse(body);
		if(body.success !== undefined && !body.success)
			return res.json({success:false, status:"Failed captcha"});
	});

	var check;
	if(check = checkForBug(req, true))
		return check;

	req.session_state.username = req.body.username;
	req.session_state.email = req.body.email;
	req.session_state.password = req.body.password;
	req.session_state.active = true;

	var user = UserData.addUser(req.body.username, req.body.email, req.body.password);
	user.addIP(ip);
	console.log(user.myIPs);

	loggers[loggers.length] = [user, ip];
	return res.json({redirect: "/session"});
});
router.post("/logout", function(req, res){
	var ip = getIP(req);
	var user = getUserfromIP(req);
	req.session_state.reset();
	for(let i=0;i<loggers.length;i++)
		if(loggers[i][1] === ip)
			loggers.splice(i, 1);
	return res.json({redirect: "/"});
});

function getIP(req)
{
	return (req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress ||
     req.connection.socket.remoteAddress).split(",")[0];

}
function getUserfromIP(req)
{
	var ip = getIP(req);
	var user;
	for(let i = 0; i < loggers.length;i++)
		if(loggers[i][1] === ip)
			user = loggers[i][0];
	return user;
}

function loginAttempt(req, res)
{
	var ip = getIP(req), user = UserData.findReturnUser(req.body.username);

	if(bannedCheck(ip))
		return res.json({status:"Banned"});

	console.log("Login check for " + ip);

	
	var check;
	if(check = checkForBug(req))
		return res.json(check);
	console.log(user.getPassword());
	var status = user ? (user.getPassword() === req.body.password ? "Success" : "Incorrect") : "Username not found";
	if(status === "Success")
	{
		if(user.IPExists(ip))
		{
			loggers[loggers.length] = [user, ip];
			req.session_state.username = req.body.username;
			req.session_state.email = req.body.email;
			req.session_state.password = req.body.password;
			req.session_state.active = true;
			res.json({redirect:"/session"});
			console.log("User: " + user.username + " has logged in on IP: " + ip);
		}
		else
		{
			var key = uuidv4();
			verificationKeys[verificationKeys.length] = [key, user, ip];
			res.json({status:"You are accessing this account from a new IP, a verification has been sent to your email"});
			console.log("Verification email has been sent to " + user.email + " code: " + key);
		}
		
	}
	else if(status === "Incorrect")
		res.json(incorrectAttempt(res, "Incorrect", ip));
	else
		res.json({status:status});
	
}
function checkForBug(req, isSignup = false)
{
	if(req.body.username.includes("<")||req.body.username.includes(">"))
		return res.json({success:false, status:"Invalid Username"});
	if(isSignup && (req.body.email.includes("<")||req.body.email.includes(">")))
		return res.json({success:false, status:"Invalid email"});
	if(req.body.password.includes("<")||req.body.password.includes(">"))
		return res.json({success:false, status:"Invalid password"});
}
function bannedCheck(ip)
{
	for (var i = 0; i < banned.length; i++) 
		if(ip === banned[i])
			return true;
	return false;
}
function incorrectAttempt(res, status, ip)
{
	var found = false, index = 0;
	for(let i=0;i<tryers.length;i++)
		if(ip===tryers[i][0])
		{
			if(tryers[i][1] - 1 > 0)
				tryers[i][1]--;
			else {
				console.log("Login attempts reached for " + ip);
				banned[banned.length] = ip;
				return {status:"Locked out"};
			}
			found = true;
			index = i;
			break;
		}
	var remaining = (found) ? tryers[index][1] : (tryers[tryers.length] = [ip, 5])[1];
	return {status:status, attempts:remaining};
}








module.exports = router;

