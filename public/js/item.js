var id;
$(document).ready(function() {
  $.get("/userInfo", success);

  var id = retID(window.location.href);
  $.get("/getItemInfo", {
    _id: id
  }, (data) => {
    data.item = data.item[0];
    $("#name").html("Yeemazon Official " + data.item.name);
    $(document).prop('title', 'Yeemazon - ' + data.item.name);
    $("#itemPrice").html("$" + data.item.price);
    $("#shipping").html(" + $" + Math.floor(data.item.price/10) + ".99 shipping");
    $("#itemDesc").html(data.item.description);
    $("#itemClick").html("Clicks: " + data.item.clicks);
    $("#itemClickNum").html("Unique Clicks: " + data.item.usersClicked.length);
    $("#itemOrders").html("Ordered: " + data.item.numOrders);
    $("#itemID").html("Item ID: " + data.item._id);
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
      alert(((data.status) ? "Item added to cart" : "Something went wrong"));
    });
  });
});

function success(data) {
  if (data.redirect === "/") {
    window.location = window.location.href.split("/")[1] + "/";
    return;
  }
  $("#userGreeting").html("Hello " + data.user.username + "!");
  $("#password").html(data.user.password);
}

function retID(WINDOWURL) {
  var rightSide = WINDOWURL.split("?")[1];
  var findIt = rightSide.split("id")[1];
  var maybe = findIt.split("=")[1];
  return maybe;
}
