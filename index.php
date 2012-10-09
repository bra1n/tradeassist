<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN"
	"http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en" lang="en">
	<head>
		<meta http-equiv="Content-Type" content="text/html;charset=utf-8"/>
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
	</head>
	<body>
		<div id="container">
			<div id="left">
				<div class="propose"></div>
				<div class="counter"><span class="currentvalue">0,00</span></div>
				<div class="cardlist_container"></div>
				<div class="input">
					<input type="text" name="cardname" tabindex="1" autocomplete="off"
				           class="input_cardname inactive" value="enter cardname"/>
				</div>
			</div>
			<div id="right">
				<div class="propose"></div>
				<div class="counter"><span class="currentvalue">0,00</span></div>
				<div class="cardlist_container"></div>
				<div class="input">
					<input type="text" name="cardname" tabindex="2" autocomplete="off"
				           class="input_cardname inactive" value="enter cardname"/>
				</div>
			</div>
			<br style="clear:both"/>
			<div id="popup">
				<div class="background"></div>
				<div class="window">
					<h1></h1>
					<p></p>
					<button class="close">Close</button>
				</div>
			</div>
		</div>
		<div id="footer">
			<a href="http://magic.mnt.me"><img src="/images/logo.png" alt="MagicTradeAssist"/></a><br/>
			MagicTradeAssist v1.1.0 &mdash; steffen[at]mnt[dot]me
		</div>
		<div id="controlpanel">
			<div id="controlicons">
				<span class="save">Save</span>
				<span class="price min">Use Minimum Price</span>
			</div>
		</div>
	</body>
</html>