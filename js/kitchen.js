
function createPlannedItem(parentElement, name, number, enabled)
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
  var slider = createSlider(box, name, enabled);
  slider.container = box;
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
  if (tabName == "buildList")
  {
    post({"action":"getWorkingList"}, setBuildList);
  }
  if (tabName == "shop")
  {
    post({"action":"getWorkingList"}, setShopList);
  }
}

function post(data, callback)
{
  var jsonData = JSON.stringify(data);
  $.post('/service/', jsonData, callback, "json");
}

function init()
{
  pickTab('invalid'); // Hide all tabs, initially.
  $(".loginForm").keypress(function (e) {
      if (e.which == 13) {
            $('#loginSubmit').click();
            return false;    //<---- Add this line
          }
  });
  post({"action":"checkLogin"}, handleCheckLogin);
}

function login()
{
  var userName=$( "input[name='username']" ).val();
  var password=$( "input[name='password']" ).val();
  post(
    {"action":"login", "userName":userName,"password":password},
    handleCheckLogin);
}
function logout()
{
  post( {"action":"logout"}, handleCheckLogin);
}

function handleCheckLogin(data, statusCode)
{
  if (data['isLoggedIn'])
  {
    setLoggedIn();
  }
  else
  {
    setNotLoggedIn()
  }
  handleMessages(data);
  if (data["enableForgot"])
  {
    $(".forgotLink").show();
  }
  else
  {
    $(".forgotLink").hide();
  }
}

function handleMessages(data)
{
  clearMessages();
  if (data["msg"])
  {
    $(".msg").text(data['msg']);
  }
  if (data["error"])
  {
    $(".error").text(data['error']);
  }
}

function clearMessages()
{
    $(".msg").text("");
    $(".error").text("");
}



function setNotLoggedIn()
{
  showTabs(["login", "register"]);
  hideTabs(["buildList", "shop", "logout", "password"]);
  pickTab("login");
}

function setLoggedIn()
{
  showTabs(["buildList", "shop", "logout"]);
  hideTabs(["login", "password", "register"]);
  pickTab("buildList");
}

function showTabs(tabNames)
{
  for (name in tabNames)
  {
    $("#" + tabNames[name]).show();
  }
}

function hideTabs(tabNames)
{
  for (name in tabNames)
  {
    $("#" + tabNames[name]).hide();
  }
}

function forgotPassword()
{
  showTabs(["password"]);
  pickTab("password");
}


function setBuildList(data, statusCode)
{
  $("#buildListBody").empty();
  for (var key in data['workingList'])
  {
    var item = data['workingList'][key];
    createPlannedItem($("#buildListBody"), item['name'], item['count'], item['active']);
  }
}

function setShopList(data, statusCode)
{
}