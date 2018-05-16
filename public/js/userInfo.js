$.get("/userInfo", success);
var username;

function success(data) {
  if (data.redirect) {
    window.location = window.location.href.split("/")[1] + data.redirect;
    return;
  }
  $("#userGreeting").html("Hello " + data.user.username + "!");
  $("#password").html(data.user.password);
  username = data.user.username;
}
