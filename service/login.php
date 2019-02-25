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

function register($req)
{
  $user = $req["userName"];
  $password = $req["password"];
  $displayName= $req["displayName"];
  $email= $req["email"];
  if (!preg_match('/^[a-z0-9_.\-]+$/i', $user))
  {
    return "Please provide a username containing only letters, numbers, dashas and underscores";
  }
  if (!preg_match('/^[a-z0-9_ .\-]+$/i', $displayName))
  {
    return "Please provide a display name containing only letters, numbers, spaces, dashas and underscores";
  }
  if ($email && !preg_match('/^[a-z0-9_.\-@]+$/i', $email))
  {
    return "Please provide an display name containing only letters, numbers, dashas, underscores and the @";
  }


  global $db;
  $db->beginTransaction();
  $loginInfo = getLoginInfo($user);
  if ($loginInfo)
  {
    $db->rollbackTransaction();
    return "User " . $user . " already exists.";
  }
  try
  {
    $pwHash = password_hash($password, PASSWORD_DEFAULT);
    $res = $db->execute("INSERT into users (login, pwHash, fullName, email, isAdmin) VALUES (?, ?, ?, ?, 0)", array($user, $pwHash, $displayName, $email));
    if (!$res)
    {
      if ($db->errorCode == 23000)
      {
        error_log("Unable to register User " . $user . " - User already exists");
      }
      else
      {
        error_log("Unable to register User " . $user . " - " . $db->error);
      }
      $db->rollbackTransaction();
      return "An error occurred registering user";
    }
  }
  catch (Exception $e)
  {
    $db->rollbackTransaction();
    error_log("Unable to register User " . $user . " - " . $e->getMessage());
    return "Unable to register User " . $user;
  }
  login($req);
  $db->commitTransaction();
  return;
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
