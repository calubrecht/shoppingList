<?php

function getWorkingList($user)
{
  global $db;
  $db->beginTransaction();
  $id = getLoginInfo($user)['idusers'];
  $list = array();
  try
  {
    $res = $db->queryAll("SELECT name, count, active FROM lists WHERE userId = ? ORDER by orderKey ASC", $id);
    if ($res)
    {
      foreach ($res as $row)
      {
        array_push(
          $list,
          array("name" => $row["name"], "count" => $row["count"], "aisle" => "Aisle 1", "active" => $row["active"]));
      }
    }
    else
    {
      $db->commitTransaction();
      return  array(
          array("name" => "Sushi", "count" => 1, "aisle" => "1", "active" => true),
          array("name" => "Pumpkin", "count" => 2, "aisle" => "2", "active"=> false),
          array("name" => "Flesh", "count" => 1, "aisle" => "1", "active"=>true),
          array("name" => "Anaconda", "count" => 1, "aisle" => "1", "active"=>true));
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
  return true;
}

function setWorkingList($user, $list)
{
  global $db;
  $db->beginTransaction();
  $id = getLoginInfo($user)['idusers'];
  try
  {
    $db->execute("DELETE FROM lists WHERE userId = ? ", $id); 
    for ($i = 0; $i < count($list); $i++)
    {
       $item = $list[$i];
       $name = $item[0];
       $count = $item[1];
       $enabled = $item[2];
       if (!validateName($name))
       {
         $db->rollbackTransaction();
         return "Please enter a valid name";
       }
       $db->execute('INSERT INTO lists (userId, listType, orderKey, aisle, name, count, active) VALUES (?, "saved", ?, ?, ?, ?, ?)', array($id, $i, 'aisle 1', $name, $count, $enabled));
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
