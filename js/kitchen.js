const PLANNED_BUILD = "build";
const PLANNED_SHOP = "shop";
const PLANNED_MENU = "menu";
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
var activeTab = null;

var loadedTabs = {build: false, shop:false};
var tabTS = {shop: "", menu:""};
var selectingFromRecipes = false;


var CALLBACK_REGISTRY= {};
window.CALLBACK_REGISTRY = CALLBACK_REGISTRY;

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
    if (this.aisle == null || this.aisle.trim() == '')
    {
      this.aisle = 'UNKNOWN';
    }
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
     this.printLine = function (aisle, item)
     {
       aisle.append($('<div class="printItem">' + item.count + " " + item.name + '</div>'));
     }
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
             this.printLine(aisle, item);
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
     this.findOrder = function(itemId)
     {
       var i = 0;
       while ( i < this.ordering.length)
       {
         if (this.ordering[i] == itemId)
         {
           return i;
         }
         i++;
       }
     }
     this.renameAisle = function(oldName, newName)
     {
       for (i in this.aisleOrder)
       {
         if (this.aisleOrder[i] == oldName)
         {
           this.aisleOrder[i] = newName;
         }
       }
       this.aisleNames[newName] = this.aisleNames[oldName];
       delete this.aisleNames[oldName];
       for (j in this.collection)
       {
         var item = this.collection[j];
         if (item.aisle == oldName)
         {
           item.aisle = newName;
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
       while (this.aisles.includes(id))
       {
         id = desiredId + count;
         count++;
       }
       return id;
     }
     this.allDone = function()
     {
       for (v in this.collection)
       {
         if (this.collection[v]['done'])
         {
           return false;
         }
       }
       return true;
     }
     this.collection = {};
     this.aisles = [];
     this.aisleOrder = [];
     this.aisleNames = {};
     this.ordering = [];

  };

function menuitem_collection()
  {
     item_collection.call(this);
     this.aisleOrder = DAYS;
     this.printLine = function (aisle, item)
     {
       aisle.append($('<div class="printItem">' +item.name + '</div>'));
     };
  };

var items = {[PLANNED_BUILD]: new item_collection(), [PLANNED_SHOP]:  new item_collection(), [PLANNED_MENU]: new menuitem_collection()};

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
        saveCount(id, event.target.value);
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
          if (loadedTabs[PLANNED_BUILD])
          {
            saveEnabledState(id, val);
          }
        }
        else
        {
          if (loadedTabs[PLANNED_SHOP])
          {
            saveDoneState(id.substring(2), !val);
            if (items[planType].allDone())
            {
              var audio = document.getElementById("FinishSound");
              audio.play();
            }
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
        post({"action":"deleteItem", "itemId":id}, handleCheckLogin);
      }).appendTo(box);
  }
  return id;
}

function createMenuItem(parentElement, id, name, weekDay, planType)
{
  if (!id)
  {
    id = nameToId('menuItem_', name, planType);
  }
  id = items[planType].getUniqueId(id);
  items[planType].add(id, new item_type(id, name, weekDay, 1, true, true));
  var box = document.createElement("div");
  box.className = "Item";
  box.id = id;
  var nameSpan = document.createElement("span");
  nameSpan.className = "itemName";
  nameSpan.innerText= name;
  var num;
  parentElement.append(box);
  box.appendChild(nameSpan);
  $("<span>X</span>").addClass("deleteItem").click(
    function()
    {
      items[planType].remove(id);
      box.remove();
      resolveSortMenu();
    }).appendTo(box);
  return id;
}

var editingName= null;

function createAisle(aisleID, aisle, collection, editable)
{
  aisleDiv = $('<div class="aisle" id="' + aisleID + '"><span class="aisleLabel">' + aisle + '</span></div>'); 
  aisleDiv.sortable(
  {axis: 'y', items:'.Item', handle:'.itemName', stop: function (event, ui) {resolveSort();}});
  aisleName = aisle;
  if (editable)
  {
    var aisleLabel = aisleDiv.find('.aisleLabel');
    aisleLabel.attr('contenteditable',true);
    aisleLabel.dblclick(function() { $("#aisleSorter").sortable('disable'); editingName = $(this).text();  $(this).focus()});
    aisleLabel.focusout(function() { commitAisleNameChange($(this));});
    aisleLabel.keypress(function (e) {
        if (e.which == 13) {
              commitAisleNameChange($(this));
              return false;
            }
    });
    aisleLabel.keydown(function (e)
    {
      if (e.key === "Escape")
      {
        revertAisleName($(this));
      }
    });
  }
  $("#aisleSorter").append(aisleDiv);
  collection.addAisle(aisleID, aisleName);
}

function commitAisleNameChange(element)
{
  var newName = element.text().trim();
  if (newName == editingName)
  {
    console.log('Noting to do here');
    revertAisleName(element);
    return;
  }
  else if (newName == '' || (newName in items[PLANNED_SHOP].aisleNames))
  {
    console.log('Invalid name')
    revertAisleName(element);
    return;
  }
  console.log('Changing ' + editingName + ' to ' + element.text());
  element.text(newName);
  items[PLANNED_BUILD].renameAisle(editingName, newName);
  $("#buildListTab").focus();
  $("#aisleSorter").sortable('enable'); 
}

function revertAisleName(element)
{
  element.text(editingName);
  $("#buildListTab").focus();
  $("#aisleSorter").sortable('enable'); 
  console.log('Reverting aisle name');
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
  window.scrollTo(0,0);
  if (selectingFromRecipes)
  {
    selectingFromRecipes = false;
    showAddMenuItemDlg();
  }
}

function hideAddMenuItemDlg()
{
  $("#modal").hide();
  $("#menuTab").focus();
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
function showAddMenuItemDlg()
{
  $("#modal").show();
  $('.modalDialog').hide();
  $('#createMenuItemDialog').show();
  $("#modal").find("[name='menuItemName']").val('').focus();
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

function showRecipes()
{
  let refreshGrid = CALLBACK_REGISTRY['refreshRecipeGrid'];
  let setQueryMode = CALLBACK_REGISTRY['setQueryMode'];
  $("#createAisleError").text("");
  $("#modal").show();
  $('.modalDialog').hide();
  $('#recipeDlg').show();
  $('#recipeRoot').show();
  $('#recipeDlg').focus();
  if (refreshGrid)
  {
    setQueryMode(false);
    refreshGrid();
  }
}

function showAboutDlg()
{
  $("#modal").show();
  $('.modalDialog').hide();
  $('#aboutDlg').show();
  $('#aboutDlg').focus();
}

function addItem(itemName, aisleName, close)
{
  if (!itemName)
  {
    return;
  }
  lastAisle = aisleName;
  var aisleId = items[PLANNED_BUILD].aisleNames[aisleName];
  itemId = createPlannedItem($("#" + aisleId), null, itemName, aisleName,1, true, false, PLANNED_BUILD);
  resolveSort();
  post({"action":"addItem", "itemId":itemId, "itemName":itemName, "aisleName":aisleName, "order":items[PLANNED_BUILD].findOrder(itemId)}, handleCheckLogin);
  if (close)
  {
    hideAddDlg();
    $("#" + itemId).find('.itemNumber').focus().select();
  }
}

function addAisle(aisleName, close)
{
  aisleName = aisleName.trim();
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
  createAisle(aisleID, aisleName, items[PLANNED_BUILD], true);
  linkAisles();
  if (close)
  {
    hideAddDlg();
  }
}

function addMenuItem(itemName, weekDay, close)
{
  if (!itemName)
  {
    return;
  }
  itemId = createMenuItem($("#day_" + weekDay), null, itemName, weekDay, PLANNED_MENU);
  resolveSortMenu();
  if (close)
  {
    hideAddMenuItemDlg();
  }
}


function pickTab(tabName, clearMessage)
{
  var previousTab = activeTab;
  if (clearMessage)
  {
    clearMessages();
  }
  tabBodyName = tabName + "Tab";
  if (tabName == "buildList")
  {
    $(".floatingButtons").show();
  }
  else
  {
    $(".floatingButtons").hide();
  }
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
     if (previousTab == "invalid" || previousTab == "shop" || previousTab == "login" || previousTab == "register" ) 
     {
       post({"action":"getShopList"}, setBuildList);
     }
  }
  if (tabName == "shop")
  {
    post({"action":"getShopList"}, setShopList);
  }
  if (tabName == 'menu')
  {
    post({"action":"getMenu"}, setMenu);
  }
  activeTab = tabName;
}

function post(data, callback)
{
  var jsonData = JSON.stringify(data);
  $.post('/service/', jsonData, callback, "json");
}

function setListeners()
{
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
  $(document).on('keydown', function (e) {
      if (e.ctrlKey && e.key == 'a')
      {
        if (activeTab == 'buildList')
        {
          showAddDlg();
          return false;
        }
        if (activeTab == 'menu')
        {
          showAddMenuItemDlg();
          return false;
        }
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
  $("#createMenuItemDialog").find('.close').click(function() {hideAddMenuItemDlg();});
  $("#addItemButton").click(function()
    {
      addItem(
        $("#modal").find("[name='itemName']").val(),
        $("#aisleSelect").val(), false);
      $("#modal").find("[name='itemName']").val('').focus();
    });
  $("#addItemAndCloseButton").click(function()
    {
      addItem(
        $("#modal").find("[name='itemName']").val(),
        $("#aisleSelect").val(), true); });
  $("#addItemAndCloseButton").keypress(function (e) {
      if (e.which == 13) {
            $('#addItemAndCloseButton').click();
            return false;
          }
  });
  $("#addAisleButton").click(function() {
    addAisle($("#modal").find("[name='aisleName']").val(), false);
    $("#modal").find("[name='aisleName']").val('').focus();
    });
  $("#addAisleAndCloseButton").click(function() {addAisle($("#modal").find("[name='aisleName']").val(), true); });
  $("#addAisleAndCloseButton").keypress(function (e) {
      if (e.which == 13) {
            $('#addAisleAndCloseButton').click();
            return false;
          }
  });
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
  $("#createMenuItemDialog").keypress(function (e) {
      if (e.which == 13) {
            $('#addMenuItemButton').click();
            return false;
          }
  });
  $("#modal").keydown(function (e)
    {
      if (e.key === "Escape")
    {
      if (e.target.tagName === "TEXTAREA" || e.target.tagName === "INPUT")
      {
        let cl = e.target.className;
        if (cl === 'commonIngredients' || cl === 'keyIngredients' || cl === 'description' || cl === 'name')
        {
          return;
        }
      }
      hideAddDlg();
    }
    });
  $("#createMenuItemDialog").keydown(function (e)
    {
      if (e.key === "Escape")
    {
      hideAddMenuItemDlg();
    }
    });
  $("#printView").on('keydown', function (e) {
      if (e.ctrlKey && e.key == 'a')
      {
        selectText($("#printView").find('.content'));
        return false;
      }
  });
  $("#menuTab").attr('tabindex',0);
  $("#menuTab").on('keydown', function (e) {
      if (e.ctrlKey && e.key == 'a')
      {
        showAddMenuItemDlg();
        return false;
      }
  });
  $("#addMenuItemButton").click(function()
    {
      addMenuItem(
        $("#modal").find("[name='menuItemName']").val(),
        $("#weekdaySelect").val(), false);
      $("#modal").find("[name='menuItemName']").val('').focus();
      let lastDay = $("#weekdaySelect").val();
      let lastDayIndex = DAYS.indexOf(lastDay);
      let nextDayIndex = (lastDayIndex == 6 ? 6 : lastDayIndex+1);
      let nextDay = DAYS[nextDayIndex];
      $("#weekdaySelect").val(nextDay);
    });
  $("#selectMenuItemButton").click(function()
    {
      selectingFromRecipes = true;
      $('#createMenuItemDialog').hide();
      $('#recipeDlg').show();
      $('#recipeRoot').show();
      $('#recipeDlg').focus();
      let refreshGrid = CALLBACK_REGISTRY['refreshRecipeGrid'];
      let setQueryMode = CALLBACK_REGISTRY['setQueryMode'];
      let setSelectCB = CALLBACK_REGISTRY['setSelectCB'];
      if (refreshGrid)
      {
        setQueryMode(true);
        refreshGrid();
        setSelectCB(  (recipeName) =>
          {
            setTimeout( ()=>
              {
                selectingFromRecipes = false;
                $("#modal").find("[name='menuItemName']").val(recipeName),
                $('#recipeDlg').hide();
                $('#createMenuItemDialog').show();
                setQueryMode(false);
              },
              500
            );
          });
      }
    });
  $("#addAndCloseMenuItemButton").click(function()
    {
      addMenuItem(
        $("#modal").find("[name='menuItemName']").val(),
        $("#weekdaySelect").val(), true); });
  $("#addAndCloseMenuItemButton").keypress(function (e) {
      if (e.which == 13) {
        $('#addAndCloseMenuItemButton').click();
            return false;
          }
  });
}

function addScript(scriptName)
{
  let script = document.createElement("script");
  script.setAttribute("type", "text/javascript");
  script.setAttribute("src", scriptName);
  document.getElementsByTagName("head")[0].appendChild(script);
}

function init()
{
  pickTab('invalid', true); // Hide all tabs, initially.
  post({"action":"checkLogin"}, handleCheckLogin);
  setListeners();
  addScript("js/bundle.js");
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

function login(event)
{
  event.preventDefault();
  var userName=$( "input[name='username']" ).val();
  var password=$( "input[name='password']" ).val();
  post(
    {"action":"login", "userName":userName,"password":password},
    handleCheckLogin);
  return false;
}
function logout()
{
  cleanup();
  post( {"action":"logout"}, handleCheckLogin);
}

function cleanup()
{
  loadedTabs = {build: false, shop:false};
  tabTS = {shop: "", menu:""};
  items = {[PLANNED_BUILD]: new item_collection(), [PLANNED_SHOP]:  new item_collection(), [PLANNED_MENU]: new menuitem_collection()};
  $("#buildListBody").empty();
  $("#shopListBody").empty();
  $("#menuBody").find('.Item').remove();
}

function clearMenu()
{
  items[PLANNED_MENU] = new menuitem_collection();
  $("#menuBody").find('.Item').remove();
  post({"action":"setMenu", "list":items[PLANNED_MENU].toList()}, handleCheckLogin);
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

function saveCount(id, val)
{
  post(
    {"action":"saveCount", "id": id, "count": val},
    handleCheckLogin);
}

function saveEnabledState(id, val)
{
  post(
    {"action":"saveEnabledState", "id": id, "enabledState": val},
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
  handleTS(data);
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
  handleTS(data);
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

function handleTS(data)
{
  if (data["ts"])
  {
    if (data["ts"]["list"] == "shop")
    {
      tabTS["shop"] = data["ts"]["ts"];
    }
    if (data["ts"]["list"] == "menu")
    {
      tabTS["menu"] = data["ts"]["ts"];
    }
    if (data["ts"]["ist"] == "saved")
    {
      tabTS["saved"] = data["ts"]["ts"];
    }
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
  hideTabs(["buildList", "shop", "logout", "password", "menu"]);
  pickTab("login", false);
}

function setLoggedIn()
{
  showTabs(["buildList", "shop", "menu","logout"]);
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
  pickTab("password", true);
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
  post({"action":"setShopList", "list":items[PLANNED_BUILD].toList(), "ts":tabTS["shop"]}, setBuildList);
}

function setBuildList(data, statusCode)
{
  if (!checkLoggedIn(data))
  {
    return;
  }
  loadedTabs[PLANNED_BUILD] = false;;
  handleMessages(data);
  $("#buildListBody").empty();
  var aisleSorter = $("<div id='aisleSorter'>").
    sortable(
      {axis: 'y', handle:".aisleLabel",items:'.aisle',stop: function (event, ui) {resolveSort();}}).  appendTo($("#buildListBody"));
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
      createAisle(aisleID, aisle, items[PLANNED_BUILD], true);
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
  if ($(".floatingButtons").length == 0)
  {
    let floatingButtons = $("<div class='floatingButtons'>").appendTo("#body");
    floatingButtons.append($("<div>").append($("<button title='Add item (Ctrl-A)'>Add Item</button>").click( showAddDlg)));
    floatingButtons.append($("<div>").append($("<button title='Ctrl-L'>Add Aisle</button>")).click( showAddAisleDlg));
  }
  loadedTabs[PLANNED_BUILD] = true;
  $("#buildListTab").focus();
  window.scrollTo(0,0);
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
        createAisle(aisleID, aisle, items[PLANNED_SHOP], false);
        aisleDiv = $("#" + aisleID);
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

function createDayDiv(dayName)
{
  var dayDiv = $('<div class="weekDay" id="day_' + dayName + '"><span class="dayLabel">' + dayName + '</span></div>'); 
  dayDiv.sortable(
    {axis: 'y', items:'.Item', handle:'.itemName', stop: function(event, ui) {resolveSortMenu();}});

  return dayDiv;
}
function linkMenuDays()
{
  var sortableWeekDays = [];
  $("#menuBody").find(".weekDay").each(function () {sortableWeekDays.push($(this));});
  for (var firstIdx = 0; firstIdx < sortableWeekDays.length; firstIdx++)
  {
    var otherWeekDays = []
    for (var secondIdx = 0; secondIdx < sortableWeekDays.length; secondIdx++)
    {
      if (firstIdx != secondIdx)
      {
        otherWeekDays.push('#' + sortableWeekDays[secondIdx].attr('id')); 
      }
    }
    if (otherWeekDays.length > 0)
    {
      sortableWeekDays[firstIdx].sortable("option", "connectWith", otherWeekDays.join());
    }
  }
}

function resolveSortMenu()
{
  var menus = [];
  for (var i = 0; i < DAYS.length; i++)
  {
    var dayName = DAYS[i];
    var dayId = "day_" + dayName;
    var day = $("#" + dayId);
    menus[dayName] = day.sortable("toArray"); 
  }
  items[PLANNED_MENU].setOrder(DAYS, menus);
  post({"action":"setMenu", "list":items[PLANNED_MENU].toList(), "ts":tabTS["menu"] }, setMenu);
}

function cleanMenu()
{
  items[PLANNED_MENU].clear();
  items[PLANNED_MENU].aisleOrder = DAYS;
}

function setMenu(data, statusCode)
{
  if (!checkLoggedIn(data))
  {
    return;
  }
  handleMessages(data);
  $("#menuBody").empty();
  cleanMenu();
  for (var i = 0; i < DAYS.length; i++)
  {
    $("#menuBody").append(createDayDiv(DAYS[i]));
  }
  linkMenuDays();
  for (var j = 0; j < data['menu'].length; j++)
  {
    var item = data['menu'][j];
    createMenuItem($("#day_"+item['aisle']), item['id'], item['name'], item['aisle'], PLANNED_MENU);
  }
  $("<div class='centeredItem'></div>").appendTo("#menuBody").append($("<button title='Add item (Ctrl-A)'>+</button>").click( showAddMenuItemDlg));
  var buttonPane = $("<div></div>").addClass("buttonPane").appendTo("#menuBody");
  $("<button>Clear Menu</button>").click(clearMenu).appendTo(buttonPane); 
  $("<button>Printable View</button>").click( function() { showPrintableView(items[PLANNED_MENU]); }).appendTo(buttonPane);
  $("<button class='hideOnPhone'>Show Recipes</button>").click( function() { showRecipes(); }).appendTo(buttonPane);
  $("#menuTab").focus();
}

