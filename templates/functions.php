<?php

function html_header($title, $bodyScript = "")
{
  global $AD_CONFIG;
  echo "<html><head><title>".$title."</title>";
  echo '<link rel="stylesheet" type="text/css" href="/css/sl.css" >';
  echo '<link rel="icon" type="image/png" href="'.$AD_CONFIG["FAV_ICON"].'" >';
  echo scriptTags();
  echo "<meta name=viewport content=\"width=device-width, initial-scale=1\">";
  echo "</head>\n";
  echo "<body " . $bodyScript .">\n";
  echo "<h1><img src=\"/".$AD_CONFIG["BANNER"]."\">".$AD_CONFIG["BANNER_NAME"]."</h1>";
}

function html_footer()
{
  echo "</body></html>\n";
}

function scriptTags()
{
  echo "<script type='text/javascript' src='/js/slider.js'></script>";
  echo "<script type='text/javascript' src='/js/shoppingList.js'></script>";
}

?>
