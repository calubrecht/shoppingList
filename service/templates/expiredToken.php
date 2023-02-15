<?php

global $CONFIG;
?>
<html><head><title>Reset Password</title>
<link rel="stylesheet" type="text/css" href="/css/kitchen.css" >
<link rel="icon" type="image/png" href="<?=$CONFIG["FAV_ICON"]?>" >
<meta name=viewport content=\"width=device-width, initial-scale=1\">
</head>
<body >
<h1><img src="<?= $CONFIG["BANNER"] ?>"><?=$CONFIG["BANNER_NAME"]?></h1>
<div id="Body">
<div class="navBar"><span class="tab active" >Reset Password</span></div>
<div id ="resetPasswordTab" class="tabBody narrow">
  <div class="error" id="resetPasswordError">This password token cannot be found or has expired, please request a new password reset token.</div>
</div>
</body>
