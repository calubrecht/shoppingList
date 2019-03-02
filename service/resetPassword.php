<?php

ini_set("session.cookie_lifetime", 60*60*24*30); // 30 days
ini_set("session.gc_maxlifetime", 60*60*24*30); // 30 days
@session_start();
require_once("config.php");
require_once("db.php");
require_once("login.php");


$username = getUsernameFromToken($_GET["token"]);
if (!$username)
{
  require_once("templates/expiredToken.php");
  die();
}
$token = $_GET["token"];
$_SESSION["token"] = $token;
require_once("templates/resetPassword.php");
die();

?>
