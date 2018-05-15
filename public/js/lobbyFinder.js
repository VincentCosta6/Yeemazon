var repeat, go =true;;
$(document).ready(() => {
  $("#createLobby").click(() => {
    var users = [];
    users.push(username);
    var userArr = $("#users").val().split(" ");
    for(let i in userArr)
      users.push(userArr[i]);
    $.post("/sendMessage", {newLobby: "newLobby", users: users, name: $("#name").val()}, (data) => {
      console.log(data);
      if(!data.passed)
        alert(data.reason);
    });
  });


  var x = 3.5, keepGoing = true, allowed = false, mlength = 0;
  repeat = function() {
    if(go)
    {
      $.get("/lobbyChange", {length: mlength}, (data) => {
        if(data.upToDate == false)
        {
          $("#list").empty();
          mlength = data.lobbies.length;
          for(let i in data.lobbies)
          {
            var string = "<li id = \"lob" + i + "\">" + data.lobbies[i].name + "(" + data.lobbies[i].length + ")</li>";
            $("#list").append(string);
            $("#lob" + i).click(() => {
              window.location = window.location.href.split("/")[1] + "/lobby?id=" + data.lobbies[i]._id;
            });
          }
        }
      });
    }
    setTimeout(repeat, x*1000);
  };
  repeat();
});
$(window).focus(function() {
    go = true;
});

$(window).blur(function() {
    go = false;
});
