<?php
ini_set("session.cookie_lifetime", 60*60*24*30); // 30 days
ini_set("session.gc_maxlifetime", 60*60*24*30); // 30 days
@session_start();

require_once('config.php');
require_once('db.php');
require_once('login.php');
require_once('shoppingList.php');

$postData = file_get_contents("php://input");

$request = json_decode($postData, true);

$loggedIn = false;
$result = [];

$csrf_token = false;


function setResult(&$res, $key, $value)
{
  $res[$key] = $value;
}

function setTS(&$res, $list, $ts)
{
  $tsObj = [];
  $tsObj["list"] = $list;
  $tsObj["ts"] = $ts;
  $res["ts"] = $tsObj;
}

function checkToken()
{
  $expectedToken = $_SESSION["csrf_token"];
  if (!isset($expectedToken))
  {
    return false;
  }
  $cookieToken = $_COOKIE["XSRF_TOKEN"];
  if ($expectedToken != $cookieToken)
  {
    return false;
  }
  $headerToken = apache_request_headers()['X-Xsrf-Token'];
  if ($expectedToken != $headerToken)
  {
    return false;
  }
  return true;
}


$db->dbInit();
if ($db->error)
{
  setResult($result, "isLoggedIn", isLoggedIn());
  setResult($result, "error", "DB Error:". $db->error);
}
else if (!isset($request['action']))
{
  setResult($result, "isLoggedIn", isLoggedIn());
  setResult($result, "error", "Action not provided");
}
else if ($request['action'] == "checkLogin")
{
  setResult($result, "isLoggedIn", isLoggedIn());
  if (!array_key_exists("csrf_token", $_SESSION))
  {
    $_SESSION["csrf_token"] = bin2hex(random_bytes(20));
  }
  $csrf_token = $_SESSION["csrf_token"];
}
else if (!checkToken())
{
  setResult($result, "isLoggedIn", isLoggedIn());
  setResult($result, "error", "Bad Token");
}
else if ($request['action'] == "login")
{
  if (login($request))
  {
    setResult($result, "msg", "Welcome " . getUser());
  }
  else
  {
    setResult($result, "error", "Invalid username or password");
    setResult($result, "enableForgot", true);
  }
  setResult($result, "isLoggedIn", isLoggedIn());
}
else if ($request['action'] == "logout")
{
  logout();
  setResult($result, "isLoggedIn", isLoggedIn());
}
else if ($request['action'] == "register")
{
  $error = register($request);
  if (!$error)
  {
    setResult($result, "isLoggedIn", isLoggedIn());
    setResult($result, "msg", "Welcome " . getUser());
  }
  else
  {
    setResult($result, "isLoggedIn", isLoggedIn());
    setResult($result, "error", $error);
  }
}
else if ($request['action'] == "resetPassword")
{
  logout();
  setResult($result, "isLoggedIn", isLoggedIn());
  requestReset($request);
  setResult($result, "msg", "If this account exists, an email has been sent with instructions on how to reset your password.");
}
else if ($request['action'] == "doResetPassword")
{
  $token = $request['token'];
  $password = $request['password'];
  if (!$token || !$password || $token != $_SESSION["token"])
  {
    error_log(" ".$token);
    error_log(" ".$SESSION["token"]);
    setResult($result, "success", false);
    setResult($result, "error", "This password token cannot be found or has expired, please request a new password reset token.");
  }
  else
  {
    $username = getUsernameFromToken($request["token"]);
    if (!$username)
    {
      setResult($result, "success", false);
      setResult($result, "error", "This password token cannot be found or has expired, please request a new password reset token.");
    }
    else if (resetPassword($username, $password))
    {
      setResult($result, "success", true);
    }
    else
    {
      setResult($result, "success", false);
      setResult($result, "error", "An unknown problem occurred restting password");
    }
  }
}
else if (!isLoggedIn())
{
  setResult($result, "isLoggedIn", isLoggedIn());
}
else if ($request['action'] == "tick")
{
  setResult($result, "isLoggedIn", isLoggedIn());
  setResult($result, "tock", getTStamps(getUser()));
}
else if ($request['action'] == "getWorkingList")
{
  $msg = '';
  $ts = null;
  $listName = $request["listName"];
  $workingList = getWorkingList(getUser(), "saved", $listName, $msg, $ts);
  setResult($result, "isLoggedIn", isLoggedIn());
  setResult($result, "workingList", $workingList);
  setTS($result, "work", $ts);
  if ($msg)
  {
    setResult($result, "msg", $msg);
  }
}
else if ($request['action'] == "getShopList")
{
  $msg = '';
  $ts = null;
  $listName = $request["listName"];
  $workingList = getWorkingList(getUser(), "shop", $listName, $msg, $ts);
  setResult($result, "isLoggedIn", isLoggedIn());
  setResult($result, "workingList", $workingList);
  setTS($result, "shop", $ts);
  if ($msg)
  {
    setResult($result, "msg", $msg);
  }
}
else if ($request['action'] == "getMenu")
{
  $msg = '';
  $ts = null;
  $workingList = getMenu(getUser(), $msg, $ts);
  setResult($result, "isLoggedIn", isLoggedIn());
  setResult($result, "menu", $workingList);
  setTS($result, "menu", $ts);
  if ($msg)
  {
    setResult($result, "msg", $msg);
  }
}
else if ($request['action'] == "saveList")
{
  $ts = null;
  $res = setWorkingList(getUser(), "saved", $request["listName"], $request['list'], $ts);
  if ($res)
  {
    setResult($result, "error", $res);
  }
  $ts = $request["shopTs"];
  $res = setWorkingList(getUser(), "shop", $request["listName"], $request['list'], $ts);
  setResult($result, "isLoggedIn", isLoggedIn());
  setTS($result, "shop", $ts);
}
else if ($request['action'] == "setShopList")
{
  $ts = $request["ts"];
  $listName = $request["listName"];
  $res = setWorkingList(getUser(), "shop", $listName, $request['list'], $ts);
  if ($res)
  {
    setResult($result, "error", $res);
  }
  $msg = null;
  $ts = null;
  $workingList = getWorkingList(getUser(), "shop", $listName, $msg, $ts);
  setResult($result, "isLoggedIn", isLoggedIn());
  setResult($result, "workingList", $workingList);
  setTS($result, "shop", $ts);
}
else if ($request['action'] == "revertWorkingList")
{
  $msg = '';
  $ts = null;
  $listName = $request["listName"];
  $workingList = getWorkingList(getUser(), "saved", $listName, $msg, $ts);
  $workingListArrays = array_map(
    function($item) {return array($item["id"], $item["name"], $item["aisle"], $item["count"], $item["active"], $item["done"]  );},
    $workingList);
  $ts = $request["ts"];
  $res = setWorkingList(getUser(), "shop", $listName, $workingListArrays, $ts);
  if ($res)
  {
    setResult($result, "error", $res);
  }
  setResult($result, "isLoggedIn", isLoggedIn());
  setResult($result, "workingList", $workingList);
  setTS($result, "work", $ts);
  if ($msg)
  {
    setResult($result, "msg", $msg);
  }
}
else if ($request['action'] == "addItem")
{
  $ts = null;
  $res = addItem(getUser(), "shop", $request["listName"], $request["itemName"], $request["itemId"], $request["aisleName"], $request["order"], $ts);
  if ($res)
  {
    setResult($result, "error", $res);
  }
  setResult($result, "isLoggedIn", isLoggedIn());
  setResult($result, "keepTab", true);
  setTS($result, "shop", $ts);
}
else if ($request['action'] == "deleteItem")
{
  $ts = null;
  $res = deleteItem(getUser(), "shop", $request["listName"], $request["itemId"], $ts);
  if ($res)
  {
    setResult($result, "error", $res);
  }
  setResult($result, "isLoggedIn", isLoggedIn());
  setResult($result, "keepTab", true);
  setTS($result, "shop", $ts);
}
else if ($request['action'] == "saveDoneState")
{
  $ts = null;
  saveDoneState(getUser(), $request, $ts);
  setResult($result, "isLoggedIn", isLoggedIn());
  setResult($result, "keepTab", true);
  setTS($result, "shop", $ts);
}
else if ($request['action'] == "saveEnabledState")
{
  $ts = null;
  saveEnabledState(getUser(), $request, $ts);
  setResult($result, "isLoggedIn", isLoggedIn());
  setResult($result, "keepTab", true);
  setTS($result, "shop", $ts);
}
else if ($request['action'] == "saveCount")
{
  $ts = null;
  saveCount(getUser(), $request, $ts);
  setResult($result, "isLoggedIn", isLoggedIn());
  setResult($result, "keepTab", true);
  setTS($result, "shop", $ts);
}
else if ($request['action'] == "resetDoneState")
{
  $ts = null;
  $listName = $request["listName"];
  resetDoneState(getUser(), "saved", $listName);
  resetDoneState(getUser(), "shop", $listName);
  $msg = null;
  $ts = null;
  $workingList = getWorkingList(getUser(), "shop", $listName, $msg, $ts);
  setResult($result, "isLoggedIn", isLoggedIn());
  setResult($result, "workingList", $workingList);
  setTS($result, "shop", $ts);
}
else if ($request['action'] == "setMenu")
{
  $ts = $request["ts"];
  $res = setWorkingList(getUser(), "menu", "Default", $request['list'], $ts);
  if ($res)
  {
    setResult($result, "error", $res);
  }
  $msg = null;
  setResult($result, "isLoggedIn", isLoggedIn());
  setResult($result, "keepTab", true);
  $menu = getMenu(getUser(), $msg, $ts);
  setResult($result, "menu", $menu);
  setTS($result, "menu", $ts);
}
else if ($request['action'] == "getRecipes")
{
  $res = getRecipes(getUser()); 
  setResult($result, "recipes", $res);
  setResult($result, "isLoggedIn", isLoggedIn());
}
else if ($request['action'] == "editRecipe")
{
  $res = editRecipe(getUser(), $request['recipe']);
  if ($res)
  {
    setResult($result, "error", $res);
  }
  $res = getRecipes(getUser()); 
  setResult($result, "recipes", $res);
  setResult($result, "isLoggedIn", isLoggedIn());
}
else if ($request['action'] == "addRecipe")
{
  $res = addRecipe(getUser(), $request['recipe']);
  if ($res)
  {
    setResult($result, "error", $res);
  }
  $res = getRecipes(getUser()); 
  setResult($result, "recipes", $res);
  setResult($result, "isLoggedIn", isLoggedIn());
}
else if ($request['action'] == "deleteRecipe")
{
  $res = deleteRecipe(getUser(), $request['recipe']);
  if ($res)
  {
    setResult($result, "error", $res);
  }
  $res = getRecipes(getUser()); 
  setResult($result, "recipes", $res);
  setResult($result, "isLoggedIn", isLoggedIn());
}
else if ($request['action'] == "setOrder")
{
  $res = setOrder(getUser(), $request['orderedItems']);
  if ($res)
  {
    setResult($result, "error", $res);
  }
  setResult($result, "isLoggedIn", isLoggedIn());
}
else if ($request['action'] == "getListNames")
{
  $res = getListNames(getUser()); 
  setResult($result, "lists", $res);
  setResult($result, "isLoggedIn", isLoggedIn());
}
else if ($request['action'] == "addListName")
{
  $res = addList(getUser(), $request['listName']); 
  if ($res)
  {
    setResult($result, "error", $res);
  }
  setResult($result, "keepTab", true);
  setResult($result, "isLoggedIn", isLoggedIn());
}
else if ($request['action'] == "removeListName")
{
  $res = removeList(getUser(), $request['listName']); 
  if ($res)
  {
    setResult($result, "error", $res);
  }
  setResult($result, "keepTab", true);
  setResult($result, "isLoggedIn", isLoggedIn());
}
else if ($request['action'] == "getUserSetting")
{
  $res = getSetting(getUser(), $request['setting']);
  setResult($result, "setting", $request['setting']);
  setResult($result, "settingValue", $res);
  setResult($result, "isLoggedIn", isLoggedIn());
}
else if ($request['action'] == "setUserSetting")
{
  $res = setSetting(getUser(), $request['setting'], $request['settingValue']);
  if ($res)
  {
    setResult($result, "error", $res);
  }
  setResult($result, "keepTab", true);
  setResult($result, "isLoggedIn", isLoggedIn());
}
else
{
  setResult($result, "isLoggedIn", isLoggedIn());
  setResult($result, "error", "Unknown action: " . $request['action']);
}

header("Content-Type: application/json");
if ($csrf_token)
{
  setcookie("XSRF_TOKEN", $csrf_token, 0, '/');
}
echo json_encode($result);
?>
