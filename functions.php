<?php
require "config.php";
mysql_connect(DB_SERVER,DB_USERNAME,DB_PASSWORD) or die("Couldn't connect to online database: ".mysql_error());
mysql_select_db(DB_DATABASE);
mysql_set_charset('utf8');
date_default_timezone_set("Europe/Berlin");

/**
 * Holt aktuelle Daten zu einer Karten-ID und speichert sie in der Datenbank.
 * Gibt die aktualisierte Karte als Objekt zurück.
 *
 * @param $id integer
 * @param $source string
 * @return stdClass
 */
function updateCardById($id, $source = "mkm") {
	switch($source){
		case "us": return updateCardByIDFromUS($id);
		case "mkm":
		default: return updatePricesByIdFromMKM($id);
	}
}

/**
 * Holt den US spezifischen Preis einer Karte
 *
 * @param int $id
 * @return stdClass
 */
function updateCardByIDFromUS($id) {
	$result = mysql_query("SELECT c.*, e.edition, e.us_name AS edition_us, e.isregular FROM cards c LEFT JOIN editions e ON e.id = c.edition WHERE c.id = '".$id."' LIMIT 1") or die(mysql_error());
	$card = (object) mysql_fetch_assoc($result);
	mysql_free_result($result);
	$card->error = "";
	if(!isset($card->id)) {
		$card->error = "id $id not found";
		return $card;
	}
	if($card->isregular AND !in_array($card->rarity,array("t"))) {
    // use the US edition name if it's set
    $edition = ($card->edition_us=="" ? $card->edition : $card->edition_us);
    $name = ($card->name_us=="" ? $card->name : $card->name_us);
    // namen säubern
    $name = str_replace(
      array("û",'"'), // keine Umlaute, keine Anführungszeichen
      array("u",''),
      trim(preg_replace('~\(Version (\d+)\)~','[Version $1]',$name))); // Versionen in eckigen Klammern
    // sonderfälle
    $name = str_replace(
      array(") [Version 1]",") [Version 2]"),
      array(" Left)"," Right)"),
      $name
    );
    $url = USAPI . "&s=".urlencode($edition)."&p=".urlencode($name);
    $xml = trim(@file_get_contents($url));
    if(!$xml || $xml == "Product not found.") $card->error = "Error loading price for ".$card->name." from ".$edition;
    else {
      $xml = simplexml_load_string($xml);
      $card->rate_us = floatval($xml->product->avgprice);
      $card->minprice_us = floatval($xml->product->lowprice);
      $card->rate_foil_us = floatval($xml->product->foilavgprice);
      $card->timestamp_us = date("Y-m-d H:i:s");
      // insert all the new prices into the DB
      $sql = "UPDATE cards SET ".
        "rate_us = '".$card->rate_us."', ".
        "minprice_us = '".$card->minprice_us."', ".
        "rate_foil_us = '".$card->rate_foil_us."', ".
        "timestamp_us = NOW() ".
        "WHERE id = '".$card->id."'";
      mysql_query($sql);
    }
	} else {
		$card->error = "The card ".$card->name." from ".$card->edition." is not supported in this region.";
	}
	return $card;
}

/**
 * Läd den MKM spezifischen Preis einer Karte.
 *
 * @param int $id
 * @return stdClass
 */
function updatePricesByIdFromMKM($id) {
	$id = intval($id);
	$card = new stdClass();
	$card->error = "";
	$card->id = $id;
  $card->available = 0;
  $card->minprice = 0;
  $card->minprice_foil = 0;
  $card->rate = 0;
  $card->available_foil = 0;
  $card->rate_foil = 0;

  //Offers parsen
  $offers = getOffersByIdFromMKM($id);

  //Normalwert und Mindestpreis berechnen
  if(count($offers)>0) {
    $normalValues = array();
    $normalCounts = array();
    $minprice = 0;

    foreach($offers as $index=>$offer) {
      if($offer["foil"] OR $offer["altered"]) continue; // keine altered und foil Karten
      if(!in_array($offer["grading"],array(5,6,7))) continue; // nur gute Zustände
      if(count($normalCounts) > 1 AND $offer["price"] > 5*array_sum($normalValues)/array_sum($normalCounts) AND $offer["price"] > 5) continue; // keine die >5x des Durchschnitts kosten
      $normalCounts[] = $offer["amount"];
      $normalValues[] = $offer["amount"]*$offer["price"];
      //minpreis
      if($minprice == 0) {
        //if($offer["country"] != "Deutschland") continue; // nur DE Verkäufer
        if($offer["warning"]>0) continue; // keine Verkäufer mit Warnings
        if($offer["level"]>2) continue; // nur gute, sehr gute und herausragende Verkäufer
        if(!in_array($offer["language"],array(1,3))) continue; // nur deutsche und englische Karten
        if($offer["grading"] == 5 && $index <= count($offers)*0.1) continue; // in den ersten 10% der Angebote nur NM / MT Karten berücksichtigen
        $minprice = $offer["price"];
      }
    }

    if(count($normalValues) AND count($normalCounts)) {
      $card->rate = round(array_sum($normalValues)/array_sum($normalCounts),2);
      $card->available = array_sum($normalCounts);
      if($minprice == 0 OR $minprice > $card->rate) $minprice = $card->rate;
      $card->minprice = $minprice;
    } else {
      $card->available = 0;
    }

    //Foilwert und Foil-Mindespreis berechnen
    $foilCounts = array();
    $foilValues = array();
    $minprice = 0;

    foreach($offers as $offer) {
      if(!$offer["foil"] OR $offer["altered"]) continue; // keine altered und nicht-foil Karten
      if(!in_array($offer["grading"],array(5,6,7))) continue; // nur gute zustände
      if(count($foilCounts) > 1 AND $offer["price"] > 5*array_sum($foilValues)/array_sum($foilCounts) AND $offer["price"] > 5) continue; // keine die >5x des Durchschnitts kosten
      $foilCounts[] = $offer["amount"];
      $foilValues[] = $offer["amount"]*$offer["price"];
      //minpreis
      if($minprice == 0) {
        //if(!in_array($offer["level"],array(3,4,5))) continue; // nur gute, sehr gute und herausragende Verkäufer
        if(!in_array($offer["language"],array(1,3))) continue; // nur deutsche und englische Karten
        $minprice = $offer["price"];
      }
    }

    if(array_sum($foilCounts) > 0) {
      foreach($foilValues as $index=>$value) {
        if(($value/$foilCounts[$index]) > 3*array_sum($foilValues)/array_sum($foilCounts)) {
          $foilValues[$index] = 0;
          $foilCounts[$index] = 0;
        }
      }

      // mehr Foils als non-Foils? Muss eine Foil-Only Karte sein
      if($card->available*2 < array_sum($foilCounts)) {
        $foilCounts[] = $card->available;
        $foilValues[] = $card->available * $card->rate;
        $card->available = 0;
        $card->rate = 0;
        $card->minprice = 0;
      }
      $card->rate_foil = round(array_sum($foilValues)/array_sum($foilCounts),2);
      $card->available_foil = array_sum($foilCounts);
      if($minprice == 0 OR $minprice > $card->rate_foil) $minprice = $card->rate_foil;
      $card->minprice_foil = $minprice;
    }
  }

  $card->timestamp_mkm = date("Y-m-d H:i:s");

  $sql = "UPDATE IGNORE cards SET ".
    "rate='".$card->rate."', ".
    "rate_foil='".$card->rate_foil."', ".
    "minprice='".$card->minprice."', ".
    "minprice_foil='".$card->minprice_foil."', ".
    "timestamp_mkm=NOW() ".
    "WHERE id = '".$id."'";
  mysql_query($sql);
  if(mysql_affected_rows() == 0) {
		$card->error = "error updating prices for card ".$id;
	}
	return $card;
}

/**
 * Läd eine Karte von MKM
 * @param $id integer
 * @returns stdClass
 */
function getCardByIdFromMKM($id) {
  $id = intval($id);
  $card = new stdClass();
  $card->error = "";
  $card->id = $id;
  $xml = queryMKMAPI("product/$id");
  if($xml->error) $card->error = $xml->error;
  else {
    if(isset($xml->product) AND intval($xml->product->category->idCategory) == 1) {
      $card->name = str_replace("Æ","AE",$xml->product->name[0]->productName);
      $card->name_de = str_replace("Æ","AE",$xml->product->name[2]->productName);
      $card->rarity = strtolower(substr($xml->product->rarity,0,1));
      $card->edition = strval($xml->product->expansion);
      $card->img_url = str_replace("./img/cards/","",$xml->product->image);
      // get edition
      $sql = "SELECT id FROM editions WHERE edition='".mysql_real_escape_string($card->edition)."' OR mkm_name='".mysql_real_escape_string($card->edition)."' LIMIT 1";
      $result = mysql_query($sql);
      $row = mysql_fetch_assoc($result);
      mysql_free_result($result);
      if(isset($row['id'])) {
        $sql = "REPLACE INTO cards SET ".
          "id=".$id.", ".
          "name='".mysql_real_escape_string($card->name)."', ".
          "name_de='".mysql_real_escape_string($card->name_de)."', ".
          "img_url='".mysql_real_escape_string($card->img_url)."', ".
          "edition=".$row['id'].", ".
          "timestamp_mkm=0, ".
          "rarity='".mysql_real_escape_string($card->rarity)."'";
        mysql_query($sql) or die(mysql_error()."\n".$sql."\n");
      } else {
        $card->error = "unrecognized edition ".$card->edition." (".$card->name.")";
      }
    } else {
      $card->error = $xml->product->name[0]->productName." (".$xml->product->category->categoryName.") is not a magic card";
    }
  }
  return $card;
}

/**
 * Liefert einen Array von Karten mit allen Printings dieser Karten zurück.
 * Erwartet eine oder mehrere CardIds.
 *
 * @param $cardIds
 * @param $fillPrintings
 * @return mixed
 */
function getCardsByIds($cardIds, $fillPrintings = false) {
	$cards = array();
	if(!is_array($cardIds)) {
		$cardIds = array($cardIds);
	}
	$cardIds = array_map("intval",$cardIds);
	$sql = "SELECT c.id AS id,name,name_de,ed.shortname AS ed,ed.edition,IF(isregular=1,'',img_url) AS img_url,isregular,rarity FROM cards AS c
			LEFT JOIN editions AS ed ON ed.id = c.edition
			WHERE c.id IN ('".implode("','",$cardIds)."')
			ORDER BY FIND_IN_SET(c.id,'".implode(",",$cardIds)."')";
	$result = mysql_query($sql) OR die(mysql_error());
	while($row = mysql_fetch_assoc($result)) {
		if(!isset($cards[$row['name']])) {
			$cards[$row['name']] = new stdClass();
			$cards[$row['name']]->name = $row['name'];
			$cards[$row['name']]->name_de = $row['name_de'];
		}
		$cards[$row['name']]->printings[] = array("ed"=>$row['ed'],"edition"=>$row['edition'],"img"=>$row['img_url'],"rarity"=>$row['rarity'],"id"=>$row['id']);
		if($fillPrintings) {
			$sql = "SELECT c.id AS id,name,name_de,ed.shortname AS ed,ed.edition,IF(isregular=1,'',img_url) AS img_url,isregular,rarity FROM cards AS c
					LEFT JOIN editions AS ed ON ed.id = c.edition
					WHERE name = '".mysql_real_escape_string($row['name'])."'
					AND c.id != '".$row['id']."'
					ORDER BY edition DESC";
			$subresult = mysql_query($sql) OR die(mysql_error());
			while($subrow = mysql_fetch_assoc($subresult)) {
				$cards[$row['name']]->printings[] = array("ed"=>$subrow['ed'],"edition"=>$subrow['edition'],"img"=>$subrow['img_url'],"rarity"=>$subrow['rarity'],"id"=>$subrow['id']);
			}
			mysql_free_result($subresult);
		}
	}
	mysql_free_result($result);
	return $cards;
}

function getOffersByIdFromMKM($id) {
	$gradings = array("","PO","PL","LP","GD","EX","NM","MT");
	$offers = array();
	$id = intval($id);

  $xml = queryMKMAPI("articles/$id");
  if($xml->error) print_r($xml->error);
  else {
    foreach($xml->article as $offer) {
      $isAltered = $offer->isAltered == "true" ? 1:0;
      $isFoil = $offer->isFoil == "true" ? 1:0;
      $isPlayset = $offer->isPlayset == "true" ? 1:0;
      $price = floatval($offer->price);
      $count = intval($offer->count);
      $condition = array_search($offer->condition, $gradings);
      $language = intval($offer->language->idLanguage);
      $country = strval($offer->seller->country);
      $seller = strval($offer->seller->username);
      $level = intval($offer->seller->reputation); # 0 = best, 4+ = worst
      $warning = intval($offer->seller->riskGroup); # 0 = no warning, 1 = new seller, 2 = big warning
      $rating = intval($offer->seller->reputation);
      $speed = intval($offer->seller->shipsFast); # todo replace with real value once available
      if($isPlayset) {
        $count = $count * 4;
        $price = $price / 4;
      }
      $offers[] = array(
        "altered" => $isAltered,
        "foil"    => $isFoil,
        "playset" => $isPlayset,
        "price"     => $price,
        "amount"     => $count,
        "grading" => $condition,
        "country"   => $country,
        "seller"   => $seller,
        "rating" => $rating,
        "speed" => $speed,
        "level" => $level,
        "language" => $language,
        "warning" => $warning
      );
    }
  }
	return $offers;
}

function queryMKMAPI($url) {
  /**
   * Declare and assign all needed variables for the request and the header
   *
   * @var $method string Request method
   * @var $url string Full request URI
   * @var $appToken string App token found at the profile page
   * @var $appSecret string App secret found at the profile page
   * @var $accessToken string Access token found at the profile page (or retrieved from the /access request)
   * @var $accessSecret string Access token secret found at the profile page (or retrieved from the /access request)
   * @var $nonce string Custom made unique string, you can use uniqid() for this
   * @var $timestamp string Actual UNIX time stamp, you can use time() for this
   * @var $signatureMethod string Cryptographic hash function used for signing the base string with the signature, always HMAC-SHA1
   * @var version string OAuth version, currently 1.0
   */
  $method             = "GET";
  $url                = MKMAPI.$url;
  $appToken           = MKMAPPTOKEN;
  $appSecret          = MKMAPPSECRET;
  $accessToken        = MKMACCESSTOKEN;
  $accessSecret       = MKMACCESSSECRET;
  $nonce              = uniqid();
  $timestamp          = time();
  $signatureMethod    = "HMAC-SHA1";
  $version            = "1.0";

  /**
   * Gather all parameters that need to be included in the Authorization header and are know yet
   *
   * @var $params array|string[] Associative array of all needed authorization header parameters
   */
  $params             = array(
    'realm'                     => $url,
    'oauth_consumer_key'        => $appToken,
    'oauth_token'               => $accessToken,
    'oauth_nonce'               => $nonce,
    'oauth_timestamp'           => $timestamp,
    'oauth_signature_method'    => $signatureMethod,
    'oauth_version'             => $version,
  );

  /**
   * Start composing the base string from the method and request URI
   *
   * @var $baseString string Finally the encoded base string for that request, that needs to be signed
   */
  $baseString         = strtoupper($method) . "&";
  $baseString        .= rawurlencode($url) . "&";

  /*
   * Gather, encode, and sort the base string parameters
   */
  $encodedParams      = array();
  foreach ($params as $key => $value)
  {
    if ("realm" != $key)
    {
      $encodedParams[rawurlencode($key)] = rawurlencode($value);
    }
  }
  ksort($encodedParams);

  /*
   * Expand the base string by the encoded parameter=value pairs
   */
  $values             = array();
  foreach ($encodedParams as $key => $value)
  {
    $values[] = $key . "=" . $value;
  }
  $paramsString       = rawurlencode(implode("&", $values));
  $baseString        .= $paramsString;

  /*
   * Create the signingKey
   */
  $signatureKey       = rawurlencode($appSecret) . "&" . rawurlencode($accessSecret);

  /**
   * Create the OAuth signature
   * Attention: Make sure to provide the binary data to the Base64 encoder
   *
   * @var $oAuthSignature string OAuth signature value
   */
  $rawSignature       = hash_hmac("sha1", $baseString, $signatureKey, true);
  $oAuthSignature     = base64_encode($rawSignature);

  /*
   * Include the OAuth signature parameter in the header parameters array
   */
  $params['oauth_signature'] = $oAuthSignature;

  /*
   * Construct the header string
   */
  $header             = "Authorization: OAuth ";
  $headerParams       = array();
  foreach ($params as $key => $value)
  {
    $headerParams[] = $key . "=\"" . $value . "\"";
  }
  $header            .= implode(", ", $headerParams);

  /*
   * Get the cURL handler from the library function
   */
  $curlHandle         = curl_init();

  /*
   * Set the required cURL options to successfully fire a request to MKM's API
   *
   * For more information about cURL options refer to PHP's cURL manual:
   * http://php.net/manual/en/function.curl-setopt.php
   */
  curl_setopt($curlHandle, CURLOPT_RETURNTRANSFER, true);
  curl_setopt($curlHandle, CURLOPT_URL, $url);
  curl_setopt($curlHandle, CURLOPT_HTTPHEADER, array($header));
  curl_setopt($curlHandle, CURLOPT_SSL_VERIFYPEER, false);

  /**
   * Execute the request, retrieve information about the request and response, and close the connection
   *
   * @var $content string Response to the request
   * @var $info array Array with information about the last request on the $curlHandle
   */
  $content            = curl_exec($curlHandle);
  $info               = curl_getinfo($curlHandle);
  curl_close($curlHandle);

  /*
   * Convert the response string into an object
   *
   * If you have chosen XML as response format (which is standard) use simplexml_load_string
   * If you have chosen JSON as response format use json_decode
   *
   * @var $decoded \SimpleXMLElement|\stdClass Converted Object (XML|JSON)
   */
  // $decoded            = json_decode($content);
  $decoded            = simplexml_load_string($content);
  return $decoded;
}