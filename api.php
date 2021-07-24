<?
ini_set( "display_errors", "off" );
ini_set( "error_log", "log/error.log");
ini_set( "log_errors", "1");
include "geohry.php";

switch(GET("req")):

case "ping":
    echo "OK";
break;

case "fs": fGET("tgt");
	echo $DB->fsdata($tgt);
break;

case "registerUser": fPOST("login", "pass");
	echo $DB->registerUser($login, $pass);
break;

case "registerGame": fPOST("game", "pass");
	echo $DB->registerGame($game, $pass);
break;

case "loginUser": fPOST("login", "pass");
	echo $DB->loginUser($login, $pass);
break;

case "loginGame": fPOST("game", "pass");
	echo $DB->loginGame($game, $pass);
break;

case "approveGame": fPOST("game", "login", "pass");
    echo $DB->approveGame($game, $login, $pass);
break;

case "gamesInDistrict": fGET("district");
	echo $DB->gamesInDistrict($district);
break;

case "approvedGames":
	echo $DB->approvedGames();
break;

case "getGame": fPOST("game", "pass");
	echo $DB->getGame($game, $pass);
break;

case "getDemoGame": fPOST("game", "demo");
	echo $DB->getDemoGame($game, $demo);
break;

case "setGame":
	echo $DB->setGame($_POST);
break;

case "explForm":
	echo $DB->explForm($_POST);
break;

case "getQuestions": fPOST("game");
	echo $DB->getQuestions($game);
break;

case "getQuestion": fPOST("game", "uniqid");
	echo $DB->getQuestion($game, $uniqid);
break;

case "setQuestionsOrder": fPOST("ordnung", "game", "pass");
	echo $DB->setQuestionsOrder($ordnung, $game, $pass);
break;

case "setQuestion":
	echo $DB->setQuestion($_POST);
break;

case "delQuestion": fPOST("uniqid", "game", "pass");
    echo $DB->delQuestion($uniqid, $game, $pass);
break;

case "offlineMap": fPOST("url", "hash");
	echo $DB->offlineMap($url, $hash, $_FILES);
break;

case "offlinePic": fPOST("url", "hash");
	echo $DB->offlinePic($url, $hash, $_FILES);
break;

case "deletePic": fPOST("url", "hash");
	echo $DB->deletePic($url, $hash);
break;

case "demo": fGET("demo", "game");
	echo $DB->demo($demo, $game);
break;

case "storeAnswers": fPOST("url", "user", "answers");
    $answers = json_decode($answers, true);
    $DB->storeAnswers($url, $user, $answers);
break;

case "getAllAnswers": fGET("url");
    echo $DB->getAllAnswers($url);
break;

case "getAllAnswers": fGET("url");
    echo $DB->getAllAnswers($url);
break;

case "getDirGames": fPOST("dirId");
	echo $DB->getDirGames($dirId);
break;

case "getGameDirs": fPOST("gameUrl");
	echo $DB->getGameDirs($gameUrl);
break;

case "gamesInDir":
	echo $DB->gamesInDir();
break;

case "gamesNotInDir": 
	echo $DB->gamesNotInDir();
break;

case "getGameDetails": fPOST("gameUrl");
	echo $DB->getGameDetails($gameUrl);	
break;

case "getQuizQuestions": fPOST("quizUniqid");
	echo $DB->getQuizQuestions($quizUniqid);
break;

case "setQuizQuestion": 
	$DB->setQuizQuestion($_POST);
break;

case "setQuizQuestionsOrder": fPOST("ordnung");
	$DB->setQuizQuestionsOrder($ordnung);
break;

case "delQuizQuestion": fPOST("uniqid", "quizUniqid", "game");
	$DB->delQuizQuestion($uniqid, $quizUniqid, $game);
break;

case "delQuiz": fPOST("uniqid", "game");
	$DB->delQuiz($uniqid, $game);
break;

endswitch;