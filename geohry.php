<?
function getVar($arr, $var, $def=null) {
  if(!isset($arr) || !is_array($arr)) return $def;
  if(!isset($arr[$var])) return $def;
	return $arr[$var];
}
function GET($var, $def=null, $empty=false) { return getVar($_GET, $var, $def); }
function GETB($var) { return isset($_GET[$var]); }
function POST($var, $def=null, $empty=false) { return getVar($_POST, $var, $def); }
function SESS($var, $def=null, $empty=false) { return getVar($_SESSION, $var, $def); }

function fGET() {
  $keys = func_get_args();
  foreach($keys as $key) {
    $val = GET($key);
    if(is_string($val)) $val = trim($val);
    $GLOBALS[$key] = $val;
  }
}

function fPOST() {
  $keys = func_get_args();
  foreach($keys as $key) {
    $val = POST($key);
    if(is_string($val)) $val = trim($val);
    $GLOBALS[$key] = $val;
  }
}

function debuglog($data) {
	file_put_contents("log/debug.log", var_export($data, true), FILE_APPEND);
}

include "config.php";

class MySQL extends mysqli {
  function __construct() {
    parent::__construct(MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DB);
  }

  public $key;

  function format($type, $var) {
		switch($type) {
			case "i":
			case "d":	return (int)$var;
	    case "f":	return (float)$var;
			case "%": return "%";
	    case "s": return "'".$this->real_escape_string(trim($var))."'";
			default: return "''"; break;
		}
  }

	private $args = array();
	function buildQuery($query) {
		$this->args = func_get_args();
		array_shift($this->args);
		$callback = function($m) { return $this->format($m[1], array_shift($this->args)); };
		$result = preg_replace_callback("/%([^%])/", $callback, $query);
		//file_put_contents("log/query.log", $result."\n", FILE_APPEND);
		return $result;
	}

	function exec($query) {
		$args = func_get_args();
		$query = call_user_func_array(array($this, "buildQuery"), $args);
		return $this->query($query);
	}

  function select($query) {
    $return = array();
		$args = func_get_args();
		$query = call_user_func_array(array($this, "buildQuery"), $args);
    $result = $this->query($query);
    if($result) while($row=$result->fetch_assoc()) {
      if($this->key) $return[$row[$this->key]] = $row;
      else $return[] = $row;
    }
    $this->key = null;
    return $return;
  }

  function selectOne($query) {
		$args = func_get_args();
		$query = call_user_func_array(array($this, "buildQuery"), $args);
    $result = $this->query($query);
    if($result) return $result->fetch_assoc();
    return [];
  }

  function insert($table, $data) {
    $keys = array_keys($data);
    $atts = []; $types = [];
    foreach($keys as $key) {
      $i = explode("=", $key);
      $atts[] = $i[0];
      $types[] = $i[1] ?: "%s";
    }
    $query = sprintf("INSERT INTO %s (%s) VALUES (%s)", $table, implode(",", $atts), implode(",", $types));
    $values = array_values($data);
    array_unshift($values, $query);
    return call_user_func_array(array($this, "exec"), $values);
  }

  function update($table, $data, $where) {
    $keys = array_keys($data);
    foreach($keys as $i=>$key) {
      if(strpos($key,"=")===false) $keys[$i].= "=%s";
    }
    $values = array_values($data);
    $query = sprintf("UPDATE %s SET %s WHERE %s LIMIT 1", $table, implode(",",$keys), $where);
    array_unshift($values, $query);
    return call_user_func_array(array($this, "exec"), $values);
  }
}

class Model extends MySQL {
  protected $version;
  function __construct($version) {
    parent::__construct();
    $this->version = $version;
  }
	function fsdata($obj) {
		if(is_dir($obj)) return "dir";
		else if(is_file($obj)) return "file";
		else return "";
	}
	function registerUser($login, $pass) {
		$exists = $this->selectOne("SELECT id FROM logins%d WHERE login=%s", $this->version, $login);
		if($exists) return 0;
		$this->exec("INSERT INTO logins%d SET login=%s, hash=MD5(%s)", $this->version, $login, $pass);
		return md5($pass);
	}
	function registerGame($game, $pass) {
		$game = strtr($game, [".."=>"", "\\"=>""]);
		$exists = $this->selectOne("SELECT url FROM games%d WHERE url=%s", $this->version, $game);
		if($exists) return 0;
		$this->exec("INSERT INTO games%d SET url=%s, hash=MD5(%s)", $this->version, $game, $pass);
		mkdir("games/$game");
		return md5($pass);
	}
	function loginUser($login, $pass) {
		$exists = $this->selectOne("SELECT hash FROM logins%d WHERE login=%s AND hash=MD5(%s)", $this->version, $login, $pass);
		if(!$exists) return "";
		return $exists["hash"];
	}
	function loginGame($game, $pass) {
		$exists = $this->selectOne("SELECT hash FROM games%d WHERE url=%s AND hash=MD5(%s)", $this->version, $game, $pass);
		if(!$exists) return "";
		return $exists["hash"];
	}
	function gamesInDistrict($district) {
		$demo = "CASE WHEN COALESCE(demo,'')='' THEN 0 ELSE 1 END AS demo";
		return json_encode($this->select("SELECT *,$demo FROM games%d WHERE district=%s", $this->version, $district));
	}
	function getGame($game, $pass) {
		$result = $this->selectOne("SELECT * FROM games%d WHERE url=%s AND hash=%s", $this->version, $game, $pass);
		if(!$result) return "";
		return json_encode($result);
	}
	function getDemoGame($game, $demo) {
		$result = $this->selectOne("SELECT * FROM games%d WHERE url=%s AND demo=%s", $this->version, $game, $demo);
		if(!$result) return "";
		return json_encode($result);
	}
	function setGame($in) {
		$keys = ["lat","lng","radius","name","reason","personal","welcome","start","goodbye","message","demo"];
		$data = [];	foreach($keys as $key) $data[$key] = $in[$key];
		$where = $this->buildQuery("url=%s AND hash=%s", $in["url"], $in["hash"]);
		$this->update("games$this->version", $data, $where);
		return $this->affected_rows;
	}
	function verifyGame($url, $hash) {
		$found = $this->selectOne("SELECT url FROM games%d WHERE url=%s AND hash=%s", $this->version, $url, $hash);
		$result = !empty($found);
		if(!$result) header("X-status: unauthorized", true, 404);
		return $result;
	}
	function explForm($in) {
		extract($in);
		if(!$this->verifyGame($url, $hash)) return "";
		$photo = $_FILES["photo"];
		$max = $this->selectOne("SELECT MAX(ordnung) AS ordMax FROM questions%d WHERE url=%s", $this->version, $url);
		$ordnung = $max ? $max["ordMax"] + 1 : 1;
		$uniqid = uniqid("q");
		if(!$name) $name = $uniqid;
		$data = [
			"url" => $url,
			"uniqid" => $uniqid,
			"ordnung" => $ordnung,
			"lat" => $lat,
			"lng" => $lng,
			"radius" => 20,
			"name" => $name,
			"type" => "TEXT"
		];
		$this->insert("questions$this->version", $data);
		$data["id"] = $this->insert_id;
		move_uploaded_file($photo["tmp_name"], "games/$url/$uniqid.jpg");
		return json_encode($data);
	}
	function getQuestions($game) {
		return json_encode($this->select("SELECT * FROM questions%d WHERE url=%s ORDER BY ordnung", $this->version, $game));
	}
  function deleteQuestion($uniqid, $game, $pass) {
		if(!$this->verifyGame($game, $pass)) return "";
    $o = $this->selectOne("SELECT ordnung FROM questions%d WHERE uniqid=%s AND url=%s LIMIT 1", $this->version, $uniqid, $game);
    $this->exec("DELETE FROM questions%d WHERE url=%s AND uniqid=%s LIMIT 1", $this->version, $o["url"], $uniqid);
    $this->exec("UPDATE questions%d SET ordnung=ordnung-1 WHERE url=%s AND ordnung>%d", $this->version, $game, $o["ordnung"]);
  }
  function setQuestionsOrder($order, $game, $pass) {
		if(!$this->verifyGame($game, $pass)) return "";
		$order = explode(";", $order);
		foreach($order as $key=>$val) {
			list($o, $uid) = explode(",", $val);
    	$this->exec("UPDATE questions%d SET ordnung=%d WHERE uniqid=%s LIMIT 1", $this->version, $o, $uid);
		}
  }
	function setQuestion($in) {
		extract($in);
		if(!$this->verifyGame($url, $hash)) return "";
		if(!isset($answer)) $answer = "";
		switch($type) {
			case "TEXT": $answer = $answerText; break;
			case "CHOICE": $answer = $answerChoice; break;
			case "NUMBER": $answer = $answerNumber; break;
			case "QRCODE": $answer = $answerQRcode; break;
			case "QRMAN": $answer = $answerQRman; break;
		}
		$data = [
			"lat" => $lat,
			"lng" => $lng,
			"radius" => $radius,
			"transport" => $transport,
			"name" => $name,
			"question" => $question,
			"type" => $type,
			"answer" => $answer,
			"hint" => $hint,
			"after" => $after
		];
		$where = $this->buildQuery("uniqid=%s", $uniqid);
		if(isset($_FILES["picture"])) {
			$pic = $_FILES["picture"];
			move_uploaded_file($pic["tmp_name"], "games/$url/$uniqid.jpg");
		}
		if($isNew) {
			$data["uniqid"] = $uniqid;
			$data["url"] = $url;
			$this->insert("questions$this->version", $data);
		}
		else $this->update("questions$this->version", $data, $where);
	}
	function offlineMap($url, $hash, $files) {
		if(!$this->verifyGame($url, $hash)) return "";
		if(isset($_FILES["map"])) {
			$map = $_FILES["map"];
			move_uploaded_file($map["tmp_name"], "games/$url/map.jpg");
		}
		if(isset($_FILES["data"])) {
			$data = $_FILES["data"];
			move_uploaded_file($data["tmp_name"], "games/$url/map.dat");
		}
	}
	function offlinePic($url, $hash, $files) {
		if(!$this->verifyGame($url, $hash)) return "";
		if(isset($_FILES["intro"])) {
			$map = $_FILES["intro"];
			move_uploaded_file($map["tmp_name"], "games/$url/intro.jpg");
		}
		if(isset($_FILES["outro1"])) {
			$map = $_FILES["outro1"];
			move_uploaded_file($map["tmp_name"], "games/$url/outro1.jpg");
		}
		if(isset($_FILES["outro2"])) {
			$map = $_FILES["outro2"];
			move_uploaded_file($map["tmp_name"], "games/$url/outro2.jpg");
		}
		if(isset($_FILES["outro3"])) {
			$map = $_FILES["outro3"];
			move_uploaded_file($map["tmp_name"], "games/$url/outro3.jpg");
		}
	}
	function demo($demo, $game) {
		$data = $this->selectOne("SELECT url FROM games%d WHERE url=%s AND demo=%s", $this->version, $game, $demo);
		echo $data["url"] ? 1 : 0;
	}
    function storeAnswers($url, $user, $answers) {
        $data = $this->selectOne("SELECT MAX(attempt) as attempt%d FROM answers4 WHERE login=%s AND gamename=%s",
            $this->version, $login, $url);
        $attempt = $data ? $data["attempt"] : 1;
        foreach($answers as $uniqid=>$points) {
            $data = [
                "url" => $url,
                "uniqid" => $uniqid,
                "user" => $user,
                "attempt" => $attempt,
                "points" => $points
            ];
            $this->insert("answers$this->version", $data);
        }
    }
}

$DB = new Model(4);