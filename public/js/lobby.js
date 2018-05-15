var id, mlength = 0, refreshData, firstLoop = true, go = true;
$(document).ready(() => {
  firstLoop = true;
  console.log(firstLoop);
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
    $("#list").append("<li id = \"" + ($("#list").size()) +"\">" + (username + ":invited " + $("#user").val()) + "</li>");
  });
  $("#deleteLobby").click(() => {

    $.post("/sendMessage", {removeLobby: "removeLobby", _id: id}, (data) => {
      console.log(data);
      if(!data.passed)
        alert(data.reason);
    });
  });
  $("#leaveLobby").click(() => {
    $.post("/sendMessage", {leaveLobby: "leaveLobby", _id: id}, (data) => {
      console.log(data);
      if(!data.passed)
        alert(data.reason);
    });
  });

  var x = 1, keepGoing = true, allowed = false;
  refreshData = function()
  {
    if(go)
    {
      $.get("/messageChange", {_id: id, length: mlength}, (data) => {
        if(data.passed == false)
        {
          alert(data.reason);
          window.location = window.location.href.split("/")[1] + "/lobbyFinder";
        }
        if(data.upToDate == true)
          return;
        let i;
        for(i in data.messages)
          if(firstLoop || (!(data.messages[i].split(":")[0] == username)))
          {
            $("#list").append("<li id = \"m" + ($("#list").size() + i) + "\">" + data.messages[i] + "</li>");
            $("#m" + $("#list").size() + i).click(textClickProcess($("#list").size() + i));
          }
        mlength = mlength + data.messages.length;
        firstLoop = false;
      });
      console.log(getScrollbarHeight());
      if($(window).scrollTop() + getScrollbarHeight() >= $(window).height())
        window.scrollTo(0, document.body.scrollHeight);
    }
    if(keepGoing)
      setTimeout(refreshData, x*1000);
  }
  refreshData();
});
function getScrollbarHeight() {
  return window.innerHeight * (window.innerHeight / document.body.offsetHeight);
}
function textClickProcess(i)
{
  console.log("I " + i);
  var key = $("#m" + i).find("label").attr("permission");
  if(!key) return;
  console.log("Key " + key);

  $("#m" + i).find("label").click(() => {
    $.post("/updatePermission", {key: key}, (data) => {
      alert(data.reason);
      if(data.passed == true)
        $.post("/sendMessage", {removeLobby: "removeLobby", _id: id}, (data) => {
          window.location = window.location.href.split("/")[1] + "/lobbyFinder";
        });
    });
  });
}

let allUsers;
function retreiveID(URL)
{
  var a = URL.split("id=")[1];
  var b = a.split("&")[0];
  return b
}
$(window).focus(function() {
    go = true;
});

$(window).blur(function() {
    go = false;
});
