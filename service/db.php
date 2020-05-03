<?php

class dbHolder
{
  private $dbInited = false;
  private $db;
  public $error;
  public $errorCode;

  public function getDB()
  {
    $this->dbInit();
    return $this->db;
  }

  public function execute($query, $arguments)
  {
    try
    { 
      $this->error = '';
      $this->dbInit();
      $params = is_array($arguments) ? $arguments : array($arguments);
      $statement = $this->db->prepare($query);
      if (!$statement)
      {
        $this->error = "PrepareStatement Error:" + $this->db->errorInfo();
        return false;
      }
      if($statement->execute($params))
      {
        $statement->closeCursor();
        return true;
      }
      $statement->closeCursor();
      $this->error = "ExecuteStatement Error:" + $this->db->errorInfo();
      return false;
		}
    catch (PDOException $e) {
			$this->error = "PDOException: ".$e->getMessage();
			$this->errorCode = $e->getCode();
      return false;
		}
  }

  public function queryAll($query, $arguments)
  {
    try
    { 
      $this->error = '';
      $this->dbInit();
      $params = is_array($arguments) ? $arguments : array($arguments);
      $statement = $this->db->prepare($query);
      if (!$statement)
      {
        $this->error = "PrepareStatement Error:" + $this->db->errorInfo();
        $this->errorCode = NULL;
        return false;
      }
      if($statement->execute($params))
      {
        $result = $statement->fetchAll(PDO::FETCH_ASSOC);
        $statement->closeCursor();
        return $result;
      }
      $statement->closeCursor();
      $this->error = "ExecuteStatement Error:" + $this->db->errorInfo();
      $this->errorCode = NULL;
      return false;
		}
    catch (PDOException $e) {
			$this->error = "PDOException: ".$e->getMessage();
			$this->errorCode = $e->getCode();
      return false;
		}
  }
  
  public function queryOneRow($query, $arguments)
  {
    $result = $this->queryAll($query, $arguments);
    if (!$result)
    {
      if (!isset($this->error))
      {
        $this->error = "No rows returned.";
      }
      return false;
    }
    return $result[0];
  }
  
  public function queryOneColumn($query, $column, $arguments)
  {
    $result = $this->queryOneRow($query, $arguments);
    if (!$result)
    {
      return false;
    }
    return $result[$column];
  }

  public function beginTransaction()
  {
    $this->dbInit();
    $this->db->beginTransaction();
  }
  
  public function commitTransaction()
  {
    $this->db->commit();
  }
  
  public function rollbackTransaction()
  {
    $this->db->rollBack();
  }

  public function dbInit()
  {
    global $CONFIG;
    if ($this->dbInited)
    {
      return;
    }
		try
    {
      $this->error = '';
		  $host = $CONFIG["DB_HOST"];
      $dbName = $CONFIG["DB_NAME"];
      $dbport = $CONFIG["DB_PORT"];
      $dbuser = $CONFIG["DB_USER"];
      $dbpass = $CONFIG["DB_PASSWORD"];
			$pdo_connect = 'mysql:host='.$host.';dbname='.$dbName;
		  $pdo_connect .= ';port='.$dbport;
			$this->db = new PDO($pdo_connect, $dbuser, $dbpass, array(PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION));
      $this->dbInited = true;

		} catch (PDOException $e) {
			$this->error = "PDOException: ".$e->getMessage();
		}

  }
}

$db = new dbHolder();
?>
