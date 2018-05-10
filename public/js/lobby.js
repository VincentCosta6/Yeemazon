var id, mlength = 0;
$(document).ready(() => {
  $.get("/userInfo", success);
  id = retreiveID(window.location.href);


  $("#sendMessage").click(() => {

    $.post("/sendMessage", {messageSent: "messageSent", _id: id, message: $("#message").val()}, (data) => {
      console.log(data.status);
    });
  });
  $("#sendInvite").click(() => {

    $.post("/sendMessage", {inviteUser: "inviteUser", _id: id, invitee: $("#user").val()}, (data) => {
      console.log(data.status);
    });
  });
  $("#deleteLobby").click(() => {

    $.post("/sendMessage", {removeLobby: "removeLobby", _id: id}, (data) => {
      console.log(data.status);
    });
  });



  var x = 1, keepGoing = true;
  function refreshData()
  {
    $.get("/messageLength", {_id: id}, (data) => {
      if(data.status) {
        keepGoing = false;
        alert(data.status);
      }
      else if(keepGoing && data.length != mlength)
      {
        $.get("/messages", {_id: id, start: (parseInt(mlength)), length: (parseInt(data.length) - parseInt(mlength))}, (data2) => {
          mlength = parseInt(data.length);

          for(let i in data2.messages)
          {
            $("#list").append("<li id = \"m" + i + "\">" + data2.messages[i] + "</li>");
          }
          window.scrollTo(0, document.body.scrollHeight);
        });
      }

    });
    if(keepGoing)
      setTimeout(refreshData, x*1000);
  }
  if(keepGoing)
    refreshData();
});


let allUsers;
let username;
function success(data) {
  if(data.redirect) window.location = window.location.href.split("/")[1] + data.redirect;

  username = data.user.username;
  $("#userGreeting").html("Hello " + username);
}
function retreiveID(URL)
{
  var a = URL.split("id=")[1];
  var b = a.split("&")[0];
  return b
}
