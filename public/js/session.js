//State determines the size of the toolbar; 0 when on a session page, 1 when on a specific item page
var state = 0;

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

  //CART CLICK METHOD
  $("#cart").click(() => {
    if (state) {
      //CHANGE TOOLBAR BACK TO NORMAL IF NECESSARY
      $("#fakeToolbar").attr("id", "anotherFakeToolbar");
      state = 0;
      $("#userGreeting").css("transform", "translateX(0px)");
      $("#userGreeting").css("animation", "slideBack 1s 1");
    }

    //LOAD CART HTML
    var divs = ["#searchBack", "#sessionPageback", "#itemPageback"];
    for (let i in divs) {
      $(divs[i]).replaceWith("<div id=\"ordersPageback\"><div>");
      $("#ordersPageback").load("css/elements.html #ordersPageback>*");
    }

    //CREATE CART ITEMS
    $.get("/cartItems", function(data) {
      for (var i = 0; i < data.items.length; i++) {

        let id = data.items[i]._id;
        var divCreator = "<div id=\"" + id + "\" class=\"itemBox\"><img id = \"" + id + "imger" + "\"src=\"" + data.items[i].link + "\" style=\"cursor:pointer;width:140px;height:140px;margin-top:5px\"></img><br><label>" + data.items[i].name + "</label><br><label>$" + data.items[i].price + "</label><br><label class=\"remove\" id = \"" + id + "remover\" style = \"cursor:pointer;\">Remove</label></div>";
        $(".orderHolder").append(divCreator);
        var redirect = function() {

          //LOAD ITEM PAGE HTML
          state = 1;
          var divs = ["#ordersPageback", "#sessionPageback"];
          for (let i in divs) {
            $(divs[i]).replaceWith("<div id=\"itemPageback\"><div>");
            $("#itemPageback").load("css/elements.html #itemPageback>*");
          }

          //CHANGE TOOLBAR BACK IF NECESSARY
          $("#userGreeting").css("transform", "translateX(465px)");
          $("#userGreeting").css("animation", "slideAcross 1s 1");
          $("#toolbar").attr("id", "fakeToolbar");
          $("#anotherFakeToolbar").attr("id", "fakeToolbar");

          //POPULATE ITEM PAGE WITH DATA
          $.get("/getItemInfo", {
            _id: id
          }, (data) => {
            data.item = data.item[0];
            $("#name").html("Yeemazon™ Official " + data.item.name);
            $(document).prop('title', 'Yeemazon - ' + data.item.name);
            $("#itemPrice").html("$" + data.item.price);
            $("#shipping").html(" + $" + Math.floor((data.item.price / 10)) + ".99 shipping");
            $("#itemDesc").html(data.item.description);
            $("#itemClick").html("Clicks: " + data.item.clicks);
            $("#itemClickNum").html("Unique Clicks: " + data.item.usersClicked.length);
            $("#itemOrders").html("Ordered: " + data.item.numOrders);
            $("#itemID").html("Item ID: " + data.item._id);
            $("#holder").css("background-image", "url(" + data.item.link + ")");
            id = data.item._id;
          });

          //ADD TO CART BUTTON CODE
          $("#addToCart").click(() => {
            $.post("/addToCart", {
              itemID: id
            }, (data) => {
              alert(((data.status) ? "Item added to cart" : "Something went wrong"));
            });
          });
        };

        //REMOVE FROM CART BUTTON CODE
        var remover = function() {
          $.post("/removeFromCart", {
            itemID: id
          }, (data) => {
            $("#" + id).remove();
            $("#cartNumber").html("Your Cart (" + data.items.length + " Items)");
            alert("Successful removal");
          })
        };
        $("#" + id + "imger").click(redirect);
        $("#" + id + "remover").click(remover);
      }

      //SCALE PAGE BACKING FOR NUMBER OF ITEMS
      $(".orderHolder").css("height", 230 * (Math.floor((data.items.length / 6)) + 1));
      $("#ordersPageback").css("height", 350 * (Math.floor((data.items.length / 6)) + 1));

      //CART LENGTH DISPLAY
      $(".itemLabel").html("Your cart has " + data.items.length + " items");

    });
  });

  //HEADER CLICK CODE
  $(".loginHeader").click(() => {
    if (state) {
      //RESET TOOLBAR IF NEEDED
      $("#fakeToolbar").attr("id", "anotherFakeToolbar");
      state = 0;
      $("#userGreeting").css("transform", "translateX(0px)");
      $("#userGreeting").css("animation", "slideBack 1s 1");
    }

    //LOAD SESSION HTML
    var divs = ["#searchBack", "#sessionPageback", "#ordersPageback", "#itemPageback"];
    for (let i in divs) {
      $(divs[i]).replaceWith("<div id=\"sessionPageback\"><div>");
      $("#sessionPageback").load("css/elements.html #sessionPageback>*");
    }

    //LOAD SESSION ITEMS
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

    //LOAD FULL ITEM LIST
    $.get("/findItems", {
      keywords: "cool"
    }, function(data) {
      for (let i = 0; i < data.items.length; i++)
        if (data.items[i])
          appender(data.items[i]._id, data.items[i].link, data.items[i].name, data.items[i].price, data.items[i].clicks, data.items[i].usersClicked.length, 4);

      //SCALE PAGE BACKING FOR NUMBER OF ITEMS
      $(".itemCont").css("height", 260 * (Math.floor((data.items.length / 6)) + 1));
      $("#sessionPageback").css("height", 1100 + (260 * (Math.floor((data.items.length / 6)) + 1)));
    });
  });

  //SEARCH BUTTON CLICK CODE
  $("#request").click(() => {
    if (state) {
      //RESET TOOLBAR IF NEEDED
      $("#fakeToolbar").attr("id", "anotherFakeToolbar");
      state = 0;
      $("#userGreeting").css("transform", "translateX(0px)");
      $("#userGreeting").css("animation", "slideBack 1s 1");
    }
    if ($("#search").val() && $("#search").val() !== "Search for an item")

    //LOAD SEARCH PAGE HTML
    var divs = ["#searchBack", "#sessionPageback", "#ordersPageback", "#itemPageback"];
    for (let i in divs) {
      $(divs[i]).replaceWith("<div id=\"searchBack\"><div>");
    }
    $("#searchBack").load("css/elements.html #searchBack>*");
    $(".itemLabel").html("No search results");

    //LOAD SEARCHED ITEMS
    $.get("/findItems", {
      keywords: $("#search").val()
    }, function(data) {
      for (var i = 0; i < data.items.length; i++) {

        let id = data.items[i]._id;
        var divCreator = "<div id=\"" + id + "\" class=\"itemBox\"><img src=\"" + data.items[i].link + "\" style=\"width:140px;height:140px;margin-top:5px\"></img><br><label>" + data.items[i].name + "</label><br><label>$" + data.items[i].price + "</label></div>";
        $(".searchHolder").append(divCreator);
        $("#" + id).click(function() {

          //LOAD ITEM PAGE HTML
          state = 1;
          var divs = ["#searchBack", "#sessionPageback"];
          for (let i in divs) {
            $(divs[i]).replaceWith("<div id=\"itemPageback\"><div>");
            $("#itemPageback").load("css/elements.html #itemPageback>*");
          }

          //SCALE TOOLBAR DOWN
          $("#userGreeting").css("transform", "translateX(465px)");
          $("#userGreeting").css("animation", "slideAcross 1s 1");
          $("#toolbar").attr("id", "fakeToolbar");
          $("#anotherFakeToolbar").attr("id", "fakeToolbar");

          //POPULATE ITEM PAGE WITH DATA
          $.get("/getItemInfo", {
            _id: id
          }, (data) => {
            data.item = data.item[0];
            $("#name").html("Yeemazon™ Official " + data.item.name);
            $(document).prop('title', 'Yeemazon - ' + data.item.name);
            $("#itemPrice").html("$" + data.item.price);
            $("#shipping").html(" + $" + Math.floor((data.item.price / 10)) + ".99 shipping");
            $("#itemDesc").html(data.item.description);
            $("#itemClick").html("Clicks: " + data.item.clicks);
            $("#itemClickNum").html("Unique Clicks: " + data.item.usersClicked.length);
            $("#itemOrders").html("Ordered: " + data.item.numOrders);
            $("#itemID").html("Item ID: " + data.item._id);
            $("#holder").css("background-image", "url(" + data.item.link + ")");
            id = data.item._id;
          });

          //ADD ITEM TO CART CODE
          $("#addToCart").click(() => {
            $.post("/addToCart", {
              itemID: id
            }, (data) => {
              alert(((data.status) ? "Item added to cart" : "Something went wrong"));
            });
          });
        });

        //FINISH POPULATING SEARCH PAGE WITH DATA
        $(".searchHolder").css("height", 230 * (Math.floor((data.items.length / 6)) + 1));
        $("#searchBack").css("height", 350 * (Math.floor((data.items.length / 6)) + 1));
        $(".itemLabel").html("No search results");
        $(".itemLabel").html("Search Results for " + "\"" + $("#search").val() + "\" -- " + data.items.length + " results");
      }
    });

  });

  //POPULATE SESSION PAGE WITH ITEMS
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

  //LOAD FULL ITEM LIST
  $.get("/findItems", {
    keywords: "cool"
  }, function(data) {
    for (let i = 0; i < data.items.length; i++)
      if (data.items[i])
        appender(data.items[i]._id, data.items[i].link, data.items[i].name, data.items[i].price, data.items[i].clicks, data.items[i].usersClicked.length, 4);

    //SCALE PAGE BACKING FOR NUMBER OF ITEMS
    $(".itemCont").css("height", 260 * (Math.floor((data.items.length / 6)) + 1));
    $("#sessionPageback").css("height", 1100 + (260 * (Math.floor((data.items.length / 6)) + 1)));
  });

  //SEARCH BUTTON BEHAVIOR
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

//XSS PREVENTION
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

//HELPER METHOD FOR APPENDING ITEM DIVS TO PAGE
function appender(id, link, name, price, clicks, uniqueClicks, which) {
  var divCreator = "<div  id=\"" + id + "\" class=\"itemBox\"><img src=\"" + link + "\" style=\"cursor:pointer;width:140px;height:140px;margin-top:5px\"></img><br><label id=\"boxLabel\">" + name + "</label><br><label id=\"boxLabel\">$" + price + "</label></div>";
  $("#items" + which).append(divCreator);
  $("#" + id).click(function() {

    $.post("/itemClicked", {
      itemID: id
    }, (data) => {
      console.log("Clicked")
    });

    //LOAD ITEM PAGE HTML
    state = 1;
    var divs = ["#sessionPageback"];
    for (let i in divs) {
      $(divs[i]).replaceWith("<div id=\"itemPageback\"><div>");
      $("#itemPageback").load("css/elements.html #itemPageback>*");
    }

    //SCALE TOOLBAR DOWN
    $("#toolbar").attr("id", "fakeToolbar");
    $("#userGreeting").css("transform", "translateX(465px)");
    $("#userGreeting").css("animation", "slideAcross 1s 1");
    $("#anotherFakeToolbar").attr("id", "fakeToolbar");

    //POPULATE ITEM PAGE WITH DATA
    $.get("/getItemInfo", {
      _id: id
    }, (data) => {
      data.item = data.item[0];
      $("#name").html("Yeemazon™ Official " + data.item.name);
      $(document).prop('title', 'Yeemazon - ' + data.item.name);
      $("#itemPrice").html("$" + data.item.price);
      $("#shipping").html(" + $" + Math.floor((data.item.price / 10)) + ".99 shipping");
      $("#itemDesc").html(data.item.description);
      $("#itemClick").html("Clicks: " + data.item.clicks);
      $("#itemClickNum").html("Unique Clicks: " + data.item.usersClicked.length);
      $("#itemOrders").html("Ordered: " + data.item.numOrders);
      $("#itemID").html("Item ID: " + data.item._id);
      $("#holder").css("background-image", "url(" + data.item.link + ")");
      id = data.item._id;
    });

    //ADD TO CART BUTTON CODE
    $("#addToCart").click(() => {
      $.post("/addToCart", {
        itemID: id
      }, (data) => {
        alert(((data.status) ? "Item added to cart" : "Something went wrong"));
      });
    });
  });
}
var username, password;

//USER DATA POPULATION
function success(data) {
  if (data.redirect === "/") {
    window.location = window.location.href.split("/")[1] + "/";
    return;
  }
  $("#userGreeting").html("Hello " + data.user.username + "!");
  $("#password").html(data.user.password);
}
