<?php
require "config.php";
if(isset($_SERVER['HTTP_HOST']) AND preg_match('/'.$hostname.'$/i',$_SERVER['HTTP_HOST'])) {
	mysql_connect($db_server,$db_username,$db_password) or die("Couldn't connect to online database: ".mysql_error());
} else {
	mysql_connect("127.0.0.1","root","root") or die("Couldn't connect to local database: ".mysql_error());
}
mysql_select_db($db_database);
mysql_set_charset('utf8');
date_default_timezone_set("Europe/Berlin");

/**
 * Holt aktuelle Daten zu einer Karten-ID und speichert sie in der Datenbank.
 * Gibt die aktualisierte Karte als Objekt zurück.
 *
 * @param int $id
 * @param str $source
 * @return stdClass
 */
function updateCardById($id, $source = "mkm") {
	switch($source){
		case "us": return updateCardByIdFromUS($id);
		case "mkm":
		default: return updateCardByIdFromMKM($id);
	}
}

/**
 * Holt den US spezifischen Preis einer Karte
 *
 * @param int $id
 * @return stdClass
 */
function updateCardByIDFromUS($id) {
	$result = mysql_query("SELECT c.*, e.edition, e.us_name, e.isregular FROM cards c LEFT JOIN editions e ON e.id = c.edition WHERE c.id = '".$id."' LIMIT 1") or die(mysql_error());
	$card = (object) mysql_fetch_assoc($result);
	mysql_free_result($result);
	$card->error = "";
	if(!isset($card->id)) {
		$card->error = "id $id not found";
		return $card;
	}
	if($card->isregular AND !in_array($card->rarity,array("t","l"))) {
		$edition = str_replace(" ","_",$card->us_name=="" ? $card->edition : $card->us_name);
		// namen für MTGPrice transformieren
		$name = str_replace(
			array(" ","â","ú","û","á","í","ö"), // keine Umlaute, keine Leerzeichen
			array("_","a","u","u","a","i","o"),
			trim(preg_replace("~Version ?|[:/\(\)]~i","",$card->name))); // keine Klammern oder anderen Sonderzeichen
		$url = "http://www.mtgprice.com/CardPrice?s=".urlencode($edition)."&n=".urlencode($name);
		$card->rate = trim(@file_get_contents($url));
		if($card->rate === "0.00") {
			$card->error = "failure to load prices for ".$card->name." from $url";
			$card->rate = 0;
			$card->rate_foil = 0;
		} else{
			if($card->available_foil > 0) {
				$page = @file_get_contents("http://www.mtgprice.com/sets/".$edition."_(Foil)/$name");
				if(preg_match('~Fair Trade Price: \$([0-9.]+)~is',$page,$matches)) {
					$card->rate_foil = $matches[1];
				} else {
					$card->rate_foil = 0;
				}
			}
			$sql = "UPDATE cards SET ".
				"rate_us = '".$card->rate."', ".
				"rate_foil_us = '".$card->rate_foil."', ".
				"timestamp_us = NOW() ".
				"WHERE id = '".$id."'";
			mysql_query($sql);
		}
	} else {
		$card->rate = 0;
		$card->rate_foil = 0;
		$card->error = "unsupported card (".$card->name.")";
	}
	$card->minprice = 0;
	$card->minprice_foil = 0;
	return $card;
}


/**
 * Läd den MKM spezifischen Preis einer Karte
 *
 * @param int $id
 * @return stdClass
 */
function updateCardByIdFromMKM($id) {
	$id = intval($id);
	$card = new stdClass();
	$card->error = "";
	$card->id = $id;
	$opts = array(
	  'http'=>array(
	    'method'=>"GET",
	    'header'=>"Accept-language: en,de\r\n" .
	              "User-agent: Magic Trade Assist (steffen at mnt dot me)\r\n"
	  )
	);
	$context = stream_context_create($opts);
	$page = file_get_contents("http://www.magickartenmarkt.de/_.c1p".$id.".prod",false,$context);
	if(strlen($page) == 0) {
		sleep(rand(5,10));
		$page = file_get_contents("http://www.magickartenmarkt.de/_.c1p".$id.".prod",false,$context);
	}
	
	if(preg_match('!<h1 class="nameHeader">(?:<span.*?</span>)?(?:&nbsp;)*(.*?) \(([^()]*?)\)(?:<br>(?:<span.*?</span>)?(?:&nbsp;)*(.*?) \(([^()]*?)\))?</h1>!is',$page,$matches)) {
		if(count($matches)>4) {
			$card->name_de = str_replace(array("Æ"),array("Ae"),trim($matches[1]));
			$card->name = str_replace(array("Æ"),array("Ae"),trim($matches[3]));
			$card->edition = trim($matches[4]);
		} else {
			$card->name_de = str_replace(array("Æ"),array("Ae"),trim($matches[1]));
			$card->name = $card->name_de;
			$card->edition = trim($matches[2]);
		}
		$card->img_url = "";
		$card->available = 0;
		$card->minprice = 0;
		$card->minprice_foil = 0;
		$card->rate = 0;
		$card->available_foil = 0;
		$card->rate_foil = 0;
		$card->rarity = strtolower(substr($page,strpos($page,"cardrarityicons/1/")+18,1));
		if(!empty($card->name)) {
			if(preg_match('!/img/(?:[a-z0-9]+/)?cards/([^"]+)"!i',$page,$matches)) {
				$card->img_url = $matches[1];
			}
			if(preg_match('!<table class="availTable">(.*?)</table>!is',$page,$matches)) {
				$xml = simplexml_load_string($matches[1]);
//				print_r($xml);
				foreach($xml->tr as $row) {
					switch(mb_strtolower($row->td[0],"UTF-8")) {
						case "verfügbare artikel:":$card->available = intval($row->td[1]);break;
						case "verfügbar ab (ex+):":$card->minprice = floatval(str_replace(",",".",$row->td[1]));break;
						case "durchschnittspreis (ex+):":$card->rate = floatval(str_replace(",",".",$row->td[1]));break;
						case "verfügbare foils:":$card->available_foil = intval($row->td[1]);break;
						case "foils verfügbar ab:":$card->rate_foil = floatval(str_replace(",",".",$row->td[1]));break;
					}
				}
				//Offers parsen
                $offers = array();
                if(preg_match_all('~(<tr\s+class="(?:odd|even) thick hoverator">.*?</tr>)~is',$page,$matches)) {
                    foreach($matches[0] as $match) {
                        //preprocessing
    			        $match = preg_replace("~\"showMsgBox\('(.*?)'\)\"~is",'""',$match);
    			        $match = preg_replace("~&#?[a-z0-9]{2,6};~is",'',$match);
        				$match = preg_replace("~</em>~is","</div>",$match);
        				$match = preg_replace("~<img([^>]+)>~is","<img$1/>",$match);

    				    $xml = @simplexml_load_string($match);

	                    if($xml) {
    				        //xml parsing
        				    $isAltered = count($xml->xpath("//img[@alt='altered']")) > 0 ? true:false;
        				    $isFoil = count($xml->xpath("//img[@alt='foil']")) > 0 ? true:false;
        				    $isPlayset = count($xml->xpath("//img[@alt='playset']")) > 0 ? true:false;
        				    $price = floatval(str_replace(",",".",strval(reset($xml->xpath("//td[6]")))));
        				    $count = intval(reset($xml->xpath("//td[7]")));
        				    $condition = strval(reset($xml->xpath("//td[3]//img//attribute::alt")));
        				    $country = preg_replace('/^.*?background-position: ?-?(\d+)px.*?$/i',"$1",strval(reset($xml->xpath("//td[1]/span/span[2]//attribute::style"))));
					        $sellerRating = strval(reset($xml->xpath("//td[1]/span/span[3]//attribute::alt")));
					        $language = preg_replace('/^.*?background-position: ?-?(\d+)px.*?$/i',"$1",strval(reset($xml->xpath("//td[2]//span//attribute::style"))));
        				    if($isPlayset) {
        				        $count = $count * 4;
        				        $price = $price / 4;
        				    }
        				    $offers[] = array(
        				        "isAltered" => $isAltered,
        				        "isFoil"    => $isFoil,
        				        "isPlayset" => $isPlayset,
        				        "price"     => $price,
        				        "count"     => $count,
        				        "condition" => $condition,
        				        "country"   => $country,
        				        "sellerRating" => $sellerRating,
        				        "language" => $language
        				    );
    				    } else {
    				        $offers = array();
    				        break;
    				    }
    				}
    			}

                //Normalwert und Mindestpreis berechnen
				if($card->available AND count($offers)>0) {
				    $normalValues = array();
					$normalCounts = array();
					$minprice = 0;
					
					foreach($offers as $index=>$offer) {
					    if($offer["isFoil"] OR $offer["isAltered"]) continue; // keine altered und foil Karten
						if(!in_array($offer["condition"],array("EX","NM","MT"))) continue; // nur gute Zustände
					    if(count($normalCounts) > 1 AND $offer["price"] > 5*array_sum($normalValues)/array_sum($normalCounts) AND $offer["price"] > 5) continue; // keine die >5x des Durchschnitts kosten
						$normalCounts[] = $offer["count"];
						$normalValues[] = $offer["count"]*$offer["price"];
						//minpreis
						if($minprice == 0) {
							if($offer["country"] != 112) continue; // nur DE Verkäufer
							if(!in_array($offer["sellerRating"],array("SS-1","SS-2","SS-3"))) continue; // nur gute, sehr gute und herausragende Verkäufer
							if(!in_array($offer["language"],array(16,48))) continue; // nur deutsche und englische Karten
							if($offer["condition"] == "EX" && $index <= count($offers)*0.1) continue; // in den ersten 10% der Angebote nur NM / MT Karten berücksichtigen
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
				}

				//Foilwert und Foil-Mindespreis berechnen
				if($card->available_foil AND count($offers)>0) {
				    $foilCounts = array();
					$foilValues = array();
					$minprice = 0;

					foreach($offers as $offer) {
					    if(!$offer["isFoil"] OR $offer["isAltered"]) continue; // keine altered und nicht-foil Karten
					    if(!in_array($offer["condition"],array("EX","NM","MT"))) continue; // nur gute zustände
					    if(count($foilCounts) > 1 AND $offer["price"] > 5*array_sum($foilValues)/array_sum($foilCounts) AND $offer["price"] > 5) continue; // keine die >5x des Durchschnitts kosten
						$foilCounts[] = $offer["count"];
						$foilValues[] = $offer["count"]*$offer["price"];
						//minpreis
						if($minprice == 0) {
							if(!in_array($offer["sellerRating"],array("SS-1","SS-2","SS-3"))) continue; // nur gute, sehr gute und herausragende Verkäufer
							if(!in_array($offer["language"],array(16,48))) continue; // nur deutsche und englische Karten
							$minprice = $offer["price"];
						}
					}
					
					foreach($foilValues as $index=>$value) {
						if(($value/$foilCounts[$index]) > 3*array_sum($foilValues)/array_sum($foilCounts)) {
							$foilValues[$index] = 0;
							$foilCounts[$index] = 0;
						}
					}
					if(($card->rarity == "s" AND $card->available < $card->available_foil)
					OR ($card->rarity == "r" AND $card->available*2 < $card->available_foil)
					OR ($card->rarity == "m" AND $card->available*2 < $card->available_foil)) {
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

				$sql = "UPDATE cards SET ".
//                  "name='".mysql_real_escape_string($card->name)."', ".
                  	"name_de='".mysql_real_escape_string($card->name_de)."', ".
					"available='".$card->available."', ".
					"available_foil='".$card->available_foil."', ".
					"rate='".$card->rate."', ".
					"rate_foil='".$card->rate_foil."', ".
					"minprice='".$card->minprice."', ".
					"minprice_foil='".$card->minprice_foil."', ".
					"img_url='".mysql_real_escape_string($card->img_url)."', ".
					"rarity='".mysql_real_escape_string($card->rarity)."', ".
					"timestamp_mkm=NOW() ".
					"WHERE id = '".$id."'";
				mysql_query($sql);
				if(mysql_affected_rows() == 0 AND !empty($card->edition)) {
					$sql = "SELECT id FROM editions WHERE edition='".mysql_real_escape_string($card->edition)."' OR mkm_name='".mysql_real_escape_string($card->edition)."' LIMIT 1";
					$result = mysql_query($sql);
					$row = mysql_fetch_assoc($result);
					mysql_free_result($result);
					if(isset($row['id'])) {
						$sql = "INSERT INTO cards SET ".
							"id=".$id.", ".
							"name='".mysql_real_escape_string($card->name)."', ".
							"name_de='".mysql_real_escape_string($card->name_de)."', ".
							"img_url='".mysql_real_escape_string($card->img_url)."', ".
							"edition=".$row['id'].", ".
							"rarity='".mysql_real_escape_string($card->rarity)."', ".
							"available='".$card->available."', ".
							"available_foil='".$card->available_foil."', ".
							"rate='".$card->rate."', ".
							"rate_foil='".$card->rate_foil."', ".
							"minprice='".$card->minprice."', ".
							"minprice_foil='".$card->minprice_foil."'"
						;
						mysql_query($sql) or die(mysql_error()."\n".$sql."\n");
					} else {
						$card->error = $id." unrecognized edition ".$card->edition." (".$card->name.")";
					}
				}
			} else {
				$card->error = "no carddata";
			}
		} else {
			$card->error = "invalid id ".$id;
		}
	} else {
		$card->error = "error loading page for id ".$id;
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

function getOffersById($id) {
	$languages = array("",16,32,48,64,80,96,112,128,144,160,176);
	$gradings = array("","PO","PL","LP","GD","EX","NM","MT");
	$ratings = array("E-NULL","SS-5","SS-4","SS-3","SS-2","SS-1");
	$offers = array();
	$id = intval($id);
	$opts = array(
	  'http'=>array(
	    'method'=>"GET",
	    'header'=>"Accept-language: en,de\r\n" .
	              "User-agent: Magic Trade Assist (steffen at mnt dot me)\r\n"
	  )
	);
	$context = stream_context_create($opts);
	$page = file_get_contents("http://www.magickartenmarkt.de/_.c1p".$id.".prod",false,$context);
	$totals = array();
	if(preg_match_all('~(<tr\s+class="(?:odd|even) thick hoverator">.*?</tr>)~is',$page,$matches)) {
		foreach($matches[0] as $match) {
			//preprocessing
			$match = preg_replace("~\"showMsgBox\('Artikelstandort: (.*?)'\)\"~uis",'"$1"',$match);
			$match = preg_replace("~\"showMsgBox\('(.*?)'\)\"~is",'""',$match);
			$match = preg_replace("~&#?[a-z0-9]{2,6};~is",'',$match);
			$match = preg_replace("~</em>~is","</div>",$match);
			$match = preg_replace("~<img([^>]+)>~is","<img$1/>",$match);

			$xml = @simplexml_load_string($match);

			if($xml) {
				//xml parsing
				$isAltered = count($xml->xpath("//img[@alt='altered']")) > 0 ? 1:0;
				$isFoil = count($xml->xpath("//img[@alt='foil']")) > 0 ? 1:0;
				$isPlayset = count($xml->xpath("//img[@alt='playset']")) > 0 ? 1:0;
				$price = floatval(str_replace(",",".",strval(reset($xml->xpath("//td[6]")))));
				$count = intval(reset($xml->xpath("//td[7]")));
				$condition = array_search(strval(reset($xml->xpath("//td[3]//img//attribute::alt"))),$gradings);
				$country = strval(reset($xml->xpath("//td[1]/span/span[2]//attribute::onmouseover")));
				$seller = strval(reset($xml->xpath("//td[1]/span/span[1]/a")));
				$rating = substr(strval(reset($xml->xpath("//td[1]/span/span[1]"))),2,-1);
				$level = array_search(strval(reset($xml->xpath("//td[1]/span/span[3]//attribute::alt"))),$ratings);
				$language = array_search(preg_replace('/^.*?background-position: ?-?(\d+)px.*?$/i',"$1",strval(reset($xml->xpath("//td[2]//span//attribute::style")))),$languages);
				$speed = count($xml->xpath("//td[1]/span//img[@alt='fast']"));
				$speed = count($xml->xpath("//td[1]/span//img[@alt='vfast']")) ? 2:$speed;
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
					"language" => $language
				);
				if(isset($totals[$seller][$isFoil])) {
					$totals[$seller][$isFoil] += $count;
				} else {
					$totals[$seller][$isFoil] = $count;
				}
			} else {
				$offers = array();
				break;
			}
		}
		//totals setzen
		foreach($offers as $index=>$offer) {
			$offers[$index]['total'] = $totals[$offer['seller']][$offer['foil']];
		}
	}
	return $offers;
}
