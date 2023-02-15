<?php

function getAuthPlugins() {
  include_once('authRegistry.php');
  return getAuthenticators();
}

function getAuthPluginForName($pluginName) {
  include_once('authRegistry.php');
  return getAuthenticatorForName($pluginName);
}

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

function getLoginInfo($user) {
  global $db;
  return $db->queryOneRow("SELECT pwHash, idusers, login FROM users WHERE login=?", "$user");
}

function _createInternalUser($login, $fullName) {
          global $db;
          try{
            $db->beginTransaction();
            $res = $db->execute("INSERT into users (login, fullName, email, pwHash, isAdmin) VALUES (?, ?, '','',0)", array($login, $fullName));
            $db->commitTransaction();
          }
          catch (Exception $e)
          {
            $db->rollbackTransaction();
            error_log("Unable to insert user " . $e->getMessage);
          }
}

function  _createInternalLists($user) {
          global $db;
          try{
            $userId = getLoginInfo($user)['idusers'];
            $db->beginTransaction();
            $db->execute(
              "INSERT INTO listNames (listName, userId) VALUES (?, ?)",
              array("Default", $userId));
            $db->commitTransaction();
          }
          catch (Exception $e)
          {
            $db->rollbackTransaction();
            error_log("Unable to insert lists " . $e->getMessage);
          }
}

function login($req)
{

  $plugins = getAuthPlugins();
  foreach ($plugins as $plugin) {
    $res = $plugin->login($req);
    if ($res) {
      $_SESSION["user"] = $res;
      $_SESSION["loginTS"] = time();
      error_log("logged in with " . $plugin->getPluginName());
      if ($plugin->getPluginName() != "NativeAuthentication") {
        if (!getLoginInfo($res)) {
          error_log("No internal user for " . $res . " creating now");
          _createInternalUser($res, $res);
          _createInternalLists($res);
        }
      }
      return true;
    }
  } 
  return false;
}

function resetPassword($user, $password)
{
  $plugins = getAuthPlugins();
  foreach ($plugins as $plugin) {
    if ($plugin->isUser($user)) {
      if ($plugin->resetPassword($user, $password)) {
        global $db;
        $db->beginTransaction();
        if (!$db->execute('delete from passwordTokens where passwordTokens.userID in (select users.idusers from users where users.login=?)', array($user)))
        {
          error_log('Failed to clean up old password token for user ' . $user . ' - ' . $db->error);
        }
        $db->commitTransaction();
        return true;
      }
    }
  } 
  return false;
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
  
  $plugins = getAuthPlugins();
  foreach ($plugins as $plugin) {
    $res = $plugin->register($user, $password, $displayName, $email);
    if (!$res) {
      if ($plugin->getPluginName() != "NativeAuthentication") {
        _createInternalUser($user, $displayName);
      }
      _createInternalLists($user);
      error_log("registered ". $user . " logging in");
      login($req);
    }
    return $res;
  } 
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
  $plugins = getAuthPlugins();
  foreach ($plugins as $plugin) {
    $emailInfo = $plugin->getLoginEmail($user);
    if ($emailInfo) {
      break;
    }
  } 
  if (!$emailInfo) {
    return;
  }
  $loginInfo = getLoginInfo($user);
  $userId = $loginInfo["idusers"];
  $idSource = $emailInfo["idSource"];
  $email = $emailInfo["email"];
  try {
    $db->beginTransaction();
    $res = $db->queryAll("SELECT userID from passwordTokens where userID=? and idSource=? and timestamp > CURRENT_TIMESTAMP() - INTERVAL 2 MINUTE ", array($userId, $idSource));
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
    $res = $db->execute("REPLACE INTO passwordTokens (userID, idSource, token, timestamp) VALUES (?, ?, ?, CURRENT_TIMESTAMP())", array($userId, $idSource, $passwordToken));
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
  $res = $db->queryAll("SELECT userId, idSource FROM passwordTokens WHERE token=? and timestamp > CURRENT_TIMESTAMP - INTERVAL 5 MINUTE", $token);
  if (!$res || count($res) == 0)
  {
    error_log("Select gave nothing for token=".$token);
    $db->rollbackTransaction();
    return false;
  }
  $db->commitTransaction();
  $plugin = getAuthPluginForName("NativeAuthentication");
  if (is_null($plugin)) {
    error_log("Could not find plugin for " . $res[0]["idSource"]);
    return false;
  }
  return  $plugin->getLoginForId($res[0]["userId"]);
}
?>
