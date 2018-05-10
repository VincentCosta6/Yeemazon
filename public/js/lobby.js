var id, mlength;
$(document).ready(() => {
  $.get("/userInfo", success);
  id = retreiveID(window.location.href);
  $.get("/messageLength", {_id: id}, (data) => {
    mlength = +data.length;
    $.get("/messages", {_id: id, start: 0, length: +mlength}, (data2) => {
      for(let i in data2.messages)
      {
          $("#list").append("<li id = \"m" + i + "\">" + data2.messages[i] + "</li>");
      }
    })
  });

  $("#sendMessage").click(() => {

    $.post("/sendMessage", {messageSent: "messageSent", _id: id, message: $("#message").val()}, (data) => {
      console.log(data.status);
    });
  });
  var x = 1;
  function refreshData()
  {
    $.get("/messageLength", {_id: id}, (data) => {
      if(data.length != mlength)
      {
        console.log(mlength);
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
    setTimeout(refreshData, x*1000);
  }


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
