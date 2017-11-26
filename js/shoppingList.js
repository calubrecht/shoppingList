function createShoppingList(parentElement, userName)
{
  var shoppingNode = document.createElement("div");
  shoppingNode.className = "ShoppingList";
  createLabeledSlider(parentElement, "Bacon", "bacon");
  createLabeledSlider(parentElement, "Eggs", "eggs");
  createLabeledSlider(parentElement, "Nonlinear Pasta", "nonlinearPasta");
  parentElement.appendChild(shoppingNode);
}

function loadShoppingList()
{
  var shoppingListTab = document.getElementById("listTab");
  createShoppingList(shoppingListTab, "Bob");
}
