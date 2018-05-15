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

  if (data.user.username === "admin") {
    var adminDiv = "<br><br><br><br><br><div id=\"adminBox\"><br><input type=\"text\" id=\"name\" value=\"Item Name\" class=\"adminInput\"></input><input type=\"text\" id=\"id\" value=\"Item ID\" class=\"adminInput\"></input><input type=\"text\" id=\"desc\" value=\"Item Description\" class=\"adminInput\"></input><input type=\"text\" id=\"price\" value=\"Item Price\" class=\"adminInput\"></input><input type=\"text\" id=\"key\" value=\"Key Words\" class=\"adminInput\"></input><input type=\"text\" id=\"url\" value=\"Item Picture URL\" class=\"adminInput\"></input><div style=\"margin-top: 100px\"></div><button id=\"add\" class=\"request\">Add Item</button><button id=\"change\" class=\"request\">Change Item by ID</button><button id=\"remove\" class=\"request\">Delete Item with ID</button><div style=\"margin-top: 20px\"></div></div>";
    $("#accountBox").after(adminDiv);

    $("#add").click(() => {
      if ($("#name").val() && $("#id").val() === "Item ID" && $("#desc").val() && $("#price").val() &&
        $("#name").val() !== "Item Name" && $("#desc").val() !== "Item Description" && $("#url").val() !== "Item Picture URL") {
        //TODO -- add /addItem to routes
        $.post("/addItem", {
          name: $("#name").val(),
          _id: $("#id").val(),
          price: $("#price").val(),
          description: $("#desc").val(),
          keywords: $("#key").val().split(" "),
          link: $("#url").val()
        }, itemCall);
      } else {
        alert("Form filled out incorrectly, please check your data");
      }
    });

    //check that all text fields are filled out and send info to routes to change item
    $("#change").click(() => {
      if ($("#name").val() && $("#id").val() && $("#desc").val() && $("#price").val() &&
        $("#name").val() !== "Item Name" && $("#id").val() !== "Item ID" && $("#desc").val() !== "Item Description" &&
        $("#price").val() !== "Item Price" && $("key").val() !== "Key Words" && $("#key").val() && $("#url").val() && $("#url").val() !== "Item Picture URL") {
        //TODO -- add /addItem to routes
        $.post("/changeItem", {
            name: $("#name").val(),
            _id: $("#id").val(),
            price: $("#price").val(),
            link: $("#url").val(),
            description: $("#desc").val(),
            keywords: $("#key").val().split(" ")
          },
          itemCall);
      } else {
        alert("Form filled out incorrectly, please check your data");
      }
    });

    //check that ID is filled in and send to routes to delete item
    $("#remove").click(() => {
      if ($("#id").val() && $("#id").val() !== "Item ID")
        $.post("/deleteItem", {
            _id: $("#id").val()
          },
          itemCall);
      else
        alert("ID not input correctly, please check your data");
    });

    $(".loginInput").focus(function() {
      if ($(this).val() == "Item Name" || $(this).val() == "Item ID" || $(this).val() == "Item Description" ||
        $(this).val() == "Item Picture URL" || $(this).val() == "Item Price" || $(this).val() == "Key Words") {
        $(this).val('');
      }
    });

    var blurIDs = ["#name", "#id", "#desc", "#price", "#key", "#url"];
    var defaultText = ["Item Name", "Item ID", "Item Description", "Item Price", "Key Words", "Item Picture URL"];
    for (let i in blurIDs)
      $(blurIDs[i]).blur(() => {
        if ($(blurIDs[i]).val() == "")
          $(blurIDs[i]).val(defaultText[i]);
      });
  }
}

function itemCall(data) {
  alert(data.reason);
}
function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}
