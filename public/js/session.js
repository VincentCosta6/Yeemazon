$(document).ready(function(){
	$.get("/userInfo", success);
	$("#logout").click(() => {
		$.post("/logout", (data) => {
			window.location = window.location.href.split("/")[1] + data.redirect;
		});
	});
	$("#account").click(() => {
		window.location = window.location.href.split("/")[1] + "/account";
	});
	$("#cart").click(() => {
		window.location = window.location.href.split("/")[1] + "/cart";
	});
	$("#request").click(() => {
		if ($("#search").val() && $("#search").val() !== "Search for an item")
			window.location = window.location.href.split("/")[1] + "/search?query=" + $("#search").val().toLowerCase();
	});

	//grab first 6 "popular items", "under20", and "yee"
	let searcher = ["popular", "under20", "yee"];
	for(let i in searcher)
		$.get("/findItems", {keywords:searcher[i], appending : (++i)}, function(data) {
			for(let i2 = 0; i2 < 6; i2++)
				if(data.items[i2])
					appender(data.items[i2]._id, data.items[i2].link, data.items[i2].name, data.items[i2].price, data.items[i2].clicks, data.items[i2].usersClicked.length, data.appending);
		});
});

	$(document).keypress(function(e){
	  if($("#search").val().includes("<")||$("#search").val().includes(">"))
	  	return alert("Improper search please dont use < or >");
      if(e.keyCode == 13 && $("#search").val() && $("#search").val() !== "Search for an item")
      	$('#request').click();

  	  if (!($("#search").val()) || $("#search").val() == "Search for an item")
    		$('#request').prop('disabled', true);
      else
    		$('#request').prop('disabled', false);

    $('#request').prop('disabled', true);

    $("#search").focus( function() {
        if ( $(this).val()=="Search for an item") {
            $(this).val('');
        }
    });

    $("#search").blur( function() {
        if ( $(this).val()=="") {
            $(this).val('Search for an item');
        }
    });
});
function appender(id, link, name, price, clicks, uniqueClicks, which) {
	var divCreator = "<div  id=\"" + id + "\" class=\"itemBox\"><img src=\"" + link + "\" style=\"cursor:pointer;width:140px;height:140px;margin-top:5px\"></img><br><label>" + name + "</label><br><label>$" + price + "</label></div>";
	$("#items" + which).append(divCreator);
	$("#" + id).click(function(){$.post("/itemClicked", {itemID : id}, (data) => {console.log("Clicked")}); window.location = window.location.href.split("/")[1] + "/item?id=" + id;});
}
var username, password;
function success(data)
{
	if(data.redirect === "/")
	{
		window.location = window.location.href.split("/")[1] + "/";
		return;
	}
	$("#userGreeting").html("Hello " + data.user.username + "!");
	$("#password").html(data.user.password);

	if (data.user.username === "admin") {
		$("#toolbarRight").append("<button id=\"admin\" class=\"toolbarButton\">ADMIN ACTIONS</button>");
		$("#admin").click(function(){window.location = window.location.href.split("/")[1] + "/admin"});
	}
}
