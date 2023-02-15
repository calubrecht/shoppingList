<?php

include_once('authRegistry.php')

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

function resetPassword($user, $password)
{
  global $db; 
  $db->beginTransaction();
  try
  {
    $pwHash = password_hash($password, PASSWORD_DEFAULT);
    $res = $db->execute("UPDATE users set pwHash = ? where login= ? ", array($pwHash, $user));
    if (!$res)
    {
      $db->rollbackTransaction();
      return false;
    }
  }
  catch (Exception $e)
  {
    $db->rollbackTransaction();
    return false;
  }
  if (!$db->execute('delete from passwordTokens where passwordTokens.userID in (select users.idusers from users where users.login=?)', array($user)))
  {
    error_log('Failed to clean up old password token for user ' . $user . ' - ' . $db->error);
  }

  $db->commitTransaction();
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
    $userId = getLoginInfo($user)['idusers'];
    $db->execute(
      "INSERT INTO listNames (listName, userId) VALUES (?, ?)",
      array("Default", $userId));
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

function get_include_contents($filename, $data)
{
  if (is_file($filename))
  {
    ob_start();
    include $filename;
    return ob_get_clean();
  }
  return false;
}

function makeToken()
{
  $bytes = openssl_random_pseudo_bytes(25, $cStrong);
  $hex = bin2hex($bytes);
  if (!$cStrong)
  {
    error_log("Password token was not generated with cryptographically strong algorithm");
  }
  return $hex;
}


function requestReset($req)
{
  global $db; 
  global $CONFIG; 
  $user = $req["userName"];
  try
  {
    $db->beginTransaction();
    $userRes = $db->queryAll("SELECT login, email, idUsers from users where login=?", $user);
    if (!$userRes)
    {
      error_log("User " . $user .  " Doesn't exist");
      $db->rollbackTransaction();
      return;
    }
    $row = $userRes[0];
    $userId = $row["idUsers"];
    $email = $row["email"];
    $res = $db->queryAll("SELECT userID from passwordTokens where userID=? and timestamp > CURRENT_TIMESTAMP() - INTERVAL 2 MINUTE ", ($userId));
    if ($res && count($res) > 0)
    {
      // Prevent repeated requests
      error_log("Password request sent too recently for " . $user);
      $db->rollbackTransaction();
      return;
    }
    $fromAddress = $CONFIG["PASSWORD_RECOVERY_FROM"];
    $headers = "From: " . $fromAddress . "\r\n";
    $headers .= "MIME-Version: 1.0\r\n";
    $headers .= "Content-Type: text/html; charset=ISO-8859-1\r\n";
    $passwordToken = makeToken();
    $res = $db->execute("REPLACE INTO passwordTokens (userID, token, timestamp) VALUES (?, ?, CURRENT_TIMESTAMP())", array($userId, $passwordToken));
    if (!$res)
    {
      error_log("Could not store token for user:".$user ." -" . $db->error);
      $db->rollbackTransaction();
      return;
    }
    $data = array();
    $data["BANNER_NAME"] = $CONFIG["BANNER_NAME"];
    $data["host"] = $CONFIG["HOST"];
    $data["passwordToken"] = $passwordToken;
    $data["userName"] = $user;
    $mailText = get_include_contents('templates/recoveryEmail.php', $data);
    if (!$mailText)
    {
      error_log("Could not load email text");
      $db->rollbackTransaction();
      return;
    }
    mail(
      $email,
      "Password Recovery for " .$CONFIG["BANNER_NAME"],
      $mailText,
      $headers);
    $db->commitTransaction();
  }
  catch (Exception $e)
  {
    $db->rollbackTransaction();
    error_log("Unable to send password request token because " . $e->getMessage);
  }
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

function getUsernameFromToken($token)
{
  global $db; 
  $db->beginTransaction();
  $res = $db->queryAll("SELECT login, idusers FROM users, passwordTokens WHERE token=? and userID=idusers and timestamp > CURRENT_TIMESTAMP - INTERVAL 5 MINUTE", $token);
  if (!$res || count($res) == 0)
  {
    error_log("Select gave nothing ");
    $db->rollbackTransaction();
    return false;
  }
  $db->commitTransaction();
  return $res[0]["login"];
}
?>
