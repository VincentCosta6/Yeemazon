$(document).ready(function() {
      let searcher = ["popular", "under20", "yee"];
      for (let i in searcher)
        $.get("/findItems", {
          keywords: searcher[i],
          appending: (++i)
        }, function(data) {
          //CHANGE THIS LATER
          $(".itemCont").css("height", 260 * (Math.floor((data.items.length / 6)) + 1));
          $("#sessionPageback").css("height", 1100 + (260 * (Math.floor((data.items.length / 6)) + 1)));
          for (let i2 = 0; i2 < 4; i2++) {
            if (data.items[i2])
              appender(data.items[i2]._id, data.items[i2].link, data.items[i2].name, data.items[i2].price, data.items[i2].clicks, data.items[i2].usersClicked.length, data.appending);
          }
        });

      //LOAD FULL ITEM LIST
      $.get("/findItems", {
          keywords: "cool"
        }, function(data) {
          for (let i = 0; i < data.items.length; i++)
            if (data.items[i])
              appender(data.items[i]._id, data.items[i].link, data.items[i].name, data.items[i].price, data.items[i].clicks, data.items[i].usersClicked.length, 4);

          //TODO - SCALE PAGE BACKING FOR NUMBER OF ITEMS
        });
      });

    function appender(id, link, name, price, clicks, uniqueClicks, which) {
      var divCreator = "<div  id=\"" + id + "\" class=\"itemBox\"><img src=\"" + link + "\" style=\"cursor:pointer;width:140px;height:140px;margin-top:5px\"></img><br><label id=\"boxLabel\">" + name + "</label><br><label id=\"boxLabel\">$" + price + "</label></div>";
      $("#items" + which).append(divCreator);
      $("#" + id).click(function() {
        $.post("/itemClicked", {
          itemID: id
        }, (data) => {
          console.log("Clicked")
        });
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
