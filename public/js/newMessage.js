$(document).ready(() => {
  $.get("/userInfo", success);

  $("#createLobby").click(() => {
    var users = [];
    users.push(username);
    var userArr = $("#users").val().split(" ")
    for(let i in userArr)
      users.push(userArr[i]);

    $.post("/messages", {newLobby: "newLobby", users: userArr}, (data) => {
      alert(data.status);
    });
  });
});



let username;
function success(data) {
  if(data.redirect) window.location = window.location.href.split("/")[1] + data.redirect;

  username = data.user.username;
  $("#userGreeting").html("Hello " + username);
}
