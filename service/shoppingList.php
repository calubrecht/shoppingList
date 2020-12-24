<?php


define('DEFAULT_LIST_NAME', "Default");

function getTS($db, $userId, $list)
{
  $res =  $db->queryOneColumn("SELECT lastUpdate from listTS Where userId=? and listName = ?", "lastUpdate", array($userId, $list));
  if ($res)
  {
    return $res;
  }
  return 0;
}

function updateTS($db, $userId, $list, $ts)
{
  $res = $db->execute("REPLACE INTO listTS (userId, listName, lastUpdate) VALUES (?, ?,?)", array($userId, $list, $ts));
  if (!$res)
  {
    error_log("Unable to update ts:" . $db->error);
  }
  return $ts;
}

function getTStamps($user)
{
  global $db;
  $userId = getLoginInfo($user)['idusers'];
  $db->beginTransaction();
  $res = $db->queryAll("SELECT listName,lastUpdate from listTS Where userId=?",  array($userId));
  $tstamps = array();
  if ($res)
  {
      foreach ($res as $row)
      {
        $tstamps[$row["listName"]] = $row["lastUpdate"];
      }
  }
  $db->rollbackTransaction();
  return $tstamps;
}

function getWorkingList($user, $type, $name, &$msg, &$ts)
{
  global $db;
  $db->beginTransaction();
  $id = getLoginInfo($user)['idusers'];
  $list = array();
  try
  {
    $ts = getTS($db, $id, $type);
    $res = $db->queryAll("SELECT id, name, aisle, count, active, done FROM lists inner join listNames on lists.listNameId = listNames.listNameId AND lists.userId=listNames.userId WHERE lists.userId = ? and listType = ? and listName= ? ORDER by orderKey ASC", array($id, $type, $name));
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
        return getWorkingList($user, "saved", $name, $msg, $ts);
      }
      if ($type == 'menu')
      {
        return  array();
      }
      if ($name != DEFAULT_LIST_NAME)
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

function getMenu($user, &$msg, &$ts)
{
  return getWorkingList($user, "menu", DEFAULT_LIST_NAME, $msg, $ts);
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
  $idcount = 0;
  while (in_array($idToUse, $currentIds))
  {
    $idToUse = $id . (string)$idcount;
    $idcount++;
  }
  return $idToUse;
}

function getListNameId($userid, $listName)
{
  global $db;
  $row =  $db->queryOneRow("SELECT listNameId FROM listNames WHERE listName=? AND userId=?", array($listName, $userid));
  if (!$row)
  {
    return -1;
  }
  return $row["listNameId"];
}

function addItem($user, $type, $listName, $item, $id, $aisle, $order, &$ts)
{
  global $db;
  $db->beginTransaction();
  $userId = getLoginInfo($user)['idusers'];
  if (trim($aisle) == "" )
  {
    $aise = "UNKNOWN";
  }
  try
  {
    $listNameId = getListNameId($userId, $listName);
    if ($listNameId == -1)
    {
      $db->rollbackTransaction();
      error_log("Unable to add item " . $item . " - cannot find listNameId");
      return "Failed to add item"; 
    }
    $ts = getTS($db, $userId, $type);
    // Compare TS
    $db->execute("UPDATE lists SET orderKey = orderKey +1 WHERE userId=? and listType=? and orderKey >= ? and listNameId= ?", array($userId, $type, $order, $listNameId));
    $db->execute(
      "INSERT INTO lists (userId, listType, listNameId, orderKey, id, aisle, name, count, active, done) VALUES (?, ?, ?, ?, ?, ?, ?, 1, 1, 0)",
      array($userId, $type, $listNameId, $order, $id, $aisle, $item));
    $ts = updateTS($db, $userId, $type, $ts+1);
  }
  catch (Exception $e)
  {
    $db->rollbackTransaction();
    error_log("Unable to add item " . $item . " - " . $e->getMessage());
    return "Failed to add item"; 
  }

  $db->commitTransaction();
}

function deleteItem($user, $type, $listName, $id, &$ts)
{
  global $db;
  $db->beginTransaction();
  $userId = getLoginInfo($user)['idusers'];
  try
  {
    $listNameId = getListNameId($userId, $listName);
    if ($listNameId == -1)
    {
      $db->rollbackTransaction();
      error_log("Unable to delete item - cannot find listNameId");
      return "Failed to delete item"; 
    }
    $ts = getTS($db, $userId, $type);
    $order = $db->queryOneColumn("SELECT orderKey FROM lists WHERE userId=? and listType=? and id = ? and listNameId = ?", "orderKey", array($userId, $type, $id, $listNameId));
    $db->execute("UPDATE lists SET orderKey = orderKey -1 WHERE userId=? and listType=? and orderKey >= ? and listNameId = ?", array($userId, $type, $order, $listNameId));
    $db->execute("DELETE FROM lists WHERE userId =? and listType=? and id =? and listNameId = ?",
      array($userId, $type, $id, $listNameId));
    $ts = updateTS($db, $userId, $type, $ts +1);
  }
  catch (Exception $e)
  {
    $db->rollbackTransaction();
    error_log("Unable to delete item " . $item . " - " . $e->getMessage());
    return "Failed to delete item"; 
  } 
  $db->commitTransaction();
}

function setWorkingList($user, $type, $listName, $list, &$ts)
{
  global $db;
  $db->beginTransaction();
  $userId = getLoginInfo($user)['idusers'];
  $currentIds = array();
  try
  {
    $oldts = $ts;
    $ts = getTS($db, $userId, $type);
    if ($oldts != $ts && $ts)
    {
      $db->rollbackTransaction();
      return "List out of date, reverting to current.";
    }
    $listNameId = getListNameId($userId, $listName);
    if ($listNameId == -1)
    {
      $db->rollbackTransaction();
      error_log("Unable to save list for user " . $user . " - cannot find listNameId");
      return "Unable to save list";
    }
    $db->execute("DELETE FROM lists WHERE userId = ? and listType=? and listNameId=?", array($userId, $type, $listNameId)); 
    for ($i = 0; $i < count($list); $i++)
    {
       $item = $list[$i];
       $id = $item[0];
       $name = $item[1];
       $aisle = $item[2];
       if (trim($aisle) == "" )
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
       $res = $db->execute('INSERT INTO lists (userId, listType, listNameId, orderKey, id, aisle, name, count, active, done) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', array($userId, $type, $listNameId, $i, $id, $aisle, $name, $count, $enabled, $done));
       $qry = 'INSERT INTO lists (userId, listType, listNameId, orderKey, id, aisle, name, count, active, done) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'. implode(",", array($userId, $type, $listNameId, $i, $id, $aisle, $name, $count, $enabled, $done, 'nogus'));
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
    $ts = updateTS($db, $userId, $type, $ts+1);
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
    $ts = getTS($db, $userId, 'shop');
    $id = $request['id'];
    $doneState = $request['doneState'] ? 1 : 0;
    $listName = $request['listName'];
    $listNameId = getListNameId($userId, $listName);
    if ($listNameId == -1)
    {
      $db->rollbackTransaction();
           error_log("Unable to save done state - " . $db->error);
      return "Unable to save done state";
    }
    $res = $db->execute("UPDATE lists set done = ? where userId =? and listType='shop' and id=? and listNameId=?", array($doneState, $userId, $id, $listNameId)); 
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
    $ts = updateTS($db, $userId, 'shop', $ts +1);
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
    $ts = getTS($db, $userId, 'shop');
    $id = $request['id'];
    $enabledState = $request['enabledState'] ? 1 : 0;
    $listName = $request['listName'];
    $listNameId = getListNameId($userId, $listName);
    if ($listNameId == -1)
    {
      $db->rollbackTransaction();
           error_log("Unable to save enabled state - " . $db->error);
      return "Unable to save enabled state";
    }
    $res = $db->execute("UPDATE lists set active = ? where userId =? and listType='shop' and id=? and listNameId=?", array($enabledState, $userId, $id, $listNameId)); 
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
    $ts = updateTS($db, $userId, 'shop', $ts +1);
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
    $listName = $request['listName'];
    $listNameId = getListNameId($userId, $listName);
    if ($listNameId == -1)
    {
      $db->rollbackTransaction();
           error_log("Unable to save count - " . $db->error);
      return "Unable to save count";
    }
    $res = $db->execute("UPDATE lists set count = ? where userId =? and listType='shop' and id=? and listNameId=?", array($count, $userId, $id, $listNameId)); 
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

function resetDoneState($user, $type, $listName)
{
  global $db;
  $db->beginTransaction();
  $userId = getLoginInfo($user)['idusers'];
  try
  {
    $listNameId = getListNameId($userId, $listName);
    if ($listNameId == -1)
    {
      $db->rollbackTransaction();
           error_log("Unable to reset done state - " . $db->error);
      return "Unable to reset done state";
    }
    $res = $db->execute("UPDATE lists set done = 0 where userId =? and listType=? and listNameId=?", array($userId, $type, $listNameId)); 
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
    $res = $db->queryAll("SELECT name, text, keyIngredients, commonIngredients, id FROM recipes WHERE userId = ? ORDER BY sortOrder ASC", $id);
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

function getListNames($user)
{
  global $db;
  $db->beginTransaction();
  $id = getLoginInfo($user)['idusers'];
  try
  {
    $res = $db->queryAll("SELECT listName FROM listNames WHERE userId = ? ORDER BY listName ASC", $id);
    return array_map( function($entry) { return $entry["listName"];}, $res);
  }
  catch (Exception $e)
  {
    $db->rollbackTransaction();
    error_log("Unable to fetch listNames for user " . $user . " - " . $e->getMessage());
    return array();
  }
  $db->rollbackTransaction();
  return array();
}

function addList($user, $listName)
{
  global $db;
  $db->beginTransaction();
  $id = getLoginInfo($user)['idusers'];
  try
  {
    $res = $db->execute("INSERT INTO listNames (userId, listName) VALUES (?, ?)", array($id, $listName));
    if (!$res)
    {
      $errors = "Unable to add list";
      error_log("Unable to add list - " . $db->error);
    }
  }
  catch (Exception $e)
  {
    $db->rollbackTransaction();
    error_log("Unable to add list - " . $e->getMessage());
    return "Unable to add list";
  }
  $db->commitTransaction();
  return $errors;
}

function removeList($user, $listName)
{
  global $db;
  $db->beginTransaction();
  $id = getLoginInfo($user)['idusers'];
  try
  {
    $res = $db->execute("DELETE FROM listNames where userId = ? AND listName = ?", array($id, $listName));
    if (!$res)
    {
      $errors = "Unable to remove list";
      error_log("Unable to remove list - " . $db->error);
    }
  }
  catch (Exception $e)
  {
    $db->rollbackTransaction();
    error_log("Unable to remove list - " . $e->getMessage());
    return "Unable to remove list";
  }
  $db->commitTransaction();
  return $errors;
}
function setOrder($user, $orderedItems)
{
  global $db;
  $db->beginTransaction();
  $id = getLoginInfo($user)['idusers'];
  try
  {
    $sortOrder = 1;
    $errors = '';
    foreach ($orderedItems as $itemID )
    {
      $res = $db->execute("UPDATE recipes set sortOrder=? WHERE userId=? and id=?", array($sortOrder, $id, $itemID));
      $sortOrder++;
      if (!$res)
      {
        $errors = "Unable to update sort order " . $db->error;
      }
    }
  }
  catch (Exception $e)
  {
    $db->rollbackTransaction();
    return "Failed to update sort order";
  }
  $db->commitTransaction();
  return $errors;
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
    if ($res)
    {
      $recipeId = $res[0]["nextId"];
      if (!$recipeId)
      {
        $recipeId = 1;
      }
    }
    else
    {
      $recipeId = 1;
    }
    $res = $db->queryAll("SELECT (max(sortOrder) + 1) as nextOrder FROM recipes WHERE userId = ? ", $id);
    if ($res)
    {
      $sortOrder = $res[0]["nextOrder"];
      if (!$sortOrder)
      {
        $sortOrder = 1;
      }
    }
    else
    {
      $sortOrder = 1;
    }
    $keyIngredients = array_key_exists('keyIngredients', $recipe) ? json_encode($recipe['keyIngredients']) : '[]';
    $commonIngredients = array_key_exists('commonIngredients', $recipe) ? json_encode($recipe['commonIngredients']) : '[]';
    $res = $db->execute("INSERT INTO recipes (userId, name, text, keyIngredients, commonIngredients, id, sortOrder) VALUES (?, ?, ?, ?, ?, ?, ?) ", array($id, $recipe['name'], $recipe['text'], $keyIngredients, $commonIngredients, $recipeId, $sortOrder));
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
