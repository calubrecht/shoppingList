<?php

function getWorkingList($user)
{
  global $db;
  $db->beginTransaction();
  $id = getLoginInfo($user)['idusers'];
  $list = array();
  try
  {
    $res = $db->queryAll("SELECT id, name, count, active FROM lists WHERE userId = ? ORDER by orderKey ASC", $id);
    if ($res)
    {
      foreach ($res as $row)
      {
        array_push(
          $list,
          array("id" => $row["id"], "name" => $row["name"], "count" => $row["count"], "aisle" => "Aisle 1", "active" => $row["active"] == 1));
      }
    }
    else
    {
      $db->commitTransaction();
      return  array(
          array("id" => "Sushi", "name" => "Sushi", "count" => 1, "aisle" => "1", "active" => true),
          array("id" => "Pumpkin", "name" => "Pumpkin", "count" => 2, "aisle" => "2", "active"=> false),
          array("id" => "Flesh", "name" => "Flesh", "count" => 1, "aisle" => "1", "active"=>true),
          array("id" => "Anaconda", "name" => "Anaconda", "count" => 1, "aisle" => "1", "active"=>true));
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

function setWorkingList($user, $list)
{
  global $db;
  $db->beginTransaction();
  $userId = getLoginInfo($user)['idusers'];
  $currentIds = array();
  try
  {
    $db->execute("DELETE FROM lists WHERE userId = ? ", $userId); 
    for ($i = 0; $i < count($list); $i++)
    {
       $item = $list[$i];
       $id = $item[0];
       $name = $item[1];
       $count = $item[2];
       $enabled = $item[3];
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
       $res = $db->execute('INSERT INTO lists (userId, listType, orderKey, id, aisle, name, count, active) VALUES (?, "saved", ?, ?, ?, ?, ?, ?)', array($userId, $i, $id, 'aisle 1', $name, $count, $enabled));
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


?>
