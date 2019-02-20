<?php
function isLoggedIn()
{
  if (!isset($_SESSION["user"]))
  {
    return false;
  }
  if (!isset($_SESSION["loginTS"]))
  {
    return false;
  }
  $loginTime = $_SESSION["loginTS"];
  // What sort of timeout...
//  if (time() - $loginTime > 600)
//  {
//    logout();
//    return false;
//  }
  return true;
}

function getLoginInfo($user)
{
  global $db;
  return $db->queryOneRow("SELECT pwHash, idusers, login FROM users WHERE login=?", "$user");
}

function login($req)
{
  $user = $req["userName"];
  $password = $req["password"];
  global $db;
  $loginInfo = getLoginInfo($user);
  if ($loginInfo)
  {
    $dbPW = $loginInfo["pwHash"];
    if (password_verify($password, $dbPW))
    {
      $_SESSION["user"] = $loginInfo["login"];
      $_SESSION["loginTS"] = time();
    }
    else
    {
      return false;
    }
  }
  else
  {
    return false;
  }
  return true;
}

function getUser()
{
  return $_SESSION["user"];
}

function logout()
{
  unset($_SESSION["loginTS"]);
  unset($_SESSION["user"]);
}
?>
