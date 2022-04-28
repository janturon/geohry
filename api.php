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

case "delOfflineMap": fPOST("url", "hash");
	$DB->delOfflineMap($url, $hash);
break;

case "offlinePic": fPOST("url", "hash");
	echo $DB->offlinePic($url, $hash, $_FILES);
break;

case "deletePic": fPOST("url", "hash");
	echo $DB->deletePic($url, $hash);
break;

case "deleteQuestionPic": fPOST("game", "pass", "picUrl");
	echo $DB->deleteQuestionPic($game, $pass, $picUrl);
break;

case "duplicateQuestion": fPOST("game", "pass", "questionId");
	echo $DB->duplicateQuestion($game, $pass, $questionId);
break;


case "demo": fGET("demo", "game");
	echo $DB->demo($demo, $game);
break;

case "storeAnswers": fPOST("url", "user", "answers");
    $answers = json_decode($answers, true);
    echo $DB->storeAnswers($url, $user, $answers);
break;

case "getAllAnswers": fPOST("url");
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

case "commerce": fPOST("url", "hash", "commercial");
	$DB->commerce($url, $hash, $commercial);
break;

/* //NOT USED - TEST ONLY (can be removed)
case "qrmen": fPOST("uniqid", "logins");
	echo $DB->qrmen($uniqid, $logins);
break;
*/

case "getQrmanQuestions": fPOST("login");
	echo $DB->getQrmanQuestions($login);
break;

case "lastUpdate": 
	echo $DB->lastUpdate();
break;

case "getGameByUrlOnly": fPOST("url");
	echo $DB->getGameByUrlOnly($url);
break;

/* feedback */
case "setFeedback": fPOST("url", "hash", "feedback", "feedbackOn");
	echo $DB->setFeedback($url, $hash, $feedback, $feedbackOn);
break;

case "addFeedback": fPOST("login", "answer", "url", "hash");
    echo $DB->getFeedback($login, $answer, $url, $hash);
break;

case "getFeedback": fPOST("login");
    echo $DB->getFeedback($login);
break;

case "getAllFeedbacks": fPOST("url");
    echo $DB->getAllFeedbacks($url);
break;

case "removeFeedback": fPOST("login");
    echo $DB->removeFeedback($login);
break;

case "removeFeedbacks": fPOST("url");
    echo $DB->removeFeedbacks($url);
break;

endswitch;

/*
$gameUrl = GET("gameUrl");

if(isset($gameUrl) && strlen($gameUrl) != 0) {

}
*/
