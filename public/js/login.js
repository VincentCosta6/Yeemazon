function sendLogin()
{
	$.ajax({
            url:"/login",
            type:"POST",
            data: {username:$("#username").val(), password:$("#password").val(), ref:(window.location.href.split("/")[2])},
            success: redirect,
            dataType : "json"
        });
}
function redirect(data)
{
	if(data.status)
		alert(data.status);
	else
		window.location = window.location.href.split("/")[1] + data.redirect;
}
function sendSignup()
{
	//Unholy line of code, try to ignore it
	newDiv = "<div id=\"loginBox\" class=\"2\"><br><label>Choose a username</label><div style=\"margin-top: 10px\"></div><input id=\"username\" type=\"text\" class=\"loginInput\"><div style=\"margin-top: 30px\"></div><label>Enter your email</label><div style=\"margin-top: 10px\"></div><input id=\"email\" name=\"email\" type=\"text\" class=\"loginInput\"><div style=\"margin-top: 30px\"></div><label>Choose a password (hidden)</label><div style=\"margin-top: 10px\"></div><input id=\"password\" type=\"password\" class=\"loginInput\"><div style=\"margin-top: 40px\"></div><div align = \"center\" class=\"g-recaptcha\" data-sitekey=\"6LfhUk4UAAAAACFLoT8YhRJxxtEJuamEWGQXNhfb\"></div><div style=\"margin-top: 30px\"></div><button id=\"request\" class=\"request\">Sign up!</button><div style=\"margin-top: 10px\"><button id=\"back\" class=\"back\">Go Back</button></div>";
	$(".1").replaceWith(newDiv);
	$("#back").click(sendBack);
   $("#request").click(signup);
}
function sendBack()
{
	//Unholy line of code, try to ignore it
	newDiv = "<div id=\"loginBox\" class=\"1\"><br><label>Username</label><div style=\"margin-top: 10px\"></div><input id=\"username\" type=\"text\" class=\"loginInput\"><div style=\"margin-top: 30px\"></div><label>Password</label><div style=\"margin-top: 10px\"></div><input id=\"password\" type=\"password\" class=\"loginInput\"><div style=\"margin-top: 25px\"></div><button id=\"request\" class=\"request\">Log In</button><div style=\"margin-top: 20px\"></div><label>Don't have an account?</label><button id=\"signup\" class=\"request\">Sign up!</button><div style=\"margin-top: 10px\"></div></div>";
	$(".2").replaceWith(newDiv);
	$("#signup").click(sendSignup);
  $("#request").click(sendLogin);
}
$(document).ready(function(){
	$.get("/userInfo", success);
	$("#signup").click(sendSignup);
	$(document).keypress(function(e){
			if(e.keyCode==13)
			$('#request').click();
	});
	$("#request").click(sendLogin);
});

function submitForm(e) {
	 e.preventDefault();
}
function success(data)
{
	if(!data.redirect)
		window.location = window.location.href.split("/")[1] + "/session";
}

function signup()
{
	$.ajax({
            url:"/signup",
            type:"POST",
            data: {username:$("#username").val(), email:$("#email").val(), password:$("#password").val(), captcha:$("#g-recaptcha-response").val()},
            success: redirect,
            dataType : "json"
        });
}
