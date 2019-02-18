
function createPlannedItem(parentElement, name, number)
{
  var box = document.createElement("div");
  box.className = "Item";
  var nameSpan = document.createElement("span");
  nameSpan.className = "itemName";
  nameSpan.innerText= name;
  var num = document.createElement("span");
  num.className = "itemNumber";
  num.innerText= number;
  parentElement.append(box);
  box.appendChild(nameSpan);
  box.appendChild(num);
  var slider = createSlider(box, name);
}


function pickTab(tabName)
{
  tabBodyName = tabName + "Tab";
  $(".tabBody").each(function(index) {
    if ($(this).attr('id') == tabBodyName)
    {
      $(this).show();
    }
    else
    {
      $(this).hide();
    }
  });
  $(".tab").each(function(index) {
    if ($(this).attr('id') == tabName)
    {
      $(this).addClass("active");
    }
    else
    {
      $(this).removeClass("active");
    }
  });
}
