const PLANNED_BUILD = "build";
const PLANNED_SHOP = "shop";
var activeTab = null;

var loadedTabs = {PLANNED_BUILD: false, PLANNED_BUILD:false};

function item_type(id, name, aisle, count, enabled, done)
{
  this.id = id;
  this.name = name;
  this.aisle = aisle;
  this.count = count;
  this.enabled = enabled;
  this.done = done;

  this.toList = function()
  {
    return [this.id, this.name, this.aisle, this.count, this.enabled, this.done];
  }
}

function item_collection()
  {
     this.add = function(name, value)
       {
         this.collection[name] = value;
         this.ordering.push(name);
       };
     this.remove = function(name)
       {
         if (this.collection[name])
         {
           delete this.collection[name];
           var index = this.ordering.indexOf(name);
           if (index >=0)
           {
             this.ordering.splice(index,1);
           }
         }
       };
     this.get = function (name)
       {
         return this.collection[name];
       };

     this.toList = function()
      {
        var out = [];
        for (var i = 0; i < this.ordering.length; i++)
        {
          var item = this.collection[this.ordering[i]];
          out.push(item.toList());
        }
        return out;
      };
     this.toPrintableView = function(parentEl)
     { 
       for (aisleIndex in this.aisleOrder)
       {
         var aisleName = this.aisleOrder[aisleIndex];
         var aisle = $('<div class="printAisle">').appendTo(parentEl);
         aisle.append($('<div class="printAisleLabel">' + aisleName + '</div>'));
         for (itemIndex in this.ordering)
         {
           var itemId = this.ordering[ itemIndex];
           var item = this.collection[itemId];
           if (item.aisle == aisleName)
           {
             aisle.append($('<div class="printItem">' + item.count + " " + item.name + '</div>'));
           }
         }

       }
     };
     this.clear = function()
      {
        this.collection = {};
        this.ordering = [];
        this.aisles = [];
        this.aisleOrder = [];
        this.aisleNames = {};
      };
     this.setOrder = function(aisleOrder, aisles)
      {
        this.ordering = [];
        this.aisleOrder = aisleOrder;
        for (i in aisleOrder)
        {
          var aisleName = aisleOrder[i];
          for (j in aisles[aisleName])
          {
            var id = aisles[aisleName][j];
            this.collection[id].aisle = aisleName;
            this.ordering.push(id);
          }
        }
      };
     this.addAisle = function(aisleId, aisleName)
     {
       this.aisles .push(aisleId);
       this.aisleOrder.push(aisleName);
       this.aisleNames[aisleName] = aisleId;
     }
     this.getUniqueId = function(desiredId)
     {
       var id = desiredId;
       var count = 0;
       while (id in this.collection)
       {
         id = desiredId + count;
         count++;
       }
       while (id in this.aisles)
       {
         id = desiredId + count;
         count++;
       }
       return id;
     }
     this.collection = {};
     this.aisles = [];
     this.aisleOrder = [];
     this.aisleNames = {};
     this.ordering = [];

  };

var items = {[PLANNED_BUILD]: new item_collection(), [PLANNED_SHOP] : new item_collection()};

function validateParsePosInt(val)
{
  var i = parseInt(val, 10);  
  var f = parseFloat(val);
  return $.isNumeric(val) &&  (i == f) && i >= 0;
}

function nameToId(prefix, name, planType)
{
  name = name.replace(/[^a-zA-Z0-9]+/g,'');
  name = $.trim(name);
  name = name.replace(/^[0-9]+/,'');
  if (!name)
  {
    return prefix;
  }
  return prefix  + name;
}

function createPlannedItem(parentElement, id, name, aisle, number, enabled, done, planType)
{
  if (!id)
  {
    id = nameToId('id_', name, planType);
  }
  var isBuild = planType == PLANNED_BUILD;
  if (!isBuild)
  {
    id = 's_' + id;
  }
  id = items[planType].getUniqueId(id);
  items[planType].add(id, new item_type(id, name, aisle, number, enabled, done));
  var box = document.createElement("div");
  box.className = "Item";
  box.id = id;
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
        if (!items[planType].get(id))
        {
           return;
        }
        var newValue = event.target.value;
        if (!validateParsePosInt(newValue))
        {
          event.target.value = items[planType].get(id).count;
          event.target.focus();
          return false;
        }
        items[planType].get(id).count = event.target.value;
      });
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
  var sliderIndex = isBuild ? 'enabled' : 'done';
  var sliderState = isBuild ? enabled: !done;
  var sliderModel =
    {
      get: function ()
      {
        return items[planType].get(id)[sliderIndex];
      },
      set: function (val)
      {
        items[planType].get(id)[sliderIndex] = val;
        if (isBuild)
        {
          num.prop('disabled', !val);
        }
        else
        {
          if (loadedTabs[PLANNED_SHOP])
          {
            saveDoneState(id.substring(2), !val);
          }
        }
      }
    };
  var slider = createSlider(box, id, sliderState, sliderModel);
  slider.container = box;
  if (isBuild)
  {
    $("<span>X</span>").addClass("deleteItem").click(
      function()
      {
        items[planType].remove(id);
        box.remove();
      }).appendTo(box);
  }
  return id;
}

function createAisle(aisleID, aisle)
{
  aisleDiv = $('<div class="aisle" id="' + aisleID + '"><span class="aisleLabel">' + aisle + '</span></div>');
  aisleDiv.sortable(
  {axis: 'y', items:'.Item',stop: function (event, ui) {resolveSort();}});
  aisleName = aisle;
  $("#aisleSorter").append(aisleDiv);
  items[PLANNED_BUILD].addAisle(aisleID, aisleName);
}

function linkAisles()
{
  var sortableAisles = [];
  $("#aisleSorter").find(".aisle").each(function () {sortableAisles.push($(this));});
  for (var firstIdx = 0; firstIdx < sortableAisles.length; firstIdx++)
  {
    var otherAisles = []
    for (var secondIdx = 0; secondIdx < sortableAisles.length; secondIdx++)
    {
      if (firstIdx != secondIdx)
      {
        otherAisles.push('#' + sortableAisles[secondIdx].attr('id')); 
      }
    }
    if (otherAisles.length > 0)
    {
      sortableAisles[firstIdx].sortable("option", "connectWith", otherAisles.join());
    }
  }
}

function hideAddDlg()
{
  $("#modal").hide();
  $("#buildListTab").focus();
}

var lastAisle = null;
function fillAisleSelect()
{
  var aisleSelect = $("#aisleSelect");
  aisleSelect.empty();
  for (name in items[PLANNED_BUILD].aisleNames)
  {
    aisleSelect.append($('<option value="' + name + '">' + name + '</option>'));
  }
  if (lastAisle && lastAisle in items[PLANNED_BUILD].aisleNames)
  {
    aisleSelect.val(lastAisle);
  }
}

function showAddDlg()
{
  fillAisleSelect();
  $("#modal").show();
  $('.modalDialog').hide();
  $('#createItemDialog').show();
  $("#modal").find("[name='itemName']").val('').focus();
}
function showAddAisleDlg()
{
  $("#createAisleError").text("");
  $("#modal").show();
  $('.modalDialog').hide();
  $('#createAisleDialog').show();
  $("#modal").find("[name='aisleName']").val('').focus();
}

function showPrintableView(item_collection)
{
  $("#createAisleError").text("");
  $("#modal").show();
  $('.modalDialog').hide();
  $('#printView').show();
  $('#printView').find('.content').empty();
  item_collection.toPrintableView($('#printView').find('.content'));
  $('#printView').focus();
}

function addItem(itemName, aisleName)
{
  if (!itemName)
  {
    return;
  }
  lastAisle = aisleName;
  var aisleId = items[PLANNED_BUILD].aisleNames[aisleName];
  itemId = createPlannedItem($("#" + aisleId), null, itemName, aisleName,1, true, false, PLANNED_BUILD);
  hideAddDlg();
  $("#" + itemId).find('.itemNumber').focus().select();
  resolveSort();
}

function addAisle(aisleName)
{
  if (!aisleName)
  {
    return;
  }
  if (aisleName in items[PLANNED_BUILD].aisleNames)
  {
    $("#createAisleError").text("Please enter a unique aisle name");
    return;
  }
  var aisleID = items[PLANNED_BUILD].getUniqueId(nameToId('aisle_', aisleName));
  createAisle(aisleID, aisleName);
  linkAisles();
  hideAddDlg();
}


function pickTab(tabName, clearMessage=true)
{
  var previousTab = activeTab;
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
     post({"action":"getShopList"}, setBuildList);
  }
  if (tabName == "shop")
  {
    if (previousTab = "buildList") 
    {
      post({"action":"setShopList", "list":items[PLANNED_BUILD].toList()}, setShopList);
    }
    else
    {
      post({"action":"getShopList"}, setShopList);
    }
  }
  activeTab = tabName;
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
  $("#buildListTab").attr('tabindex',0);
  $("#buildListTab").on('keydown', function (e) {
      if (e.ctrlKey && e.key == 'a')
      {
        showAddDlg();
        return false;
      }
  });
  $("#buildListTab").on('keydown', function (e) {
      if (e.ctrlKey && e.key == 'l')
      {
        showAddAisleDlg();
        return false;
      }
  });
  $("#modal").find('.close').click(function() {hideAddDlg();});
  $("#addItemButton").click(function()
    {
      addItem(
        $("#modal").find("[name='itemName']").val(),
        $("#aisleSelect").val()); });
  $("#addAisleButton").click(function() {addAisle($("#modal").find("[name='aisleName']").val()); });
  $("#createItemDialog").keypress(function (e) {
      if (e.which == 13) {
            $('#addItemButton').click();
            return false;
          }
  });
  $("#createAisleDialog").keypress(function (e) {
      if (e.which == 13) {
            $('#addAisleButton').click();
            return false;
          }
  });
  $("#modal").keydown(function (e)
    {
      if (e.key === "Escape")
    {
      hideAddDlg();
    }
    });
  post({"action":"checkLogin"}, handleCheckLogin);
  $("#printView").on('keydown', function (e) {
      if (e.ctrlKey && e.key == 'a')
      {
        selectText($("#printView").find('.content'));
        return false;
      }
  });
}

function selectText(node)
{
  if (document.body.createTextRange)
  {
    var range = document.body.createTextRange();
    range.moveToElementText(node.get(0));
    rang.select();
  }
  else if (window.getSelection)
  {
    var selection = window.getSelection();
    var range = document.createRange();
    range.selectNodeContents(node.get(0));
    selection.removeAllRanges();
    selection.addRange(range);
  }

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
  cleanup();
  post( {"action":"logout"}, handleCheckLogin);
}

function cleanup()
{
  loadedTabs = {PLANNED_BUILD: false, PLANNED_BUILD:false};
  items = {[PLANNED_BUILD]: new item_collection(), [PLANNED_SHOP] : new item_collection()};
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

function saveList(list)
{
  post(
    {"action":"saveList", "list": list.toList()},
    handleCheckLogin);
}

function saveDoneState(id, val)
{
  post(
    {"action":"saveDoneState", "id": id, "doneState": val},
    handleCheckLogin);
}

function revertBuildList()
{
  post({"action":"getWorkingList"}, setBuildList);
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
    if (!data['keepTab'])
    {
      setLoggedIn();
    }
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

function resolveSort()
{
  var aisleIdOrder = $('#aisleSorter').sortable("toArray");
  var aisles = {};
  var aisleOrder = [];
  for (i in aisleIdOrder)
  {
    var aisleId = aisleIdOrder[i];
    var aisle = $("#" + aisleId);
    var aisleName = aisle.find('.aisleLabel').text();
    aisleOrder.push(aisleName);
    aisles[aisleName] = aisle.sortable("toArray"); 
  }
  items[PLANNED_BUILD].setOrder(aisleOrder, aisles);
}

function setBuildList(data, statusCode)
{
  if (!checkLoggedIn(data))
  {
    return;
  }
  $("#buildListBody").empty();
  var aisleSorter = $("<div id='aisleSorter'>").
    sortable(
      {axis: 'y', handle:".aisleLabel",items:'.aisle',stop: function (event, ui) {resolveSort();}}).
    disableSelection().appendTo($("#buildListBody"));
  items[PLANNED_BUILD].clear();
  var aisleDiv = null;
  var aisleName = null;
  for (var key in data['workingList'])
  {
    var item = data['workingList'][key];
    var aisle = item['aisle'];
    if (aisle != aisleName)
    {
      var aisleID = items[PLANNED_BUILD].getUniqueId(nameToId('aisle_', aisle));
      createAisle(aisleID, aisle);
      aisleDiv = $("#" + aisleID);
      aisleName = aisle;
    }
    createPlannedItem(aisleDiv, item['id'], item['name'], item['aisle'], item['count'], item['active'], item['done'], PLANNED_BUILD);
  }

  linkAisles();

  $("<div class='centeredItem'></div>").appendTo("#buildListBody").append($("<button title='Add item (Ctrl-A)'>+</button>").click( showAddDlg));
  var buttonPane = $("<div></div>").addClass("buttonPane").appendTo("#buildListBody");
  $("<button>Save</button>").click( function() { saveList(items[PLANNED_BUILD])}).appendTo(buttonPane);
  $("<button>Revert</button>").click( function() { revertBuildList()}).appendTo(buttonPane);
  $("<button title='Ctrl-L'>Add Aisle</button>").click( showAddAisleDlg).appendTo(buttonPane);
  loadedTabs[PLANNED_BUILD] = true;
  $("#buildListTab").focus();
}

function setShopList(data, statusCode)
{
  loadedTabs[PLANNED_SHOP] = false;
  if (!checkLoggedIn(data))
  {
    return;
  }
  $("#shopListBody").empty();
  var list = $("<div>").appendTo($("#shopListBody"));
  items[PLANNED_SHOP].clear();
  var aisleName = null;
  for (var key in data['workingList'])
  {
    var item = data['workingList'][key];
    if (item['active'])
    {
      var aisle = item['aisle'];
      if (aisle != aisleName)
      {
        aisleName = aisle;
        var aisleID = items[PLANNED_SHOP].getUniqueId(nameToId('s_aisle_', aisle));
        var aisleDiv = $('<div class="aisle" id="' + aisleID + '"><span class="aisleLabel">' + aisle + '</span></div>');
        items[PLANNED_SHOP].addAisle(aisleID, aisleName);
        list.append(aisleDiv);
      }
      createPlannedItem(list, item['id'], item['name'], item['aisle'], item['count'], item['active'], item['done'], PLANNED_SHOP);
    }
  }

  var buttonPane = $("<div></div>").addClass("buttonPane").appendTo("#shopListBody");
  $("<button>Reset</button>").click( function() { 
      post({"action":"resetDoneState"}, setShopList);}).appendTo(buttonPane);
  $("<button>Printable View</button>").click( function() { showPrintableView(items[PLANNED_SHOP]); }).appendTo(buttonPane);
  loadedTabs[PLANNED_SHOP] = true;
}
