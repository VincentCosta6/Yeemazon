$(document).ready(function() {
  $("#logout").click(() => {
    $.post("/logout", (data) => {
      window.location = window.location.href.split("/")[1] + data.redirect;
    });
  });
  $("#account").click(() => {
    window.location = window.location.href.split("/")[1] + "/account";
  });
  $("#messages").click(() => {
    window.location = window.location.href.split("/")[1] + "/lobbyFinder";
  });
  $("#cart").click(() => {
    window.location = window.location.href.split("/")[1] + "/cart";
  });
  $(".loginHeader").click(() => {
    window.location = window.location.href.split("/")[1] + "/session";
  });
  $("#request").click(() => {
    if ($("#search").val() && $("#search").val() !== "Search for an item")
      window.location = window.location.href.split("/")[1] + "/search?query=" + $("#search").val().toLowerCase();
  });
  $("#ProductMan").click(() => {
    window.location = window.location.href.split("/")[1] + "/itemCRUD";
  });

  //SEARCH BUTTON BEHAVIOR
  if (!($("#search").val()) || $("#search").val() == "Search for an item")
    $("#request").prop("hidden", true);

  $("#search").click(() => {
    if ($(this).val() == "Search for an item") {
      $(this).val("");
    }
  });

  $("#search").blur(() => {
    if ($(this).val() == "") {
      $(this).val("Search for an item");
    }
  });
});

//XSS PREVENTION
$(document).keypress(e => {
  if ($("#search").val().includes("<") || $("#search").val().includes(">"))
    return alert("Improper search please dont use < or >");
  if (e.keyCode == 13 && $("#search").val() && $("#search").val() !== "Search for an item")
    $("#request").click();

  if (!($("#search").val()) || $("#search").val() == "Search for an item")
    $("#request").prop("hidden", true);
  else
    $("#request").prop("hidden", false);
});
