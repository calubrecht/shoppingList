const PLANNED_BUILD = "build";
const PLANNED_SHOP = "shop";

var items = {[PLANNED_BUILD]:{}, [PLANNED_SHOP]:{}};

function validateParsePosInt(val)
{
  var i = parseInt(val, 10);  
  var f = parseFloat(val);
  return $.isNumeric(val) &&  (i == f) && i >= 0;
}

function createPlannedItem(parentElement, name, number, enabled, planType)
{
  items[planType][name] = [name, number, enabled];
  var isBuild = planType == PLANNED_BUILD;
  var box = document.createElement("div");
  box.className = "Item";
  var nameSpan = document.createElement("span");
  nameSpan.className = "itemName";
  nameSpan.innerText= name;
  var num;
  if (isBuild)
  {
    num = $("<input></input>");
    num.addClass( "itemNumber");
    num.val(number);
    num.focusout(function()
      {
        var newValue = event.target.value;
        if (!validateParsePosInt(newValue))
        {
          event.target.value = items[planType][name][1];
          event.target.focus();
          return false;
        }
        items[planType][name][1] = event.target.value; console.log("Set items[" + planType +"][" + name +"] to " + event.target.value);});
  }
  else
  {
    num = $("<span></span>");
    num.addClass( "itemNumber");
    num.text(number);
  }
  parentElement.append(box);
  box.appendChild(nameSpan);
  box.appendChild(num.get(0));
  var sliderModel =
    {
      get: function ()
      {
        return items[planType][name][2];
      },
      set: function (val)
      {
        items[planType][name][2] = val;
        if (isBuild)
        {
          num.prop('disabled', !val);
        }
      }
    };
  var slider = createSlider(box, name, enabled, sliderModel);
  slider.container = box;
  if (isBuild)
  {
    $("<span>X</span>").addClass("deleteItem").click(
      function()
      {
        delete items[planType][name];
        box.remove();
      }).appendTo(box);
  }
}


function pickTab(tabName, clearMessage=true)
{
  if (clearMessage)
  {
    clearMessages();
  }
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
            return false;
          }
  });
  $(".registerForm").keypress(function (e) {
      if (e.which == 13) {
            $('#registerSubmit').click();
            return false;
          }
  });
  $(".passwordForm").keypress(function (e) {
      if (e.which == 13) {
            $('#passwordSubmit').click();
            return false;
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

function register()
{
  var userName=$( "input[name='r_username']" ).val();
  var password=$( "input[name='r_password']" ).val();
  var confirmPassword=$( "input[name='r_confirmPassword']" ).val();
  var displayName=$( "input[name='r_displayName']" ).val();
  var email=$( "input[name='r_email']" ).val();

  if (!userName)
  {
    $(".error").text("Please supply a username");
    return;
  }
  if (!password)
  {
    $(".error").text("Please supply a password");
    return;
  }
  if (password != confirmPassword)
  {
    $(".error").text("Passwords do not match");
    return;
  }
  if (!displayName)
  {
    displayName = userName;
  }
  post(
    {"action":"register", "userName":userName,"password":password,"displayName":displayName,"email":email},
    handleRegister);
}

function resetPassword()
{
  var userName=$( "input[name='p_username']" ).val();
  post(
    {"action":"resetPassword", "userName":userName},
    handleCheckLogin);
}

function doResetPassword()
{
  var password=$( "input[name='password']" ).val();
  var confirmPassword=$( "input[name='confirmPassword']" ).val();
  var token=$( "input[name='token']" ).val();
  if (!password)
  {
    $(".error").text("Please supply a password");
    return;
  }
  if (password != confirmPassword)
  {
    $(".error").text("Passwords do not match");
    return;
  }
  post(
    {"action":"doResetPassword", "password":password, "token":token},
    handleDoReset);
}

function handleDoReset(data, statusCode)
{
  if (data['success'])
  {
    alert("You have successfully changed your password. Please login in.");
    document.location.href="/";
  }
  else
  {
    handleMessages(data);
  }
}

function checkLoggedIn(data)
{
  if (!data['isLoggedIn'])
  {
    setNotLoggedIn()
    $(".msg").text("Session has timed out, please login again");
    return false;
  }
  return true;
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


function handleRegister(data, statusCode)
{
  if (data['isLoggedIn'])
  {
    $( "input[name='r_username']" ).val('');
    $( "input[name='r_password']" ).val('');
    $( "input[name='r_confirmPassword']" ).val('');
    $( "input[name='r_displayName']" ).val('');
    $( "input[name='r_email']" ).val('');
    setLoggedIn();
  }
  handleMessages(data);
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
  pickTab("login", false);
}

function setLoggedIn()
{
  showTabs(["buildList", "shop", "logout"]);
  hideTabs(["login", "password", "register"]);
  pickTab("buildList", false);
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
  var userName=$( "input[name='username']" ).val();
  $( "input[name='p_username']" ).val(userName);
  pickTab("password");
}


function setBuildList(data, statusCode)
{
  if (!checkLoggedIn(data))
  {
    return;
  }
  $("#buildListBody").empty();
  for (var key in data['workingList'])
  {
    var item = data['workingList'][key];
    createPlannedItem($("#buildListBody"), item['name'], item['count'], item['active'], PLANNED_BUILD);
  }
  var buttonPane = $("<div></div>").addClass("buttonPane").appendTo("#buildListBody");
  $("<button>Save</button>").click( function() { alert("YO")}).appendTo(buttonPane);
  $("<button>Revert</button>").click( function() { alert("YO YO")}).appendTo(buttonPane);
}

function setShopList(data, statusCode)
{
}
