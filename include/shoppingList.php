<?php

require_once("include/config.php");
require_once("include/funcs.php");
ini_set("session.gc_maxlifetime", 30*86400);  // PHP Session lifetime (30 days)
ini_set("session.cookie_lifetime", 30*86400);  // PHP Session cookie lifetime
session_start();


$postData = file_get_contents("php://input");

if ($postData == "")
{
  require_once("templates/shoppingList.php");
}
else
{
  $data = json_decode($postData, true);
  if ($data != NULL)
  {
    if ($data["action"] == "getList")
    {
      $userId = "Bob";
      getList($userId);
      die();
    }
  }
}
