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

function login($req)
{
  $user = $req["userName"];
  $password = $req["password"];
  if ($user == 'abc')
  {
    $user = "abc";
  }
  else
  {
    return false;
  }
  if ($password == 'abc')
  {
  }
  else
  {
    return false;
  }
  $_SESSION["user"] = "ABC";
  $_SESSION["loginTS"] = time();
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
