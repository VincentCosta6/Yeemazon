$(document).ready(function(){
	$.get("/userInfo", success);
	$("#logout").click(() => {
		$.post("/logout", (data) => {
			window.location = window.location.href.split("/")[1] + data.redirect;
		});
	});
	$(".loginHeader").click(() => {
		window.location = window.location.href.split("/")[1] + "/session";
	});
	$("#cart").click(() => {
		window.location = window.location.href.split("/")[1] + "/cart";
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
	$("#username").html("Username: " + data.user.username);
	$("#email").html("Email: " + data.user.email);

	if (data.user.username === "admin") {
		var adminDiv = "<div id=\"adminBox\"><br><input type=\"text\" id=\"name\" value=\"Item Name\" class=\"loginInput\"></input><input type=\"text\" id=\"id\" value=\"Item ID\" class=\"loginInput\"></input><input type=\"text\" id=\"desc\" value=\"Item Description\" class=\"loginInput\"></input><input type=\"text\" id=\"price\" value=\"Item Price\" class=\"loginInput\"></input><input type=\"file\" id=\"pic\" value=\"Picture\" class=\"loginInput\"></input><input type=\"text\" id=\"key\" value=\"Key Words\" class=\"loginInput\"></input><div style=\"margin-top: 30px\"></div><button id=\"add\" class=\"request\">Add Item</button><button id=\"change\" class=\"request\">Change Item by ID</button><button id=\"remove\" class=\"request\">Delete Item with ID</button><div style=\"margin-top: 20px\"></div><button id=\"return\" class=\"request\">Return to Catalog</button></div>";
		$("#accountBox").after(adminDiv);

		$("#add").click(() => {
			if ($("#name").val() && $("#id").val() === "Item ID" && $("#desc").val() && $("#price").val() &&
			$("#name").val()!=="Item Name" && $("#desc").val()!=="Item Description") {
	        	//TODO -- add /addItem to routes
				$.post("/addItem", {name:$("#name").val(),_id:$("#id").val(),price:$("#price").val(),description:$("#desc").val(), keywords : $("#key").val().split(" ")
				}
				,itemCall);
			} else {
				alert("Form filled out incorrectly, please check your data");
			}
		});

		//check that all text fields are filled out and send info to routes to change item
		$("#change").click(() => {
			if($("#name").val() && $("#id").val() && $("#desc").val() && $("#price").val() &&
			$("#name").val()!=="Item Name" && $("#id").val()!=="Item ID" && $("#desc").val()!=="Item Description" &&
	        $("#price").val()!=="Item Price" && $("key").val() !== "Key Words" && $("#key").val()) {
				//TODO -- add /addItem to routes
				$.post("/changeItem", {name:$("#name").val(),_id:$("#id").val(),price:$("#price").val(),link:"images/",description:$("#desc").val(), keywords : $("#key").val().split(" ")},
				itemCall);
			} else {
				alert("Form filled out incorrectly, please check your data");
			}
		});

		//check that ID is filled in and send to routes to delete item
		$("#remove").click(() => {
			if($("#id").val() && $("#id").val()!=="Item ID")
				$.post("/deleteItem", {_id:$("#id").val()},
				itemCall);
			else
				alert("ID not input correctly, please check your data");
		});

		$(".loginInput").focus( function() {
	        if ( $(this).val()=="Item Name" || $(this).val()=="Item ID" || $(this).val()=="Item Description" ||
	        $(this).val()=="Item Picture Link" || $(this).val()=="Item Price" || $(this).val()=="Key Words") {
	            $(this).val('');
	        }
	    });

			var blurIDs = ["#name", "#id", "#desc", "#link", "#price", "#key"];
			var defaultText = ["Item Name", "Item ID", "Item Description", "Item Picture Link", "Item Price", "Key Words"];
			for(let i in blurIDs)
				$(blurIDs[i]).blur(() => {
					if($(blurIDs[i]).val()=="")
						$(blurIDs[i]).val(defaultText[i]);
				});
	}
}
function itemCall(data)
{
	alert(data.reason);
}
