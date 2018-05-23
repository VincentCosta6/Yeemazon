var id, creator2, name;
$(document).ready(function() {
  $.get("/userInfo", success);

  var id = retID(window.location.href);
  $.get("/getItemInfo", {
    _id: id
  }, (data) => {
    data.item = data.item[0];
    name = data.item.name;
    $("#name").html("Yeemazon Official " + name);
    $(document).prop("title", "Yeemazon - " + data.item.name);
    $("#itemPrice").html("$" + data.item.price);
    $("#shipping").html(" + $" + Math.floor(data.item.price / 10) + ".99 shipping");
    $("#itemDesc").html(data.item.description);
    $("#itemClick").html("Clicks: " + data.item.clicks);
    $("#itemClickNum").html("Unique Clicks: " + data.item.usersClicked.length);
    $("#itemOrders").html("Ordered: " + data.item.numOrders);
    $("#itemID").html("Item ID: " + data.item._id);
    creator2 = data.item.creator;
    $("#creator").html("Creator: " + creator2);
    $("#holder").css("background-image", "url(" + data.item.link + ")");
    id = data.item._id;
  });

  $("#logout").click(() => {
    $.post("/logout", (data) => {
      window.location = window.location.href.split("/")[1] + data.redirect;
    });
  });
  $("#account").click(() => {
    window.location = window.location.href.split("/")[1] + "/account";
  });
  $("#catalog").click(() => {
    window.location = window.location.href.split("/")[1] + "/session";
  });
  $("#cart").click(() => {
    window.location = window.location.href.split("/")[1] + "/cart";
  });
  $("#addToCart").click(() => {
    $.post("/addToCart", {
      itemID: id
    }, (data) => {
      alert(((data.status) ? "Item successfully added to your cart" : "Something went wrong, item has not been added to your cart"));
    });
  });
  $("#msg").click(() => {
    $.post("/sendMessage", {
      newLobby: "newLobby",
      users: [username, creator2],
      name: username + " has a question on item " + name
    }, (data) => {
      alert(data.reason);
    });
  });
});


function retID(WINDOWURL) {
  var rightSide = WINDOWURL.split("?")[1];
  var findIt = rightSide.split("id")[1];
  var maybe = findIt.split("=")[1];
  return maybe;
}
