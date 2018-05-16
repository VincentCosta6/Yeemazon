$(document).ready(function() {
  $.get("/myOrders", (data) => {
    let orders = data.string.split("/");
    for (let i in orders) {
      var diver = "<br><div id = \"c" + i + "\" class=\"itemBox\">";
      let items = orders[i].split(",");
      for (let i2 in items) {
        let vars = items[i].split(":");
        let amount = vars[0];
        let id = vars[1];
        $.get("/getItemInfo", {
          _id: id
        }, await (data2) => {
          var diver += "<div id=\"" + id + "\" class=\"itemBox\"><img id = \"" + id + "imger" + "\"src=\"" + data2.items[i].link + "\" style=\"cursor:pointer;width:140px;height:140px;margin-top:5px\"></img><br><label>" + data2.items[i].name + "</label><br><label>$" + data2.items[i].price + "</label><br><label>" + amount + "</label><br></div>";
        });
      }
      diver += "</div>";
    }
  });
});
