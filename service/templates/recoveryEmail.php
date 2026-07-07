<?php
$resetLink = htmlspecialchars($data["host"]) . "/resetPassword/" . htmlspecialchars($data["passwordToken"]);
$bannerName = htmlspecialchars($data["BANNER_NAME"]);
$userName = htmlspecialchars($data["userName"]);
?>
<html>
<head>
<meta charset="UTF-8">
</head>
<body style="margin:0; padding:24px; background:#d9ded7; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; color:#202822;">
<div style="max-width:480px; margin:0 auto;">
  <h1 style="margin:0 0 16px; font-size:1.4rem; letter-spacing:-0.01em; color:#278a5e;"><?= $bannerName ?></h1>
  <div style="background:#ffffff; border-radius:14px; box-shadow:0 4px 16px rgba(20,30,25,0.08); padding:24px;">
    <p style="margin:0 0 12px;">
      Someone has requested to reset your password for <strong><?= $userName ?></strong>.
      If this wasn't you, you don't need to take any action.
    </p>
    <p style="margin:0 0 20px;">
      If you do wish to reset your password, click below. This link will expire in 5 minutes:
    </p>
    <p style="margin:0 0 20px; text-align:center;">
      <a href="<?= $resetLink ?>"
         style="display:inline-block; background:#2f9e6e; color:#ffffff; text-decoration:none; font-weight:600; padding:10px 22px; border-radius:8px;">
        Reset Password
      </a>
    </p>
    <p style="margin:0; font-size:0.85rem; color:#63706a; word-break:break-all;">
      Or copy this link into your browser:<br>
      <a href="<?= $resetLink ?>" style="color:#278a5e;"><?= $resetLink ?></a>
    </p>
  </div>
</div>
</body>
</html>
