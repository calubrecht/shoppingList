function createShoppingList(parentElement, userName)
{
  var shoppingNode = document.createElement("div");
  shoppingNode.className = "ShoppingList";
  createLabeledSlider(shoppingNode, "Bacon", "bacon");
  createLabeledSlider(shoppingNode, "Eggs", "eggs");
  createLabeledSlider(shoppingNode, "Nonlinear Pasta", "nonlinearPasta");
  parentElement.appendChild(shoppingNode);
}

function loadShoppingList()
{
  var shoppingListTab = document.getElementById("listTab");
  createShoppingList(shoppingListTab, "Bob");

  var xmlhttp = new XMLHttpRequest();
  xmlhttp.onreadystatechange = function()
  {
    if (xmlhttp.readyState == 4 && xmlhttp.status ==200)
    {
      try
      {
        var response = JSON.parse(xmlhttp.responseText);
        if (response["success"])
        {
          var oldNodes = shoppingListTab.getElementsByClassName("ShoppingList");
          for (var nodeIdx = 0; nodeIdx < oldNodes.length; nodeIdx++)
          {
            shoppingListTab.removeChild(oldNodes[nodeIdx]);
          }
          var shoppingNode = document.createElement("div");
          shoppingNode.className = "ShoppingList";
          var items = response["items"];
          for (var i = 0; i < items.length; i++)
          {
            createLabeledSlider(shoppingNode, items[i]["ItemName"], items[i]["Id"]);
          }
          shoppingListTab.appendChild(shoppingNode);
        }
      }
      catch(e)
      {
        var i = e;
      }
    }
  }
  xmlhttp.open("POST", "", true);
  xmlhttp.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');
  formData = {};
  formData["action"] = "getList";
  xmlhttp.send(JSON.stringify(formData));

}
