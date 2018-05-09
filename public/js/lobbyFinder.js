$(document).ready(() => {
  $.get("/userInfo", success);
  $.get("/myLobbies", (data) => {
    console.log(data.lobbies);
  })
  $("#createLobby").click(() => {
    var users = [];
    users.push(username);
    var userArr = $("#users").val().split(" ");
    for(let i in userArr)
      users.push(userArr[i]);
    console.log(users);
    $.post("/sendMessage", {newLobby: "newLobby", users: users}, (data) => {
      alert(data.status);
    });
  });

  $("#sendMessage").click(() => {

    $.post("/sendMessage", {messageSent: "messageSent", users: allUsers, message: $("#message").val()}, (data) => {
      alert(data.status);
    });
  });
});


let allUsers;
let username;
function success(data) {
  if(data.redirect) window.location = window.location.href.split("/")[1] + data.redirect;

  username = data.user.username;
  $("#userGreeting").html("Hello " + username);
}
