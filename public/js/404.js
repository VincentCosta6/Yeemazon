$(document).ready(function() {
  $("#requestPermission").click(() => {
    window.location = window.location.href.split("/")[1] + "/session";
  });
  $(".loginHeader").click(() => {
    window.location = window.location.href.split("/")[1] + "/session";
  });
});
