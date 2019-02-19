<?php
ini_set("session.cookie_lifetime", 60*60*24*30); // 30 days
@session_start();

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

if (!isset($request['action']))
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
else if (!isLoggedIn())
{
  setResult($result, "isLoggedIn", isLoggedIn());
}
else if ($request['action'] == "getWorkingList")
{
  $workingList = getWorkingList(getUser());
  setResult($result, "isLoggedIn", isLoggedIn());
  setResult($result, "workingList", $workingList);
}
else
{
  setResult($result, "isLoggedIn", isLoggedIn());
  setResult($result, "error", "Unknown action: " . $request['action']);
}


echo json_encode($result);
?>
