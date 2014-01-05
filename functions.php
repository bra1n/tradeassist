<?php
require "config.php";
if(isset($_SERVER['HTTP_HOST']) AND preg_match('/'.HOSTNAME.'$/i',$_SERVER['HTTP_HOST'])) {
	mysql_connect(DB_SERVER,DB_USERNAME,DB_PASSWORD) or die("Couldn't connect to online database: ".mysql_error());
} else {
	mysql_connect("127.0.0.1","root","root") or die("Couldn't connect to local database: ".mysql_error());
}
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
		case "us": return getCardByIdFromMKM($id);
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
	$result = mysql_query("SELECT c.*, e.id AS edition_id, e.edition, e.us_name, e.isregular FROM cards c LEFT JOIN editions e ON e.id = c.edition WHERE c.id = '".$id."' LIMIT 1") or die(mysql_error());
	$card = (object) mysql_fetch_assoc($result);
	mysql_free_result($result);
	$card->error = "";
	if(!isset($card->id)) {
		$card->error = "id $id not found";
		return $card;
	}
	if($card->isregular AND !in_array($card->rarity,array("t"))) {
		$edition = ($card->us_name=="" ? $card->edition : $card->us_name);
		// namen säubern
		$name = str_replace(
			array("â","ú","û","á","í","ö","é","à",'"'), // keine Umlaute, keine Anführungszeichen
			array("a","u","u","a","i","o","e","a",''),
			trim(preg_replace('~\(Version (\d+)\)~','[Version $1]',$card->name))); // Versionen in eckigen Klammern
		// sonderfälle
		$name = str_replace(
			array(") [Version 1]",") [Version 2]"),
			array(" Left)"," Right)"),
			$name
		);
//		$url = "http://www.mtgprice.com/CardPrice?s=".urlencode($edition)."&n=".urlencode($name);
		$url = "http://magic.tcgplayer.com/db/price_guide.asp?setname=".urlencode($edition);
		$cards = trim(@file_get_contents($url));
        $pattern ='~<table width=600 cellpadding=0 cellspacing=0 border=1 align=left>\s*'.
                  '<TR height=20><td width=200 align=left valign=center><font  class=default_7>'.
                  '(.*?)</font></td></TR>\s*</table>~is';
        if(preg_match($pattern,$cards,$matches) AND trim($matches[1])) {
            // remove ugly spaces
            $matches[1] = str_replace("&nbsp;","",$matches[1]);
            // split columns
            $matches[1] = preg_replace('~</font>(</center>)?</td><td width=\d+ align=(left|right|center) valign=center>(<center>)?<font  ?class=default_7>\$?~is','#col#',$matches[1]);
            // split rows
            $matches[1] = preg_replace('~</font>(</center>)?</td></TR><TR height=20><td width=200 align=left valign=center><font  class=default_7>~is','#row#',$matches[1]);
            $cards = explode("#row#",$matches[1]);
            // default error
            $card->error = "card not found (".$card->name.")";
            foreach($cards as $cardline) {
                $cardline = explode("#col#",$cardline);
                if(strtolower($cardline[0]) == strtolower($card->name)) {
                    // the current card!
                    $card->rate_us = floatval($cardline[6]);
                    $card->minprice_us = floatval($cardline[7]);
                    unset($card->error);
                }
                // insert all the new prices into the DB
                $sql = "UPDATE cards SET ".
                    "rate_us = '".floatval($cardline[6])."', ".
                    "minprice_us = '".floatval($cardline[7])."', ".
                    "timestamp_us = NOW() ".
                    "WHERE edition = '".$card->edition_id."' AND name = '".mysql_real_escape_string($cardline[0])."'";
//                mysql_query($sql);
            }
            print_r($cards);
        } else {
            $card->error = "unsupported edition (".$edition.")";
        }
        print_r($card); exit;
	} else {
		$card->rate = 0;
		$card->minprice = 0;
		$card->error = "unsupported card (".$card->name.")";
	}
	$card->rate_foil = 0;
	$card->minprice_foil = 0;
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

  $card->timestamp = date("Y-m-d H:i:s");

  $sql = "UPDATE IGNORE cards SET ".
    "available='".$card->available."', ".
    "available_foil='".$card->available_foil."', ".
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
  $xml = @file_get_contents(MKMAPI."product/$id");
  if(!$xml) $card->error = "error loading card";
  else {
    $xml = simplexml_load_string($xml);
    if(isset($xml->product) AND intval($xml->product->category->idCategory) == 1) {
      $card->name = str_replace("Æ","AE",$xml->product->name[0]->productName);
      $card->name_de =  str_replace("Æ","AE",$xml->product->name[2]->productName);
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

  $xml = @file_get_contents(MKMAPI."articles/$id");
  if($xml) {
    $xml = simplexml_load_string($xml);
    foreach($xml as $article) $offers[] = $article;
    if(strpos($http_response_header[0],"206 Partial Content") !== false) {
      $total = 0;
      foreach($http_response_header as $headerline) {
        if(preg_match("~Range: \d+-\d+/(\d+)~i",$headerline,$match)) {
          $total = $match[1];
          break;
        }
      }
      for($x = 101;$x <= $total; $x+=100) {
        $xml = @file_get_contents(MKMAPI."articles/$id/$x");
        $xml = simplexml_load_string($xml);
        foreach($xml as $article) $offers[] = $article;
      }
    }
  }
  foreach($offers as $index=>$offer) {
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
    $rating = 0; # todo replace with real value once available
    $speed = 0; # todo replace with real value once available
    if($isPlayset) {
      $count = $count * 4;
      $price = $price / 4;
    }
    $offers[$index] = array(
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
	return $offers;
}
