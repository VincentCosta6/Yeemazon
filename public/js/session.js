$(document).ready(function() {
  $.get("/userInfo", success);
  $("#logout").click(() => {
    $.post("/logout", (data) => {
      window.location = window.location.href.split("/")[1] + data.redirect;
    });
  });
  $("#account").click(() => {
    window.location = window.location.href.split("/")[1] + "/account";
  });

  //CART CODE
  $("#cart").click(() => {
    var newDiv = "<div id=\"ordersPageback\"><h2 class=\"itemLabel\" style=\"padding-top:30px;\">Your Cart ({NUMBER} Items)</h2><div style=\"margin-top: 10px\"></div><div class=\"orderHolder\"></div></div>";
    $("#searchBack").replaceWith(newDiv);
    $("#sessionPageback").replaceWith(newDiv);

    $.get("/cartItems", function(data) {
      for (var i = 0; i < data.items.length; i++) {

        let id = data.items[i]._id;
        var divCreator = "<div id=\"" + id + "\" class=\"itemBox\"><img id = \"" + id + "imger" + "\"src=\"" + data.items[i].link + "\" style=\"cursor:pointer;width:140px;height:140px;margin-top:5px\"></img><br><label>" + data.items[i].name + "</label><br><label>$" + data.items[i].price + "</label><br><label id = \"" + id + "remover\" style = \"cursor:pointer;\">Remove</label></div>";
        $(".orderHolder").append(divCreator);
        var redirect = function() {
          //TODO - INDIVIDUAL ITEM PAGE CODE
          window.location = window.location.href.split("/")[1] + "/item?id=" + id
        };
        var remover = function() {
          $.post("/removeFromCart", {
            itemID: id
          }, (data) => {
            $("#" + id).remove();
            alert("Successful removal");
          })
        };
        $("#" + id + "imger").click(redirect);
        $("#" + id + "remover").click(remover);
      }

      //scale the back of the page to compensate for number of items
      $(".orderHolder").css("height", 230 * (Math.floor((data.items.length / 6)) + 1));
      $("#ordersPageback").css("height", 350 * (Math.floor((data.items.length / 6)) + 1));

      //update search list size to show user
      $(".itemLabel").html("Your cart has " + data.items.length + " items");

    });
  });

  //RESET TO BROWSE PAGE / SESSION PAGE
  $(".loginHeader").click(() => {
    //Unholy line of code, sorry
    var newDiv = "<div id=\"sessionPageback\"><h2 class=\"itemLabel\" style=\"padding-top:30px\">Popular Items</h2><div style=\"margin-top: 10px\"></div><div class=\"itemHolder\" id=\"items1\"></div><div style=\"margin-top: 30px\"></div><h2 class=\"itemLabel\">Under $20</h2><div style=\"margin-top: 10px\"></div><div class=\"itemHolder\" id=\"items2\"></div><div style=\"margin-top: 30px\"></div><h2 class=\"itemLabel\">Mr. Yee's Picks</h2><div style=\"margin-top: 10px\"></div><div class=\"itemHolder\" id=\"items3\"></div></div>";
    $("#searchBack").replaceWith(newDiv);
    $("#sessionPageback").replaceWith(newDiv);
    $("#ordersPageback").replaceWith(newDiv);
    //populate homepage
    //grab first 6 "popular items", "under20", and "yee"
    let searcher = ["popular", "under20", "yee"];
    for (let i in searcher)
      $.get("/findItems", {
        keywords: searcher[i],
        appending: (++i)
      }, function(data) {
        for (let i2 = 0; i2 < 6; i2++)
          if (data.items[i2])
            appender(data.items[i2]._id, data.items[i2].link, data.items[i2].name, data.items[i2].price, data.items[i2].clicks, data.items[i2].usersClicked.length, data.appending);
      });
  });

  //SEARCH PAGE
  $("#request").click(() => {
    if ($("#search").val() && $("#search").val() !== "Search for an item")
      var newDiv = "<div id=\"searchBack\"><h2 class=\"itemLabel\" style=\"padding-top:30px\">Search Results for {QUERY}</h2><div style=\"margin-top: 10px\"></div><div class=\"searchHolder\"></div><h3>End of Search Results</h3>  </div>";
    $("#searchBack").replaceWith(newDiv);
    $("#sessionPageback").replaceWith(newDiv);

    //populate search page

    $.get("/findItems", {
      keywords: $("#search").val()
    }, function(data) {
      for (var i = 0; i < data.items.length; i++) {

        let id = data.items[i]._id;
        var divCreator = "<div id=\"" + id + "\" class=\"itemBox\"><img src=\"" + data.items[i].link + "\" style=\"width:140px;height:140px;margin-top:5px\"></img><br><label>" + data.items[i].name + "</label><br><label>$" + data.items[i].price + "</label></div>";
        $(".searchHolder").append(divCreator);
        $("#" + id).click(function() {
          //TODO - INDIVIDUAL ITEM PAGE CODE
          window.location = window.location.href.split("/")[1] + "/item?id=" + id
        });

        $(".searchHolder").css("height", 230 * (Math.floor((data.items.length / 6)) + 1));
        $("#searchBack").css("height", 350 * (Math.floor((data.items.length / 6)) + 1));
        $(".itemLabel").html("Search Results for " + "\"" + $("#search").val() + "\" -- " + data.items.length + " results");
      }
    });

  });

  //grab first 6 "popular items", "under20", and "yee"
  let searcher = ["popular", "under20", "yee"];
  for (let i in searcher)
    $.get("/findItems", {
      keywords: searcher[i],
      appending: (++i)
    }, function(data) {
      for (let i2 = 0; i2 < 6; i2++)
        if (data.items[i2])
          appender(data.items[i2]._id, data.items[i2].link, data.items[i2].name, data.items[i2].price, data.items[i2].clicks, data.items[i2].usersClicked.length, data.appending);
    });

  if (!($("#search").val()) || $("#search").val() == "Search for an item")
    $('#request').prop('hidden', true);

  $("#search").click(function() {
    if ($(this).val() == "Search for an item") {
      $(this).val('');
    }
  });

  $("#search").blur(function() {
    if ($(this).val() == "") {
      $(this).val('Search for an item');
    }
  });
});

$(document).keypress(function(e) {
  if ($("#search").val().includes("<") || $("#search").val().includes(">"))
    return alert("Improper search please dont use < or >");
  if (e.keyCode == 13 && $("#search").val() && $("#search").val() !== "Search for an item")
    $('#request').click();

  if (!($("#search").val()) || $("#search").val() == "Search for an item")
    $('#request').prop('hidden', true);
  else
    $('#request').prop('hidden', false);
});

function appender(id, link, name, price, clicks, uniqueClicks, which) {
  var divCreator = "<div  id=\"" + id + "\" class=\"itemBox\"><img src=\"" + link + "\" style=\"cursor:pointer;width:140px;height:140px;margin-top:5px\"></img><br><label>" + name + "</label><br><label>$" + price + "</label></div>";
  $("#items" + which).append(divCreator);
  $("#" + id).click(function() {
    $.post("/itemClicked", {
      itemID: id
    }, (data) => {
      console.log("Clicked")
    });
    //TODO - INDIVIDUAL ITEM PAGE CODE
    window.location = window.location.href.split("/")[1] + "/item?id=" + id;
  });
}
var username, password;

function success(data) {
  if (data.redirect === "/") {
    window.location = window.location.href.split("/")[1] + "/";
    return;
  }
  $("#userGreeting").html("Hello " + data.user.username + "!");
  $("#password").html(data.user.password);
}
