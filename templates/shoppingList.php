<?php 

require_once("functions.php");

html_header("Shopping List", "onload=\"loadShoppingList()\"");
?>
<h2>Welcome <?php echo $user; ?>!</h2>
<div class="navBar"><span class="tab active">Shopping List</span><span class="tab">Edit List</span></div>

<div id ="listTab" class="tabBody">
</div>
<?php
html_footer(); ?>
