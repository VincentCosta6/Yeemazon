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

	//check that all text fields are filled out and send info to routes to add item
	$("#add").click(() => {
		if ($("#name").val() && $("#id").val() === "Item ID" && $("#desc").val() && $("#price").val() &&
		$("#name").val()!=="Item Name" && $("#desc").val()!=="Item Description") {
        	//TODO -- add /addItem to routes
			$.post("/addItem", {name:$("#name").val(),_id:$("#id").val(),price:$("#price").val(),description:$("#desc").val(), keywords : $("#key").val().split(" "),
			pic:$("#pic").prop('files')[0]}
			,function(data){if(data.error)alert("ERROR: Item not added, please try again"); else alert("Item successfully added")});
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
			function(data){if(data.error)alert("ERROR: Item not changed, please check data and try again"); else alert(data.status)});
		} else {
			alert("Form filled out incorrectly, please check your data");
		}
	});

	//check that ID is filled in and send to routes to delete item
	$("#remove").click(() => {
		if($("#id").val() && $("#id").val()!=="Item ID")
			$.post("/deleteItem", {_id:$("#id").val()},
			function(data){if(data.error)alert("ERROR: Item not removed, please check ID try again"); else alert("Item successfully removed")});
		else
			alert("ID not inputted correctly, please check your data");
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
}
