$(document).ready(() => {
  $("#updatef").toggle(false);
  $("#updater").toggle(false);
  $('#which input').on('change', function() {
   var decide = $('input[name=radioName]:checked', '#which').val() == "Add Item";
   $("#addf").toggle(decide);
   $("#updatef").toggle(!decide);

 });

 $(".adminInput").focus(function() {
   if ($(this).val() == "SearchID" || $(this).val() == "Item Name" || $(this).val() == "Item ID" || $(this).val() == "Item Description" ||
     $(this).val() == "Item Picture URL" || $(this).val() == "Item Price" || $(this).val() == "Key Words") {
     $(this).val('');
   }
 });
 $("#changeID").click(() => {
   $.get("/findItem", {_id: $("#IDSearch").val()}, (data) => {
     if(data.failed) {
      $("#updater").toggle(false);
      $("#IDSearch").val("");
      alert("Failed");
    }
    else {
      $("#updater").toggle(true);
      $("#name2").val(data.item.name);
      $("#desc2").val(data.item.description);
      $("#price2").val(data.item.price);
      var join = "";
      for(let i in data.item.keywords)
      join += data.item.keywords[i] + " ";
      $("#key2").val(join);
      $("#url2").val(data.item.link);
    }
   });
 });
 var blurIDs = ["#IDSearch", "#name", "#id", "#desc", "#price", "#key", "#url"];
 var defaultText = ["SearchID", "Item Name", "Item ID", "Item Description", "Item Price", "Key Words", "Item Picture URL"];
 for (let i in blurIDs) {
   $(blurIDs[i]).blur(() => {
     if ($(blurIDs[i]).val() == "")
       $(blurIDs[i]).val(defaultText[i]);
   });
   $(blurIDs[i] + "2").blur(() => {
     if ($(blurIDs[i] + "2").val() == "")
       $(blurIDs[i] + "2").val(defaultText[i]);
   });
 }


  $('#addf').on('submit', (function (e) {
    e.preventDefault();
    var formData = new FormData(this);
    console.log($("#url").val());
    $.ajax({
            type: 'POST',
            url:"/fileUpload",
            data: formData,
            cache: false,
            contentType: false,
            processData: false,
            success: function (data) {
                $.post("/addItem", {name: $("#name").val(), description: $("#desc").val(), price: $("#price").val(), keywords: $("#key").val(), picName: data.key}, () => {
                  alert(data.reason);
                });
            },
            error: function (data) {
                console.log(data.reason);
            }
    });
  }));
  $('#updatef').on('submit', (function (e) {
    e.preventDefault();
    /*var formData = new FormData(this);
    console.log($("#url").val());
    $.ajax({
            type: 'POST',
            url:"/fileUpload",
            data: formData,
            cache: false,
            contentType: false,
            processData: false,
            success: function (data) {
                $.post("/addItem", {name: $("#name").val(), description: $("#desc").val(), price: $("#price").val(), keywords: $("#key").val(), picName: data.key}, () => {
                  alert(data.reason);
                });
            },
            error: function (data) {
                console.log(data.reason);
            }
    });*/
  }));
});
