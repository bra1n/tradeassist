<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN"
	"http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en" lang="en" dir="ltr"
	  xmlns:og="http://opengraphprotocol.org/schema/"
	  xmlns:fb="http://www.facebook.com/2008/fbml">
	<head>
		<meta http-equiv="Content-Type" content="text/html;charset=utf-8"/>
    <meta name="viewport" content="width=device-width" />
		<title>Magic Trade Assist</title>
        <link rel="stylesheet" type="text/css" href="/styles/tradeassist.css"/>
        <script src="/scripts/jquery.js" type="text/javascript"></script>
        <script src="/scripts/jquery-ui-1.8.21.custom.min.js" type="text/javascript"></script>
        <script src="/scripts/tradeassist.js" type="text/javascript"></script>
        <script src="/scripts/tradeassist.cardinterface.js" type="text/javascript"></script>
        <script src="/scripts/tradeassist.cardlist.js" type="text/javascript"></script>
        <script src="/scripts/tradeassist.suggestions.js" type="text/javascript"></script>
        <script src="/scripts/tradeassist.valuecounter.js" type="text/javascript"></script>
        <script src="/scripts/tradeassist.card.js" type="text/javascript"></script>
		<link rel="shortcut icon" type="image/x-icon" href="/images/favicon.ico"/>
		<!-- Facebook Meta Data -->
		<meta property="og:image" content="http://tradeassi.st/images/favicon.png"/>
		<meta property="og:type" content="website"/>
		<meta property="og:title" content="Magic Trade Assist"/>
		<meta property="og:site_name" content="Magic Trade Assist"/>
		<meta property="og:description" content="Never make bad trades again - look up card prices instantly and see whether a trade is fair or not."/>
	</head>
	<body>
		<div id="container">
			<div id="left">
				<div class="counter"><span class="currentvalue">0,00</span></div>
				<div class="propose"></div>
				<div class="cardlist_container"></div>
				<div class="input">
					<input type="text" name="cardname" tabindex="1" autocomplete="off" class="input_cardname" placeholder="enter cardname"/>
				</div>
			</div>
			<div id="right" class="inactive">
				<div class="propose"></div>
				<div class="counter"><span class="currentvalue">0,00</span></div>
				<div class="cardlist_container"></div>
				<div class="input">
					<input type="text" name="cardname" tabindex="2" autocomplete="off" class="input_cardname" placeholder="enter cardname"/>
				</div>
			</div>
		</div>
		<div id="footer">
			<a href="http://tradeassi.st"><img src="/images/logo.png" alt="MagicTradeAssist"/></a><br/>
			MagicTradeAssist v2.0 &mdash; steffen[at]mnt[dot]me
		</div>
    <div id="popup">
      <div class="window"><h1></h1><p></p></div>
    </div>
		<div id="controlpanel">
			<div id="controlicons">
				<span class="save">Save</span>
				<span class="price min">Use Minimum Price</span>
			</div>
		</div>
	</body>
</html>