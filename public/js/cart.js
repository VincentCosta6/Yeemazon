$(document).ready(function(){
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

	$.get("/cartItems", function(data){
		for(var i = 0; i < data.items.length; i++) {

			let id = data.items[i]._id;
			var divCreator = "<div id=\"" + id + "\" class=\"itemBox\"><img id = \"" + id + "imger" + "\"src=\"" + data.items[i].link + "\" style=\"cursor:pointer;width:140px;height:140px;margin-top:5px\"></img><br><label>" + data.items[i].name + "</label><br><label>$" + data.items[i].price + "</label><br><label id = \""+ id + "remover\" style = \"cursor:pointer;\">Remove</label></div>";
			$(".orderHolder").append(divCreator);
			var redirect = function(){window.location = window.location.href.split("/")[1] + "/item?id=" + id};
			var remover = function(){$.post("/removeFromCart", {itemID : id}, (data) => {$("#" + id).remove();alert("Successful removal");})};
			$("#" + id + "imger").click(redirect);
			$("#" + id + "remover").click(remover);
		}

		//scale the back of the page to compensate for number of items
		$(".orderHolder").css("height", 230 * (Math.floor((data.items.length/6)) + 1));
		$("#ordersPageback").css("height", 350 * (Math.floor((data.items.length/6)) + 1));

		//update search list size to show user
		$(".itemLabel").html("Your cart has " + data.items.length + " items");

	});
});
var username, password;
function success(data)
{
	if(data.redirect === "/")
	{
		window.location = window.location.href.split("/")[1] + "/";
		return;
	}
	//$("#itemLabel").html("Your Cart (" + number of items in cart + " Items)");
}
