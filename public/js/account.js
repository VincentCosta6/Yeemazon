$(document).ready(function() {
  $.get("/userInfo", success);
  $.get("/permissions", (data) => {
    for(let i in data.permissions)
      $("#perm2").append("<option value=\"" + data.permissions[i] + "\">" + capitalizeFirstLetter(data.permissions[i]) + "</option>");
  });
  $("#requestPermission").click(() => {
    $.get("/requestPermission", {permissionLevel: $("#perm2").val()}, (data) => {
        alert(data.reason);
    })
  });
  $("#logout").click(() => {
    $.post("/logout", (data) => {
      window.location = window.location.href.split("/")[1] + data.redirect;
    });
  });
  $(".loginHeader").click(() => {
    window.location = window.location.href.split("/")[1] + "/session";
  });
  $("#cart").click(() => {
    //gotta redirect this to cart
    window.location = window.location.href.split("/")[1] + "/cart";
  });
});
var username, password;

function success(data) {
  if (data.redirect === "/") {
    window.location = window.location.href.split("/")[1] + "/";
    return;
  }
  $("#username").html("Username: " + data.user.username);
  $("#email").html("Email: " + data.user.email);
  $("#perm").html("Permission: " + capitalizeFirstLetter(data.user.permission));
}

function itemCall(data) {
  alert(data.reason);
}
function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}
