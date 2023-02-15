<?php

include_once(realpath(__DIR__ . "/../authRegistry.php"));


class NativeAuth
{
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
    $loginInfo = $this->getLoginInfo($user);
    if ($loginInfo)
    {
      $dbPW = $loginInfo["pwHash"];
      if (password_verify($password, $dbPW))
      {
        return $loginInfo["login"];
      }
      else
      {
        return false;
      }
    }
    return false;
  }

  function isUser($user) {
    if (!$this->getLoginInfo($user)) {
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
    $db->commitTransaction();
    return true;
  }


  function register($user, $password, $displayName, $email) {
    global $db;
    $db->beginTransaction();
    $loginInfo = getLoginInfo($user);
    if ($loginInfo)
    {
      error_log($loginInfo);
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
    $db->commitTransaction();
    return;
  }

  function getLoginEmail($user) {
    global $db; 
    global $CONFIG; 
    try
    {
      $db->beginTransaction();
      $userRes = $db->queryAll("SELECT login, email, idUsers from users where login=?", $user);
      if (!$userRes)
      {
        $db->rollbackTransaction();
        return false;
      }
      $row = $userRes[0];
      $userId = $row["idUsers"];
      $email = $row["email"];
      $db->rollbackTransaction();
      return array("user"=>$user, "userId"=>$userId, "idSource"=>$this->getPluginName(), "email"=>$email);
    }
    catch (Exception $e)
    {
      $db->rollbackTransaction();
      error_log("Unable to getUserid " . $e->getMessage);
      return false;
    }
  }
  
  function getLoginForId($userId) {
    global $db; 
    global $CONFIG; 
    try
    {
      $db->beginTransaction();
      $userRes = $db->queryAll("SELECT login FROM users WHERE idusers=?", $userId);
      if (!$userRes)
      {
        $db->rollbackTransaction();
        return false;
      }
      $row = $userRes[0];
      $db->rollbackTransaction();
      if ($row) {
        return $row["login"];
      }
    }
    catch (Exception $e)
    {
      $db->rollbackTransaction();
      error_log("Unable to user for getUserid " . $e->getMessage);
      return false;
    }
    return false;
  }

  function getPluginName() {
    return 'NativeAuthentication';
  }
}

$nativeAuth = new NativeAuth();

registerAuthenticator($nativeAuth);

?>
