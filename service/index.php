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


function setResult(&$res, $key, $value)
{
  $res[$key] = $value;
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
else if ($request['action'] == "getWorkingList")
{
  $workingList = getWorkingList(getUser(), "saved");
  setResult($result, "isLoggedIn", isLoggedIn());
  setResult($result, "workingList", $workingList);
}
else if ($request['action'] == "getShopList")
{
  $workingList = getWorkingList(getUser(), "shop");
  setResult($result, "isLoggedIn", isLoggedIn());
  setResult($result, "workingList", $workingList);
}
else if ($request['action'] == "saveList")
{
  $res = setWorkingList(getUser(), "saved",$request['list']);
  if ($res)
  {
    setResult($result, "error", $res);
  }
  $res = setWorkingList(getUser(), "shop", $request['list']);
  setResult($result, "isLoggedIn", isLoggedIn());
}
else if ($request['action'] == "setShopList")
{
  $res = setWorkingList(getUser(), "shop", $request['list']);
  if ($res)
  {
    setResult($result, "error", $res);
  }
  $workingList = getWorkingList(getUser(), "shop");
  setResult($result, "isLoggedIn", isLoggedIn());
  setResult($result, "workingList", $workingList);
}
else if ($request['action'] == "saveDoneState")
{
  saveDoneState(getUser(), $request);
  setResult($result, "isLoggedIn", isLoggedIn());
  setResult($result, "keepTab", true);
}
else
{
  setResult($result, "isLoggedIn", isLoggedIn());
  setResult($result, "error", "Unknown action: " . $request['action']);
}


echo json_encode($result);
?>
