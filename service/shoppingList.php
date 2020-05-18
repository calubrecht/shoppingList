<?php

function getTS($db, $userId, $list)
{
  error_log('getTS ' . implode(',', array($userId, $list)));
  return $db->queryOneColumn("SELECT lastUpdateTS from listTS Where userId=? and listName = ?", "lastUpdateTS", array($userId, $list));
}

function updateTS($db, $userId, $list)
{
  $db->execute("REPLACE INTO listTS (userId, listName, lastUpdateTS) VALUES (?, ?, NOW())", array($userId, $list));
  return getTS($db, $userId, $list);
}

function getWorkingList($user, $type, &$msg, &$ts)
{
  global $db;
  $db->beginTransaction();
  $id = getLoginInfo($user)['idusers'];
  $list = array();
  try
  {
    $ts = getTS($db, $id, $type);
    $res = $db->queryAll("SELECT id, name, aisle, count, active, done FROM lists WHERE userId = ? and listType = ? ORDER by orderKey ASC", array($id, $type));
    if ($res)
    {
      foreach ($res as $row)
      {
        array_push(
          $list,
          array("id" => $row["id"], "name" => $row["name"], "count" => $row["count"], "aisle" => $row['aisle'], "active" => $row["active"] == 1, "done" => $row["done"] == 1));
      }
    }
    else
    {
      $db->commitTransaction();
      if ($type == 'shop')
      {
        return getWorkingList($user, "saved", $msg, $ts);
      }
      if ($type == 'menu')
      {
        return  array();
      }
      error_log("Sending default default");
      $msg = "Welcome " . getUser() . ". You have no saved list. Here are some things to get you started.";
      return  array(
          array("id" => "id_Lumchmeat", "name" => "Lunchmeat", "count" => 1, "aisle" => "Deli Aisle", "active" => true, "done"=> false),
          array("id" => "id_SwissCheese", "name" => "Swiss Cheese", "count" => 2, "aisle" => "Deli Aisle", "active"=> true, "done"=> false),
          array("id" => "id_Liverwurst", "name" => "Liverwurst", "count" => 1, "aisle" => "Deli Aisle", "active"=> false, "done"=> false),
          array("id" => "id_Tomatoes", "name" => "Tomatoes", "count" => 8, "aisle" => "Produce Aisle", "active"=>true, "done"=> false),
          array("id" => "id_BranFlakes", "name" => "Bran Flakes", "count" => 1, "aisle" => "Aisle 3", "active"=>true, "done"=> false),
          array("id" => "id_Milk", "name" => "Milk", "count" => 2, "aisle" => "Dairy Aisle", "active"=>true, "done"=> false),
          array("id" => "id_FrozenPizza", "name" => "Frozen Pizza", "count" => 1, "aisle" => "Frozen Aisle", "active"=>true, "done"=> false));
    }
  }
  catch (Exception $e)
  {
    $db->rollbackTransaction();
    error_log("Unable to fetch list for user " . $user . " - " . $e->getMessage());
    return [];
  }

  $db->commitTransaction();
  return $list;
  
  
  
}

function validateName($name)
{
  if (!preg_match('/[ -~]+$/', $name))
  {
    return false;;
  }
  return true;
}


function safeID($id, $currentIds)
{

  if (!preg_match('/[a-zA-Z0-9]+$/', $id))
  {
    $id = uniqid('id_');
  }
  $idToUse = $id;
  $count = 0;
  while (in_array($idToUse, $currentIds))
  {
    $idToUse = $id . (string)$count;
    $oount ++;
  }
  return $idToUse;
}

function addItem($user, $type, $item, $id, $aisle, $order, &$ts)
{
  global $db;
  $db->beginTransaction();
  $userId = getLoginInfo($user)['idusers'];
  if ($aisle.trim == "" )
  {
    $aise = "UNKNOWN";
  }
  try
  {
    $ts = getTS($db, $userId, $type);
    // Compare TS
    $db->execute("UPDATE lists SET orderKey = orderKey +1 WHERE userId=? and listType=? and orderKey >= ?", array($userId, $type, $order));
    $db->execute(
      "INSERT INTO lists (userId, listType, orderKey, id, aisle, name, count, active, done) VALUES (?, ?, ?, ?, ?, ?, 1, 1, 0)",
      array($userId, $type, $order, $id, $aisle, $item));
    $ts = updateTS($db, $userId, $type);
  }
  catch (Exception $e)
  {
    $db->rollbackTransaction();
    error_log("Unable to add item " . $item . " - " . $e->getMessage());
    return "Failed to add item"; 
  }

  $db->commitTransaction();
}

function deleteItem($user, $type, $id, &$ts)
{
  global $db;
  $db->beginTransaction();
  $userId = getLoginInfo($user)['idusers'];
  try
  {
    $ts = getTS($db, $userId, $type);
    $order = $db->queryOneColumn("SELECT orderKey FROM lists WHERE userId=? and listType=? and id = ?", "orderKey", array($userId, $type, $id));
    $db->execute("UPDATE lists SET orderKey = orderKey -1 WHERE userId=? and listType=? and orderKey >= ?", array($userId, $type, $order));
    $db->execute("DELETE FROM lists WHERE userId =? and listType=? and id =?",
      array($userId, $type, $id));
    $ts = updateTS($db, $userId, $type);
  }
  catch (Exception $e)
  {
    $db->rollbackTransaction();
    error_log("Unable to add item " . $item . " - " . $e->getMessage());
    return "Failed to add item"; 
  } 
  $db->commitTransaction();
}

function setWorkingList($user, $type, $list, &$ts)
{
  global $db;
  $db->beginTransaction();
  $userId = getLoginInfo($user)['idusers'];
  $currentIds = array();
  try
  {
    error_log("setWorkingList for " . $user . " " . $userId . " ");
    $ts = getTS($db, $userId, $type);
    $db->execute("DELETE FROM lists WHERE userId = ? and listType=?", array($userId, $type)); 
    for ($i = 0; $i < count($list); $i++)
    {
       $item = $list[$i];
       $id = $item[0];
       $name = $item[1];
       $aisle = $item[2];
       if ($aisle.trim == "" )
       {
         $aise = "UNKNOWN";
       }
       $count = $item[3];
       $enabled = $item[4] ? 1 : 0;
       $done = $item[5] ? 1 : 0;
       if (!validateName($name))
       {
         $db->rollbackTransaction();
         return "$name is not a valid name";
       }
       if (!validateName($id))
       {
         $db->rollbackTransaction();
         return "Please enter a valid name";
       }
       $id = safeID($id, $currentIds);
       array_push($currentIds, $id);
       $res = $db->execute('INSERT INTO lists (userId, listType, orderKey, id, aisle, name, count, active, done) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', array($userId, $type, $i, $id, $aisle, $name, $count, $enabled, $done));
       $qry = 'INSERT INTO lists (userId, listType, orderKey, id, aisle, name, count, active, done) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'. implode(",", array($userId, $type, $i, $id, $aisle, $name, $count, $enabled, $done, 'nogus'));
       $ts = updateTS($db, $userId, $type);
       error_log("Updated ts, ts= " .$ts);
       if (!$res)
       {
         $db->rollbackTransaction();
         if ($db->error)
         {
           error_log("Unable to save list for user " . $user . " - " . $db->error);
         }
         else
         {
           error_log("Unable to save list for user " . $user . " - unknown error");
           error_log("failed query = " .$qry);
         }
         return "WTH?";
       }
    }
  }
  catch (Exception $e)
  {
    $db->rollbackTransaction();
    error_log("Unable to save list for user " . $user . " - " . $e->getMessage());
    return "Failed to save list"; 
  }

  $db->commitTransaction();
}


function saveDoneState($user, $request, &$ts)
{
  global $db;
  $db->beginTransaction();
  $userId = getLoginInfo($user)['idusers'];
  try
  {
    $ts = getTS($db, $userId, $type);
    $id = $request['id'];
    $doneState = $request['doneState'] ? 1 : 0;
    $res = $db->execute("UPDATE lists set done = ? where userId =? and listType='shop' and id=?", array($doneState, $userId, $id)); 
    if (!$res)
    {
       $db->rollbackTransaction();
       if ($db->error)
       {
         error_log("Unable to save done state for user" . $user . " - " . $db->error);
       }
       else
       {
         error_log("Unable to save done state for user" . $user . " - unknown error");
       }
       return "Unable to save done state";
    }
    $ts = updateTS($db, $userId, $type);
  }
  catch (Exception $e)
  {
    $db->rollbackTransaction();
    error_log("Unable to save done state for user" . $user . " - " . $e->getMessage());
    return "Failed to save list"; 
  }
  $db->commitTransaction();
}

function saveEnabledState($user, $request, &$ts)
{
  global $db;
  $db->beginTransaction();
  $userId = getLoginInfo($user)['idusers'];
  try
  {
    $ts = getTS($db, $userId, $type);
    $id = $request['id'];
    $enabledState = $request['enabledState'] ? 1 : 0;
    $res = $db->execute("UPDATE lists set active = ? where userId =? and listType='shop' and id=?", array($enabledState, $userId, $id)); 
    if (!$res)
    {
       $db->rollbackTransaction();
       if ($db->error)
       {
         error_log("Unable to save enabled state for user" . $user . " - " . $db->error);
       }
       else
       {
         error_log("Unable to save enabled state for user" . $user . " - unknown error");
       }
       return "Unable to save enabled state";
    }
    $ts = updateTS($db, $userId, $type);
  }
  catch (Exception $e)
  {
    $db->rollbackTransaction();
    error_log("Unable to save enabled state for user" . $user . " - " . $e->getMessage());
    return "Failed to save list"; 
  }
  $db->commitTransaction();
}

function saveCount($user, $request)
{
  global $db;
  $db->beginTransaction();
  $userId = getLoginInfo($user)['idusers'];
  try
  {
    $id = $request['id'];
    $count = $request['count'];
    $res = $db->execute("UPDATE lists set count = ? where userId =? and listType='shop' and id=?", array($count, $userId, $id)); 
    if (!$res)
    {
       $db->rollbackTransaction();
       if ($db->error)
       {
         error_log("Unable to save count for user" . $user . " - " . $db->error);
       }
       else
       {
         error_log("Unable to save count for user" . $user . " - unknown error");
       }
       return "Unable to save count";
    }
  }
  catch (Exception $e)
  {
    $db->rollbackTransaction();
    error_log("Unable to save count for user" . $user . " - " . $e->getMessage());
    return "Failed to save list"; 
  }
  $db->commitTransaction();
}

function resetDoneState($user, $type)
{
  global $db;
  $db->beginTransaction();
  $userId = getLoginInfo($user)['idusers'];
  try
  {
    $res = $db->execute("UPDATE lists set done = 0 where userId =? and listType=?", array($userId, $type)); 
    if (!$res)
    {
       $db->rollbackTransaction();
       if ($db->error)
       {
         error_log("Unable to reset done state for user" . $user . " - " . $db->error);
       }
       else
       {
         error_log("Unable to reset done state for user" . $user . " - unknown error");
       }
       return "Unable to reset done state";
     }
  }
  catch (Exception $e)
  {
    $db->rollbackTransaction();
    error_log("Unable to reset done state for user" . $user . " - " . $e->getMessage());
    return "Unable to reset done state";
  }
  $db->commitTransaction();
}

function getRecipes($user)
{
  global $db;
  $db->beginTransaction();
  $id = getLoginInfo($user)['idusers'];
  $list = array();
  try
  {
    $res = $db->queryAll("SELECT name, text, keyIngredients, commonIngredients, id FROM recipes WHERE userId = ? ", $id);
    if ($res)
    {
      foreach ($res as $row)
      {
        $kI_string = $row["keyIngredients"];
        $cI_string = $row["commonIngredients"];
        array_push(
          $list,
          array("name" => $row["name"], "text" => $row["text"], "keyIngredients" => json_decode($kI_string), "commonIngredients" => json_decode($cI_string), "id" => $row["id"] ));
      }
    }
    else
    {
      $db->rollbackTransaction();
      return  array();
    }
  }
  catch (Exception $e)
  {
    $db->rollbackTransaction();
    error_log("Unable to fetch recipe for user " . $user . " - " . $e->getMessage());
    return [];
  }
  $db->rollbackTransaction();
  return $list;
}

function editRecipe($user, $recipe)
{
  global $db;
  $db->beginTransaction();
  $id = getLoginInfo($user)['idusers'];
  try
  {
    $keyIngredients = json_encode($recipe['keyIngredients']);
    $commonIngredients = json_encode($recipe['commonIngredients']);
    $res = $db->execute("UPDATE recipes set text=?, keyIngredients=?, commonIngredients=? WHERE userId=? and name=?", array($recipe['text'], $keyIngredients, $commonIngredients, $id, $recipe['name']));
    if (!$res)
    {
      error_log("Unable to edit recipe " . $recipe['name'] . " - DBError:" . $db->error);
      return "Failed to edit recipe - " . $db->error;
    }
  }
  catch (Exception $e)
  {
    $db->rollbackTransaction();
    error_log("Unable to edit recipe " . $recipe['name'] . " - " . $e->getMessage());
    return "Failed to edit recipe";
  }
  $db->commitTransaction();
}

function deleteRecipe($user, $recipe)
{
  global $db;
  $db->beginTransaction();
  $id = getLoginInfo($user)['idusers'];
  try
  {
    $res = $db->execute("DELETE FROM recipes  WHERE userId=? and name=?", array($id, $recipe));
    error_log("DELETE FROM recipes  WHERE userId=? and name=?" . $id . '-' .$recipe);
      
    if (!$res)
    {
      error_log("Unable to delete recipe " . $recipe . " - DBError:" . $db->error);
      return "Failed to deleterecipe - " . $db->error;
    }
  }
  catch (Exception $e)
  {
    $db->rollbackTransaction();
    error_log("Unable to delete recipe " . $recipe . " - " . $e->getMessage());
    return "Failed to delete recipe";
  }
  $db->commitTransaction();
}

function addRecipe($user, $recipe)
{
  global $db;
  $db->beginTransaction();
  $id = getLoginInfo($user)['idusers'];
  try
  {
    $res = $db->queryAll("SELECT (max(id) + 1) as nextId FROM recipes WHERE userId = ? ", $id);
    if (res)
    {
      $recipeId = $res[0]["nextId"];
    }
    else
    {
      $recipeId = 1;
    }
    $keyIngredients = json_encode($recipe['keyIngredients']);
    $commonIngredients = json_encode($recipe['commonIngredients']);
    $res = $db->execute("INSERT INTO recipes (userId, name, text, keyIngredients, commonIngredients, id) VALUES (?, ?, ?, ?, ?, ?) ", array($id, $recipe['name'], $recipe['text'], $keyIngredients, $commonIngredients, $recipeID));
    if (!$res)
    {
      error_log("Unable to add recipe " . $recipe['name'] . " - DBError:" . $db->error);
      return "Failed to add recipe - " . $db->error;
    }
  }
  catch (Exception $e)
  {
    $db->rollbackTransaction();
    error_log("Unable to add recipe " . $recipe['name'] . " - " . $e->getMessage());
    return "Failed to add recipe";
  }
  $db->commitTransaction();
}

?>
