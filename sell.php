<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN"
	"http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en" lang="en">
	<head>
		<meta http-equiv="Content-Type" content="text/html;charset=utf-8"/>
		<title>Magic Sell Assist</title>
		<script src="scripts/jquery.js" type="text/javascript"></script>
		<script src="scripts/jquery.cookie.js" type="text/javascript"></script>
		<script src="scripts/sell.js" type="text/javascript"></script>
		<link rel="shortcut icon" type="image/x-icon" href="images/favicon.ico"/>
		<link rel="stylesheet" media="all" href="styles/sellassist.css"/>
	</head>
	<body>
		<div id="content">
			<div id="panel">
				<div id="cardpreview"></div>
				<div id="input">
					<div id="search">
						<input type="text" name="cardname" id="cardname"/>
						<input type="text" name="value" id="value"/>
						<ul id="suggestions">
							<li style="display:none">
								<div class="arrow left">&lt;</div>
								<div class="arrow right">&gt;</div>
								<img class="edition" src="images/spacer.gif" alt=""/>
								<span class="cardname"></span>
							</li>
						</ul>
						<input type="hidden" name="cardid" id="cardid" value="0"/>
					</div>
					<div id="bottom">
						<div class="counts">
							<input type="radio" name="count" id="count-1" value="1"/>
							<label class="left" for="count-1">1</label>
							<input type="radio" name="count" id="count-2" value="2"/>
							<label for="count-2">2</label>
							<input type="radio" name="count" id="count-3" value="3"/>
							<label for="count-3">3</label>
							<input type="radio" name="count" id="count-4" value="4"/>
							<label for="count-4">4</label>
							<input type="radio" name="count" id="count-x" value="x"/>
							<label for="count-x" class="right">X</label>
						</div>

						<div class="types">
							<button id="grading" class="grading-6" value="6">NM</button>
							<input type="checkbox" name="foil" value="foil" id="foil"/>
							<label for="foil">Foil</label>
							<input type="checkbox" name="signed" value="signed" id="signed"/>
							<label for="signed" class="right">sign</label>
						</div>

						<div class="buttons">
							<button id="setValueMin">Min</button>
							<button id="setValueTop10">Top10</button>
							<button id="setValueAvg">Avg</button>
						</div>
					</div>
					<div id="languages">
						<input type="checkbox" name="language[3]" value="0" id="language-3"/>
						<label for="language-3" class="language-3"></label>
						<input type="checkbox" name="language[1]" value="0" id="language-1"/>
						<label for="language-1" class="language-1"></label>
						<input type="checkbox" name="language[x]" value="0" id="language-x"/>
						<label for="language-x" class="language-x"></label>
						<span class="language 3">0</span>
						<span class="language 1">0</span>
						<span class="language x">0</span>
					</div>
				</div>
				<div id="sell">
					<input type="button" id="sellbutton" disabled="disabled" value="Sell"/>
				</div>
				<div id="offers">
					<strong>Angebote:</strong> <span class="offercount">&ndash;</span>
					<strong>Von dir:</strong> <span class="youroffercount">&ndash;</span><br/>
				</div>
			</div>

			<ul id="sold">
				<li style="display:none;">
					<img class="loading" src="images/spacer.gif" alt=""/>
					<span class="amount">0</span>x
					<a class="name" href="#" target="_blank">Kartenname</a>
					<img class="flag" src="images/spacer.gif" class="flag" alt=""/> für
					<span class="price">0</span>&euro;
				</li>
			</ul>
		</div>
		<div id="overlay-bg"></div>
		<div id="overlay"></div>
		<div id="foot">
			<span class="username"></span>
			<select title="Kartensprache" id="preference-language" name="languages"></select>
			<select title="Kartenzustand" id="preference-grading" name="gradings"></select>
			<select title="Verkäuferbewertung" id="preference-level" name="levels"></select>
			<select title="Versandgeschwindigkeit" id="preference-speed" name="speeds"></select>
			<select title="Herkunftsland" id="preference-country" name="countries"></select>
		</div>
	</body>
</html>

