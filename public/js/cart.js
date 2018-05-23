$(document).ready(function() {
  $.get("/userInfo", success);
  $("#logout").click(() => {
    $.post("/logout", (data) => {
      window.location = window.location.href.split("/")[1] + data.redirect;
    });
  });

  $("#return").click(() => {
    window.location = window.location.href.split("/")[1] + "/session";
  });

  $("#account").click(() => {
    window.location = window.location.href.split("/")[1] + "/account";
  });
  $("#order").click(() => {
    let send1 = [],
      send2 = [];
    for (let i in itemIDs)
      if ($("#a" + itemIDs[i]).val()) {
        numPer[i] = $("#a" + itemIDs[i]).val();
        send1.push(numPer[i]);
      }
    for (let i in itemIDs)
      if ($("#a" + itemIDs[i]).val()) {
        numPer[i] = $("#a" + itemIDs[i]).val();
        send1.push(numPer[i]);
      }
    for (let i in itemIDs)
      numPer[i] = $("#a" + itemIDs[i]).val();
    $.post("/orderItems", {
      itemIDs: itemIDs,
      orderAmounts: numPer
    }, (data) => {
      alert(data.reason);
      $(".orderHolder").empty();
      $(".itemLabel").html("Your cart has " + (lengther = 0) + " items");
    });
  });

  $.get("/cartItems", function(data) {
    for (var i = 0; i < data.items.length; i++) {

      let id = data.items[i]._id;
      itemIDs[i] = id;
      numPer[i] = 1;
      costs[i] = parseFloat(data.items[i].price);
      var divCreator = "<div id=\"" + id + "\" class=\"itemBox\"><img id = \"" + id + "imger" + "\"src=\"" + data.items[i].link + "\" style=\"cursor:pointer;width:140px;height:140px;margin-top:5px\"></img><br><label>" + data.items[i].name + "</label><br><label>$" + data.items[i].price + "</label><br><label id = \"" + id + "remover\" style = \"cursor:pointer;\">Remove</label><br><input id = \"a" + id + "\"type = \"number\" min = \"1\" max = \"10\" value = \"1\"></div>";
      $(".orderHolder").append(divCreator);
      var redirect = function() {
        window.location = window.location.href.split("/")[1] + "/item?id=" + id
      };
      var remover = function() {
        $.post("/removeFromCart", {
          itemID: id
        }, (data) => {
          $("#" + id).remove();
          $(".itemLabel").html("Your cart has " + --lengther + " items");
          updateCost();
          alert("Item has been removed from your cart");
        })
      };
      $("#" + id + "imger").click(redirect);
      $("#" + id + "remover").click(remover);
    }

    //scale the back of the page to compensate for number of items
    $(".orderHolder").css("height", 230 * (Math.floor((data.items.length / 6)) + 1));
    $("#ordersPageback").css("height", 370 * (Math.floor((data.items.length / 6)) + 1));

    //update search list size to show user
    $(".itemLabel").html("Your cart has " + data.items.length + " items");
    lengther = data.items.length;
    updateCost();
  });
});
document.onkeypress = updateCost;
document.onclick = updateCost;

function updateCost() {
  var total = 0;
  for (let i in itemIDs)
    if ($("#a" + itemIDs[i]).val())
      total += costs[i] * parseInt($("#a" + itemIDs[i]).val());
  $("#order").html("Order $" + total.toFixed(2));
}
var lengther;
var itemIDs = [];
var numPer = [];
var costs = [];
