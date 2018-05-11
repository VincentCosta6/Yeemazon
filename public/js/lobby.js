var id, mlength = 0, refreshData, firstLoop = true;
$(document).ready(() => {
  $.get("/userInfo", success);
  id = retreiveID(window.location.href);


  $("#sendMessage").click(() => {

    $.post("/sendMessage", {messageSent: "messageSent", _id: id, message: $("#message").val()}, (data) => {
      console.log(data);
      if(!data.passed) {
        alert(data.reason);
      }
    });
    $("#list").append("<li id = \"Heyo\">" + (username + ":" + $("#message").val()) + "</li>");
  });
  $("#sendInvite").click(() => {

    $.post("/sendMessage", {inviteUser: "inviteUser", _id: id, invitee: $("#user").val()}, (data) => {
      console.log(data);
      if(!data.passed)
        alert(data.reason);
    });
  });
  $("#deleteLobby").click(() => {

    $.post("/sendMessage", {removeLobby: "removeLobby", _id: id}, (data) => {
      console.log(data);
      if(!data.passed)
        alert(data.reason);
    });
  });



  var x = 1, keepGoing = true, allowed = false;
  refreshData = function()
  {
    $.get("/messageChange", {_id: id, length: mlength}, (data) => {
      if(data.upToDate == true)
        return;
        for(let i in data.messages)
        {
          if(firstLoop || (!(data.messages[i].split(":")[0] == username)))
            $("#list").append("<li id = \"m" + i + "\">" + data.messages[i] + "</li>");
        }
        window.scrollTo(0, document.body.scrollHeight);
        if(firstLoop)
          firstLoop = false;
        mlength = mlength + data.messages.length;
    });

    if(keepGoing)
      setTimeout(refreshData, x*1000);
  }
});


let allUsers;
let username;
function success(data) {
  if(data.redirect) {window.location = window.location.href.split("/")[1] + data.redirect; return;}

  username = data.user.username;
  $("#userGreeting").html("Hello " + username);
  refreshData();
}
function retreiveID(URL)
{
  var a = URL.split("id=")[1];
  var b = a.split("&")[0];
  return b
}
