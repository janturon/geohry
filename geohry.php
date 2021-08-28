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
	file_put_contents("log/debug.log", var_export($data, true)."\n", FILE_APPEND);
}

include "config.php";

class MySQL extends mysqli {
    function __construct() {
        parent::__construct(MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DB);
    }

    public $key;
    public $debug;

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
        if($this->debug) debuglog($result);
		return $result;
	}

    function runQuery($query) {
        $result = $this->query($query);
        if($this->error) debuglog($this->error);
        return $result;
    }

	function exec($query) {
		$args = func_get_args();
		$query = call_user_func_array(array($this, "buildQuery"), $args);
		return $this->runQuery($query);
	}

    function select($query) {
        $return = array();
        $args = func_get_args();
        $query = call_user_func_array(array($this, "buildQuery"), $args);
        $result = $this->runQuery($query);
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
        $result = $this->runQuery($query);
        $return = $result->fetch_assoc();
        if($return===null) $return = [];
        return $return;
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
    function approveGame($game, $login, $pass) {
        $trusted = $this->selectOne("SELECT trusted FROM logins%d WHERE login=%s AND hash=MD5(%s)", $this->version, $login, $pass);
        if(!$trusted || !$trusted["trusted"]) return "";
        $this->exec("UPDATE games%d SET approved=%s WHERE url=%s", $this->version, $login, $game);
        return "1";
    }
	function gamesInDistrict($district) {
		$demo = "CASE WHEN COALESCE(demo,'')='' THEN 0 ELSE 1 END AS demo";
		return json_encode($this->select("SELECT *,$demo FROM games%d WHERE district=%s", $this->version, $district));
	}
    function approvedGames() {
		$demo = "CASE WHEN COALESCE(demo,'')='' THEN 0 ELSE 1 END AS demo";
		return json_encode($this->select("SELECT *,$demo FROM games%d WHERE approved!=''", $this->version));
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
		$keys = ["lat","lng","radius","name","reason","personal","welcome","start","goodbye1","goodbye2","goodbye3","message","demo"];
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
	function getQuestion($game, $uniqid) {
		return json_encode($this->selectOne("SELECT * FROM questions%d WHERE url=%s AND uniqid=%s", $this->version, $game, $uniqid));
	}
    function delQuestion($uniqid, $game, $pass) {
        if(!$this->verifyGame($game, $pass)) return "";
        $o = $this->selectOne("SELECT ordnung FROM questions%d WHERE uniqid=%s AND url=%s LIMIT 1", $this->version, $uniqid, $game);
        $this->exec("DELETE FROM questions%d WHERE url=%s AND uniqid=%s LIMIT 1", $this->version, $game, $uniqid);
        $this->exec("UPDATE questions%d SET ordnung=ordnung-1 WHERE url=%s AND ordnung>%d", $this->version, $game, $o["ordnung"]);
        if(is_file($file="games/$game/$uniqid.jpg")) unlink($file);
    }
    function setQuestionsOrder($order, $game, $pass) {
        if(!$this->verifyGame($game, $pass)) return "no";
        $order = explode(";", $order);
        foreach($order as $key=>$val) {
        	list($o, $uid) = explode(",", $val);
            $this->exec("UPDATE questions%d SET ordnung=%d WHERE uniqid=%s LIMIT 1", $this->version, $o, $uid);
        }
    }
	function setQuestion($in) {
		extract($in);
		if(!$this->verifyGame($game, $pass)) return "no";
        if(!$uniqid) $uniqid = uniqid();
		if(!isset($answer)) $answer = "";
		if(!isset($name) || !$name || strlen($name) == 0) {
			$name = "nepojmenovaná otázka";
		}
		if(!isset($transport) || !$transport || strlen($transport) == 0) {
			$transport = "Dostaňte se do červeného kruhu na mapě.";
		}
		switch($type) {
			case "TEXT": $answer = $answerText; break;
			case "CHOICE": $answer = $answerChoice; break;
			case "NUMBER": $answer = $answerNumber; break;
			case "QRCODE": $answer = $answerQRcode; break;
			case "QRMAN": 
				$answer = $answerQRman; 
				$this->qrmen($uniqid, $game, $answer);
			break;
			case "QUIZ": 
				$answer = $answerQuiz; 
				mkdir("games/$game/$uniqid"); //quiz folder for images
			break;
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
		if(isset($_FILES["picture"])) {
			$pic = $_FILES["picture"];
			move_uploaded_file($pic["tmp_name"], "games/$game/$uniqid.jpg");
		}
		
		if($isNew) {
			$data["uniqid"] = $uniqid;
			$data["url"] = $game;
            $ord = $this->selectOne("SELECT MAX(ordnung) AS ord FROM questions%d WHERE url=%s", $this->version, $game);
            if(!$ord) $ord = ["ord" => 1];
            $data["ordnung"] = $ord["ord"] + 1;
			$ordnung = $data['ordnung'];
			$this->insert("questions$this->version", $data);
		}
		else {
    		$where = $this->buildQuery("uniqid=%s", $uniqid);
            $this->update("questions$this->version", $data, $where);
        }
	}
	function offlineMap($url, $hash, $files) {
		if(!$this->verifyGame($url, $hash)) return "no";
		if(isset($_FILES["map"])) {
			$map = $_FILES["map"];
			move_uploaded_file($map["tmp_name"], "games/$url/map.jpg");
		}
		if(isset($_FILES["data"])) {
			$data = $_FILES["data"];
			move_uploaded_file($data["tmp_name"], "games/$url/map.dat");
		}
		//$this->commerce($url, $hash, $commercial);
	}
	function delOfflineMap($url, $hash) {
		if(!$this->verifyGame($url, $hash)) return "no";
		if(is_file($f="games/$url/map.jpg")) unlink($f);
		if(is_file($f="games/$url/map.dat")) unlink($f);
		$this->exec("UPDATE games%d SET commercial=%s WHERE url=%s LIMIT 1", $this->version, "", $url);
	}
	function offlinePic($url, $hash, $files) {
		if(!$this->verifyGame($url, $hash)) return "no";
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
        return "done";
	}
	function deletePic($url, $hash) {
		if(!$this->verifyGame($url, $hash)) return "no";
        if(is_file($f="games/$url/intro.jpg")) unlink($f);
        if(is_file($f="games/$url/outro1.jpg")) unlink($f);
        if(is_file($f="games/$url/outro2.jpg")) unlink($f);
        if(is_file($f="games/$url/outro3.jpg")) unlink($f);
        return "done";
    }
	function demo($demo, $game) {
		$data = $this->selectOne("SELECT url FROM games%d WHERE url=%s AND demo=%s", $this->version, $game, $demo);
		echo $data["url"] ? 1 : 0;
	}
    function storeAnswers($url, $user, $answers) {
        $data = $this->selectOne("SELECT MAX(attempt) as attempt FROM answers%d WHERE login=%s AND url=%s",
            $this->version, $user, $url);
        $attempt = $data ? $data["attempt"] : 0;
        $attempt+= 1;
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
    function getAllAnswers($url) {
        $result = [];
        $data = $this->select("SELECT user, uniqid, GROUP_CONCAT(points ORDER BY attempt) AS data FROM answers%d WHERE url=%s GROUP BY user, uniqid", $this->version, $url);
        foreach($data as $item) {
            $user = $item["user"];
            if(!isset($result[$user])) $result[$user] = [];
            $result[$user][$item["uniqid"]] = explode(",", $item["data"]);
        }
        return json_encode($result);
    }

	//dirs
	function getDirGames($dirId) {
		$data = $this->select("SELECT G.* FROM dirGames%d G JOIN dirNames%d N ON N.id = G.dirId WHERE G.dirId = %s", $this->version, $this->version, $dirId);
		return json_encode($data);
	}
	function getGameDirs($gameUrl) {
		$data = $this->select("SELECT N.* FROM dirNames%d N JOIN dirGames%d G ON N.id = G.dirId WHERE G.gameUrl = %s", $this->version, $this->version, $gameUrl);
		return json_encode($data);
	}
	function gamesInDir() {
		$data = $this->select("SELECT G.* FROM games%d G LEFT JOIN dirGames%d D ON D.gameUrl = G.url WHERE D.dirId IS NOT NULL", $this->version, $this->version);
		return json_encode($data);
	}
	function gamesNotInDir() {
		$data = $this->select("SELECT G.* FROM games%d G LEFT JOIN dirGames%d D ON D.gameUrl = G.url WHERE D.dirId IS NULL GROUP BY G.url", $this->version, $this->version);
		return json_encode($data);
	}
	function getGameDetails($gameUrl) {
		$data = $this->select("SELECT * FROM games%d WHERE url = %s", $this->version, $gameUrl);
		return json_encode($data);
	}

	//quizes
	function getQuizQuestions($quizId) {
		$data = $this->select("SELECT * FROM quiz%d WHERE quizUniqid = %s", $this->version, $quizId);
		return json_encode($data);
	}
	function setQuizQuestion($in/*, $quizUniqid, $qName, $qText, $qType, $qAnswer, $qHint*/) {
		extract($in);
		if(!$uniqid) $uniqid = uniqid();
		if(!isset($answer)) $answer = "";
		if(!isset($name) || !$name || strlen($name) == 0) {
			$name = "nepojmenovaná otázka";
		}
		switch($type) {
			case "TEXT": $answer = $answerText; break;
			case "CHOICE": $answer = $answerChoice; break;
			case "NUMBER": $answer = $answerNumber; break;
			case "QRCODE": $answer = $answerQRcode; break;
			case "QRMAN": 
				$answer = $answerQRman; 
				$this->qrmen($uniqid, $game, $answer);
			break;
		}
		$data = [
			"name" => $name,
			"question" => $question,
			"type" => $type,
			"answer" => $answer,
			"hint" => $hint
		];
		if(isset($_FILES["picture"])) {
			$pic = $_FILES["picture"];
			move_uploaded_file($pic["tmp_name"], "games/$game/$quizUniqid/$uniqid.jpg");
		}
		if($isNew) {
			$data["id"] = $id;
			$data["quizUniqid"] = $quizUniqid;
			$data["uniqid"] = $uniqid;
            $ord = $this->selectOne("SELECT MAX(ordnung) AS ord FROM quiz%d WHERE quizUniqid=%s", $this->version, $quizUniqid);
            if(!$ord) $ord = ["ord" => 1];
            $data["ordnung"] = $ord["ord"] + 1;
			$this->insert("quiz$this->version", $data);
		}
		else {
    		$where = $this->buildQuery("uniqid=%s", $uniqid);
            $this->update("quiz$this->version", $data, $where);
        }
	}
	function setQuizQuestionsOrder($order) {
		$order = explode(";", $order);
        foreach($order as $key=>$val) {
        	list($o, $uid) = explode(",", $val);
            $this->exec("UPDATE quiz%d SET ordnung=%d WHERE uniqid=%s LIMIT 1", $this->version, $o, $uid);
        }
	}
	function delQuizQuestion($uniqid, $quizUniqid, $game) {
		$o = $this->selectOne("SELECT ordnung FROM quiz%d WHERE uniqid=%s AND quizUniqid=%s LIMIT 1", $this->version, $uniqid, $quizUniqid);
        $this->exec("DELETE FROM quiz%d WHERE quizUniqid=%s AND uniqid=%s LIMIT 1", $this->version, $quizUniqid, $uniqid);
        $this->exec("UPDATE quiz%d SET ordnung=ordnung-1 WHERE quizUniqid=%s AND ordnung>%d", $this->version, $quizUniqid, $o["ordnung"]);
        if(is_file($file="games/$game/$uniqid.jpg")) unlink($file);
	}
	function delQuiz($quizUniqid, $game) {
		$allQuestions = $this->select("SELECT FROM quiz%d WHERE quizUniqid=%s", $this->version, $quizUniqid);
		foreach($allQuestions as $question) {
			$uid = $question['uniqid'];
			if(is_file($file="games/$game/$quizUniqid/$uid.jpg")) unlink($file);
		}
		$this->exec("DELETE FROM quiz%d WHERE quizUniqid=%s", $this->version, $quizUniqid);
	}

	function commerce($url, $hash, $commercial) {
		if(!$this->verifyGame($url, $hash)) return "no";
		$this->exec("UPDATE games%d SET commercial=%s WHERE url=%s LIMIT 1", $this->version, $commercial, $url);
	}

	function qrmen($uniqid, $game, $logins) {
		$logins = preg_replace('/\s+/', "", $logins);
		if(strlen($logins) == 0) {
			$this->exec("DELETE FROM qrmen%d WHERE uniqid=%s AND gameUrl=%s", $this->version, $uniqid, $game);
			return;
		}
		$loginsArr = explode(";", $logins);
		$existsLogins = $this->select("SELECT login FROM qrmen%d WHERE uniqid=%s AND gameUrl=%s", $this->version, $uniqid, $game);
		foreach($existsLogins as $existsLogin) {
			$existsLogin = $existsLogin["login"];
			if(in_array($existsLogin, $loginsArr)) { //do nothing with no updates logins
				if (($key = array_search($existsLogin, $loginsArr)) !== false) {
					unset($loginsArr[$key]);
				}
			} else {
				//delete from logins
				$this->exec("DELETE FROM qrmen%d WHERE login=%s", $this->version, $existsLogin);
			}
		}
		//add new logins
		foreach($loginsArr as $newLoginQrmen) {
			if(strlen($newLoginQrmen) > 0) {
				$this->insert("qrmen$this->version", [
					"uniqid" => $uniqid,
					"login" => $newLoginQrmen,
					"gameUrl" => $game
				]);
			}
		}
	}

	function getQrmanQuestions($login) {
		$questionsLoginQrMen = $this->select("SELECT * FROM qrmen%d WHERE login=%s", $this->version, $login);
		return json_encode($questionsLoginQrMen);
	}

	function lastUpdate() {
		$stat = stat('pages');
		$mtime = $stat['mtime'];
		return $mtime;
	}
	
	function getGameByUrlOnly($url) {
		$game = $this->selectOne("SELECT * FROM games%d WHERE url=%s", $this->version, $url);
		return json_encode($game);
	}
}

$DB = new Model(4);