<?php

function getWorkingList($user, $type, &$msg)
{
  global $db;
  $db->beginTransaction();
  $id = getLoginInfo($user)['idusers'];
  $list = array();
  try
  {
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
        return getWorkingList($user, "saved", $msg);
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

function setWorkingList($user, $type, $list)
{
  global $db;
  $db->beginTransaction();
  $userId = getLoginInfo($user)['idusers'];
  $currentIds = array();
  try
  {
    $db->execute("DELETE FROM lists WHERE userId = ? and listType=?", array($userId, $type)); 
    for ($i = 0; $i < count($list); $i++)
    {
       $item = $list[$i];
       $id = $item[0];
       $name = $item[1];
       $aisle = $item[2];
       $count = $item[3];
       $enabled = $item[4];
       $done = $item[5];
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


function saveDoneState($user, $request)
{
  global $db;
  $db->beginTransaction();
  $userId = getLoginInfo($user)['idusers'];
  try
  {
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
  }
  catch (Exception $e)
  {
    $db->rollbackTransaction();
    error_log("Unable to save done state for user" . $user . " - " . $e->getMessage());
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
?>
