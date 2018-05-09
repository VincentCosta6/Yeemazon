$(document).ready(() => {
  console.log("Newer");
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
  username = data.user.username;
  $("#greeting").html("Hello " + username);
}
