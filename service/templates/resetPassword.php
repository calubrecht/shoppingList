<?php

global $CONFIG;
?>
<html><head><title>Reset Password</title>
<link rel="stylesheet" type="text/css" href="/css/kitchen.css" >
<link rel="icon" type="image/png" href="<?=$CONFIG["FAV_ICON"]?>" >
<script src="https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js"></script>
<script type='text/javascript' src='/js/slider.js'></script>
<script type='text/javascript' src='/js/kitchen.js'></script>
<meta name=viewport content=\"width=device-width, initial-scale=1\">
</head>
<body >
<h1><img src="<?= $CONFIG["BANNER"] ?>"><?=$CONFIG["BANNER_NAME"]?></h1>
<div id="Body">
<div class="navBar"><span class="tab active" >Reset Password</span></div>
<div id ="resetPasswordTab" class="tabBody narrow">
  <div class="error" id="resetPasswordError"></div>
  <form action="" method="post" id="resetPasswordForm">
  <div><div class="login firstColumn">Username:</div><div class="secondColumn"><?= $username ?></div></div>
  <div><div class="password firstColumn">Password:</div> <input type="password" name="password" class="secondColumn" autocomplete="new-password"></div>
  <div><div class="password firstColumn">Confirm Password:</div> <input type="password" name="confirmPassword" class="secondColumn"></div>
  <div><input type="button" class="ResetPasswordButton" value="ResetPassword" onclick="doResetPassword()"></div>
  <input type="hidden" name="token" value="<?= $token ?>" >
  </form>
</div>
