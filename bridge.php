<?php
//error_reporting(E_ALL);
include "functions.php";

if(isset($_REQUEST['arg']) AND isset($_REQUEST['action'])) {
  $region = "eu";
  if(isset($_REQUEST['region']) AND $_REQUEST['region'] == "us") $region = "us";
	$arg = stripslashes(mb_strtolower($_REQUEST['arg'],"UTF-8"));
	switch($_REQUEST['action']) {
	/* Suggestions */
		case "suggest":
			$cards = array();
			echo "{";
			if(preg_match("~.+ foil$~i",$arg)) {
				// Foilkarten
				$arg = substr($arg,0,-5);
				$result = mysql_query("SELECT GROUP_CONCAT(id ORDER BY edition DESC) AS ids FROM cards ".
					"WHERE (LOWER(name) LIKE '%".mysql_real_escape_string($arg)."%' ".
					"OR LOWER(name_de) LIKE '%".mysql_real_escape_string($arg)."%') ".
					"AND rate_foil > 0 ".
					"GROUP BY name ".
					"ORDER BY IF(LOWER(name) LIKE '%".mysql_real_escape_string($arg)."%',LENGTH(name),LENGTH(name_de)) ASC,name ASC LIMIT 10");
				echo '"type":"foil",';
			} else {
				// normale Karten
				$result = mysql_query("SELECT GROUP_CONCAT(id ORDER BY edition DESC) AS ids FROM cards ".
					"WHERE LOWER(name) LIKE '%".mysql_real_escape_string($arg)."%' ".
					"OR LOWER(name_de) LIKE '%".mysql_real_escape_string($arg)."%' ".
					"GROUP BY name ".
					"ORDER BY IF(LOWER(name) LIKE '%".mysql_real_escape_string($arg)."%',LENGTH(name),LENGTH(name_de)) ASC,name ASC LIMIT 10");
				echo '"type":"all",';
			}
			$cardIds = array();
			while($row = mysql_fetch_assoc($result)) {
				$cardIds = array_merge($cardIds,explode(",",$row['ids']));
			}
			mysql_free_result($result);
			$cards = getCardsByIds($cardIds);
			echo '"cards":'.json_encode(array_values($cards)).'}';
		break;
	/* Kartenwert */
		case "value":
      $fields = "";
      switch($region){
        case "us":
          $fields = "rate_us AS rate,rate_foil_us AS rate_foil,minprice_us AS minprice,rate_foil_us AS minprice_foil,timestamp_us as timestamp";
          break;
        case "eu":
        default:
          $fields = "rate,rate_foil,minprice,minprice_foil,timestamp_mkm as timestamp";
      }
			$sql = "SELECT $fields FROM cards WHERE id='".intval($arg)."'";
			$result = mysql_query($sql);
			$row = mysql_fetch_array($result,MYSQL_ASSOC);
			mysql_free_result($result);
			if($row) {
				if(time() - strtotime($row['timestamp']) > 3600*24*7) {
					$card = updateCardById(intval($arg),$region);
					if($card->error) {
						echo '{"error":"'.$card->error.'"}';
					} else {
						echo json_encode($card);
					}
				} else {
					echo json_encode($row);
				}
			}
		break;
	/* Karte vorschlagen */
		case 'propose':
			$card = false;
			$arg = round(floatval($arg),2);
			$exclude = array();
			$minprice = false;
			if(isset($_GET['exclude'])) {
				$exclude = array_map("intval",explode(",",$_GET['exclude']));
			}
			if(isset($_GET['minprice'])) {
				$minprice = ($_GET['minprice'] == "true" ? true:false);
			}
      $field = "";
      switch($region) {
        case "us":
          $field = ($minprice ? 'minprice_us':'rate_us');
          break;
        case "eu":
        default:
          $field = ($minprice ? 'minprice':'rate');
      }
			$result = mysql_query("SELECT c.id AS id,name,ed.shortname,ed.edition,rarity FROM cards AS c
				LEFT JOIN editions AS ed ON ed.id = c.edition
				WHERE isregular = 1
				AND c.id NOT IN ('".implode("','",$exclude)."')
				AND ABS(1-$field/'$arg') <= 0.05
				ORDER BY ABS(1-$field/'$arg') ASC,timestamp_mkm DESC LIMIT 1");
			$row = mysql_fetch_assoc($result);
			if($row) {
				$card = new stdClass();
				$card->name = $row['name'];
				$card->printings[] = array("ed"=>$row['shortname'],"edition"=>$row['edition'],"img"=>"","rarity"=>$row['rarity'],"id"=>$row['id']);
			}
			echo json_encode($card);
			mysql_free_result($result);
		break;
	/* Liste exportieren */
		case 'export':
			$lists = json_decode($arg);
			$cardIds = array();
			foreach($lists as $listindex=>$list) {
				if(property_exists($list,'cards')) {
					foreach($list->cards as $card) {
						if(!in_array(intval($card->id),$cardIds)) $cardIds[] = intval($card->id);
					}
				}
			}
			if(count($cardIds)) {
				$sql = "SELECT id FROM cards WHERE id IN (".implode(",",$cardIds).") ORDER BY id ASC";
				$result = mysql_query($sql);
				$validIds = array();
				while($row = mysql_fetch_array($result,MYSQL_ASSOC)) {
					$validIds[] = $row['id'];
				}
				mysql_free_result($result);
				if(count($validIds)) {
					foreach($lists as $listindex=>$list) {
						if(property_exists($list,'cards')) {
							foreach($list->cards as $cardindex=>$card) {
								if(!in_array(intval($card->id),$validIds)) unset($list->cards[$cardindex]);
							}
							sort($list->cards);
						}
					}
					mysql_query("INSERT INTO export (cardlists,md5) VALUES ('".mysql_real_escape_string(json_encode($lists))."','".md5(json_encode($lists))."') ON DUPLICATE KEY UPDATE timestamp = NOW()") or die(mysql_error());
					echo mysql_insert_id();
				}
			}
		break;
	/* Liste importieren */
		case 'import':
			$result = mysql_query("SELECT cardlists FROM export WHERE id = '".intval($arg)."' LIMIT 1");
			$row = mysql_fetch_assoc($result);
			if($row) {
				mysql_query("UPDATE export SET timestamp = NOW() WHERE id = '".intval($arg)."' LIMIT 1");
				$lists = json_decode($row['cardlists']);
				$cardIds = array();
				foreach($lists as $listindex=>$list) {
					if(property_exists($list,'cards')) {
						foreach($list->cards as $card) {
							if(!in_array(intval($card->id),$cardIds)) $cardIds[] = intval($card->id);
						}
					}
				}
				$cards = getCardsByIds($cardIds, true);
				foreach($cards as $card) {
					$cards[$card->printings[0]['id']] = $card;
				}
				foreach($lists as $listindex=>$list) {
					if(property_exists($list,'cards')) {
						foreach($list->cards as $index=>$card) {
							if(isset($cards[$card->id])) {
								$list->cards[$index] = $cards[$card->id];
								$list->cards[$index]->foil = $card->foil;
								$list->cards[$index]->count = $card->count;
							} else {
								unset($list->cards[$index]);
							}
						}
					}
				}
				echo json_encode($lists);
			}
		break;
	/* Kartenangebote listen */
		case 'offers':
			$offers = getOffersByIdFromMKM(intval($arg));
			echo json_encode($offers);
		break;
	}
}