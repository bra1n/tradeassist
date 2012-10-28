var preferences = {},
	lastSuggest,
	suggestTemplate, soldTemplate,
	languages = ["Kartensprache wählen","Englisch","Französisch","Deutsch","Spanisch","Italienisch","S-Chinesisch","Japanisch","Portugiesisch","Russisch","Koreanisch","T-Chinesisch"],
	gradings = ["Zustand wählen","PO","PL","LP","GD","EX","NM","MT"],
	gradingTexts = ["Zustand wählen","Poor","Played","Light Played","Good","Excellent","Near Mint","Mint"],
	levels = ["Verkäuferbewertung wählen","Schlecht","Durchschnittlich","Gut","Sehr gut","Herausragend"],
	speeds = ["Versandgeschwindigkeit wählen","schnell","sehr schnell"],
	countries = ["Herkunftsland wählen","Deutschland","Österreich","Schweiz","Liechtenstein","Frankreich","Großbritannien",
	"Italien","Portugal","Spanien","Belgien","Dänemark","Niederlande","Luxemburg","Bulgarien","Estland","Finnland",
	"Griechenland","Irland","Lettland","Litauen","Malta","Norwegen","Polen","Rumänien","Schweden","Slowakei","Slowenien",
	"Ungarn","Tschechien","Zypern"],
	offers = [],
	sellUrl = 'http://www.magickartenmarkt.de/?mainPage=showProduct&idCategory=1&idProduct=#cardid#&action=fastAddArticle' +
		'&idCategory=1&idAddProduct=#cardid#&amount=#amount#&idLanguage=#language#&condition=#grading#' +
		'&price=#price#&comments=&x='+Math.round(Math.random()*16)+'&y='+Math.round(Math.random()*16)+'#foil##signed#';

/**
 * Initialisiere alle Elemente
 */
$(document).ready(function(){
	suggestTemplate = $('#suggestions li');
	soldTemplate = $('#sold li');
	initSettingsForm();
	initSellForm();
	resetForm();
});

/**
 * Initiiert die Formularelemente des Einstellungs-Menüs
 */
function initSettingsForm() {
	/* Name */
	preferences.name = $.cookie("name");
	if(!preferences.name) {
		preferences.name = prompt("Gib deinen MKM Benutzernamen ein:","");
		$.cookie("name",preferences.name);
	}
	$('#foot .username').text(preferences.name).click(function(){
		preferences.name = prompt("Gib deinen MKM Benutzernamen ein:","");
		$.cookie("name",preferences.name);
		$('#foot .username').text(preferences.name);
	});

	/* Sprache */
	preferences.language = $.cookie("language");
	$.each(languages,function(index){
		$('#foot select[name=languages]').append('<option value="'+index+'"'+(preferences.language == index ? ' selected="selected"':'')+'>'+this+'</option>');
	});
	$('#foot select[name=languages]').change(function(){
		preferences.language = $(this).val();
		$.cookie("language",preferences.language);
	});

	/* Grading */
	preferences.grading = $.cookie("grading");
	$.each(gradingTexts,function(index){
		$('#foot select[name=gradings]').append('<option value="'+index+'"'+(preferences.grading == index ? ' selected="selected"':'')+'>'+this+'</option>');
	});
	$('#foot select[name=gradings]').change(function(){
		preferences.grading = $(this).val();
		$.cookie("grading",preferences.grading);
	});

	/* Verkäuferbewertung */
	preferences.level = $.cookie("level");
	$.each(levels,function(index){
		$('#foot select[name=levels]').append('<option value="'+index+'"'+(preferences.level == index ? ' selected="selected"':'')+'>'+this+'</option>');
	});
	$('#foot select[name=levels]').change(function(){
		preferences.level = $(this).val();
		$.cookie("level",preferences.level);
		calculatePrice('min');
	});

	/* Versandgeschwindigkeit */
	preferences.speed = $.cookie("speed");
	$.each(speeds,function(index){
		$('#foot select[name=speeds]').append('<option value="'+index+'"'+(preferences.speed == index ? ' selected="selected"':'')+'>'+this+'</option>');
	});
	$('#foot select[name=speeds]').change(function(){
		preferences.speed = $(this).val();
		$.cookie("speed",preferences.speed);
		calculatePrice('min');
	});

	/* Herkunftsland */
	preferences.country = $.cookie("country");
	$.each(countries,function(){
		$('#foot select[name=countries]').append('<option'+(preferences.country == this ? ' selected="selected"':'')+'>'+this+'</option>');
	});
	$('#foot select[name=countries]').change(function(){
		preferences.country = $(this).val();
		$.cookie("country",preferences.country);
		calculatePrice('min');
	});
}

/**
 * Initiiert die Formularelemente im Verkaufs-Menü
 */
function initSellForm() {
	/* Suggestion Input */
	$('#cardname').keyup(function(event){
		suggest(event.which);
	});
	$('#sellbutton').attr('disabled',true).removeClass('active');
	$('input[type=checkbox], input[type=radio]').click(function(){
		if($(this).attr('type') == "radio") {
			$('label[for="'+$(this).attr('id')+'"]').addClass('checked').siblings('label.checked').removeClass('checked');
		} else {
			if($(this).is(':checked')) {
				$('label[for="'+$(this).attr('id')+'"]').addClass('checked');
			} else {
				$('label[for="'+$(this).attr('id')+'"]').removeClass('checked');
			}
		}
	}).filter(':checked').each(function(){
		$('label[for="'+$(this).attr('id')+'"]').addClass('checked');
	});

	/* Anzahl Buttons */
	$('input[name=count]').click(function(){
		if($(this).attr('id') == "count-x") {
			var x = 0;
			while(isNaN(parseInt(x,10)) || parseInt(x,10)<=0) {
				x = prompt("Bitte gib eine Anzahl ein:","5");
			}
			$(this).val(x).next('label[for=count-x]').text(x);
		}
		var sum = 0;
		var currentVal = parseInt($(this).val(),10);
		$('#languages input:checked').each(function(){
			sum += parseInt($(this).val(),10);
		});
		if(sum < currentVal) {
			var first = $('#languages input:checked:first'),
				firstVal = parseInt(first.val(),10);
			first.val(currentVal - sum + firstVal).siblings('span.'+first.attr('id').replace(/-/,'.')).text(currentVal - sum + firstVal);
		} else if(sum > currentVal) {
			$('#languages input:checked').each(function(){
				if($(this).val() < (sum - currentVal)) {
					sum -= $(this).val();
					$(this).val(0).attr('checked',false).siblings('span.'+$(this).attr('id').replace(/-/,'.')).text(0);
				} else {
					$(this).val(parseInt($(this).val(),10) - sum + currentVal).siblings('span.'+$(this).attr('id').replace(/-/,'.')).text($(this).val());
					return false;
				}
			});
		}
		calculatePrice('min');
	});

	/* Sprach-Buttons */
	$('#languages input').click(function(){
		var response = $(this).is(':checked');
		if($(this).siblings("input:checked").length) {
			var other = $(this).siblings("input:checked:first"),
				otherVal = parseInt(other.val(),10)-1,
				thisVal = parseInt($(this).val(),10)+1;
			other.attr('checked',(otherVal>0)).val(otherVal).siblings('span.'+other.attr('id').replace(/-/,'.')).text(otherVal);
			$(this).val(thisVal).attr('checked',true).siblings('span.'+$(this).attr('id').replace(/-/,'.')).text(thisVal);
		}
		return response;
	});

	/* andere Sprache wählen */
	$('#language-x').change(function(){
		$('#overlay-bg').show();
		$('#overlay').empty().show().append($('#preference-language').clone().find(':selected').attr('selected',false).parent().change(function(){
			if($(this).val() !== 0) {
				$('#language-x').attr('name','language['+$(this).val()+']').next('label').attr('class','language-'+$(this).val());
			}
			$('#overlay').hide();
			$('#overlay-bg').hide();
		}).focus()).show();
	});

	/* Grading wählen */
	$('#grading').click(function(){
		$('#overlay-bg').show();
		$('#overlay').empty().show().append($('#preference-grading').clone().find(':selected').attr('selected',false).parent().change(function(){
			if($(this).val() !== 0) {
				$('#grading').val($(this).val()).text(gradings[$(this).val()]).attr('class','grading-'+$(this).val());
			}
			$('#overlay').hide();
			$('#overlay-bg').hide();
		}).focus()).show();
	});

	/* Checkboxen / Buttons */
	$('#setValueMin').click(function(){
		calculatePrice('min');
	});
	$('#setValueTop10').click(function(){
		calculatePrice('top10');
	});
	$('#setValueAvg').click(function(){
		calculatePrice('avg');
	});
	$('#foil').click(function(){
		calculatePrice('min');
	});
	$('#sellbutton').click(function(){
		sellCard();
	});
}

/**
 * Schlage eine Karte vor
 * @param keycode
 * @todo Tastaturnavigation bauen
 */
function suggest(keycode) {
	switch(keycode) {
		case 37: //left
			$('#suggestions li.active .arrow.left').click();
		break;
		case 39: //right
			$('#suggestions li.active .arrow.right').click();
		break;
		case 38: //up
			if($('#suggestions li.active').removeClass('active').prev().addClass('active').length === 0) {
				$('#suggestions li:last').addClass('active');
			}
		break;
		case 40: //down
			if($('#suggestions').is(':visible')) {
				if($('#suggestions li.active').removeClass('active').next().addClass('active').length === 0) {
					$('#suggestions li:first').addClass('active');
				}
				break;
			}
		case 13: //enter
			if($('#suggestions li.active').length) {
				$('#suggestions li.active').click();
				break;
			}
		default:
			if($('#cardname').val() != lastSuggest || keycode == 13 || keycode == 40) {
				$('#cardpreview').hide();
				$('#sellbutton').attr('disabled',true).removeClass('active');
				lastSuggest = $('#cardname').val();
				if(lastSuggest.length>1) {
					$.getJSON("bridge.php",{"action":"suggest","arg":lastSuggest},function(data){
						if(data.cards) {
							$('#suggestions').empty();
							$.each(data.cards,function(){
								var that = this;
								var card = suggestTemplate.clone();
								card.attr('id','card-'+this.printings[0].id);
								card.find('.cardname').text(this.name);
								card.find('.edition').attr('src','images/editions/'+this.printings[0].ed+'.png');
								if(this.printings.length == 1) {
									card.find('.arrow').remove();
								}
								card.click(function(e) {
									if ($(e.target).hasClass('arrow')) {
										if ($(e.target).hasClass('left')) {
											that.printings.unshift(that.printings.pop());
										} else {
											that.printings.push(that.printings.shift());
										}
										card.find('.edition').attr('src', 'images/editions/' + that.printings[0].ed + '.png');
										card.attr('id', 'card-' + that.printings[0].id);
									} else {
										$('#cardname').val(lastSuggest = that.name);
										getOffers(card.attr('id').substr(5));
										$('#cardid').val(card.attr('id').substr(5));
										$('#cardpreview').html('<a href="https://www.magickartenmarkt.de/_.c1p'+that.printings[0].id+'.prod" target="_blank"><img src="'+getImageUrl(that.name,that.printings[0])+'" alt=""/></a>').show();
										$('#suggestions').empty().hide();
										$('#sellbutton').attr('disabled',false).addClass('active');
									}
								});
								$('#suggestions').show().append(card.show());
							});
							$('#suggestions li:first').addClass('active');
						}
					});
				} else {
					$('#suggestions').empty().hide();
				}
			}
		break;
	}
}

/**
 * Hole alle Offers zu einem Produkt
 * @param id
 */
function getOffers(id) {
	offers = [];
	resetForm();
	$('#offers .offercount').text('').addClass('loading');
	$('#offers .youroffercount').html('&ndash;');
	$('#offers .recommended').html('&ndash;');
	$.getJSON("bridge.php",{"action":"offers","arg":id},function(data){
		offers = data;
		$('#offers .offercount').removeClass('loading').text(data.length);
		var yourOffers = "";
		$.each(data,function(){
			if(!this.seller) this.seller = "";
			if(!this.price) this.price = 0;
			if(this.seller.toLowerCase() == preferences.name.toLowerCase()) {
				if(yourOffers !== "") {
					yourOffers = yourOffers + ', ';
				}
				if(this.foil) yourOffers += "<b>";
				yourOffers += this.amount + 'x <img src="images/spacer.gif" class="flag flag-'+this.language+'"/>';
				yourOffers += '<img src="images/grading-'+this.grading+'.png" class="grading" alt="" title="'+gradingTexts[this.grading]+'"/>';
				yourOffers += ' je '+this.price.toFixed(2)+'&euro;';
				if(this.foil) yourOffers += "</b>";
			}
		});
		$('#offers .youroffercount').html(yourOffers);
		calculatePrice('min');
	});
}

/**
 * Setze alle Formularfelder auf den Ausgangszustand
 */
function resetForm() {
	//reset fields
	$('input[type=checkbox],input[type=radio]').attr('checked',false).siblings('label').removeClass('checked');
	$('#count-1').attr('checked',true);
	$('label[for=count-1]').addClass('checked');
	$('label[for=count-x]').text('X');
	$('#languages input').val(0);
	$('span.language').text(0);
	$('#value').val("");

	//apply preferences
	if(preferences.grading > 0) {
		$('#grading').text(gradings[preferences.grading]).val(preferences.grading).attr('class','grading-'+preferences.grading);
	}
	if(preferences.language == 1 || preferences.language == 3) {
		$('#language-'+preferences.language).val(1).attr('checked',true);
		$('span.language.'+preferences.language).text(1);
	} else if(preferences.language > 0) {
		$('#language-x').val(1).attr('name','language['+preferences.language+']').attr('checked',true);
		$('span.language.x').text(1);
		$('label[for=language-x]').attr('class','language-'+preferences.language);
	} else {
		$('#language-1').val(1).attr('checked',true);
		$('span.language.'+'1').text(1);
	}
}

/**
 * Berechne den empfohlenen Preis
 * @param mode avg/top10/min
 */
function calculatePrice(mode) {
	var proposedPrice = 0;
	var filteredOffers = [];
	if(offers.length) {
		var stripFilter = 0;
		while(filteredOffers.length === 0) {
			$.each(offers,function(){
				if(!this.total) this.total = 0;
				var filterNumber = 0;
				// nur Foil-/Nicht-Foil-Karten
				if(stripFilter < ++filterNumber && $('#foil').is(':checked') && !this.foil) return true;
				// nur Angebote mit min. der selben Menge an Karten insgesamt
				if(stripFilter < ++filterNumber && this.total < $('input[name=count]:checked').val()) return true;
				// nur Händler mit min. der gewählten Versandgeschwindigkeit
				if(stripFilter < ++filterNumber && preferences.speed && this.speed < preferences.speed) return true;
				// nur Händler mit min. der gewählten Bewertung
				if(stripFilter < ++filterNumber && preferences.level && this.level < preferences.level) return true;
				// nur Angebote aus dem gewählten Land
				if(stripFilter < ++filterNumber && preferences.country && this.country != preferences.country) return true;
				// nur Karten mit min. dem gewählten Zustand
				if(stripFilter < ++filterNumber && $('#grading').val() && this.grading < $('#grading').val()) return true;
				// eigene Angebote ignorieren
				if(stripFilter < ++filterNumber && preferences.name && this.seller.toLowerCase() == preferences.name.toLowerCase()) return true;
				filteredOffers.push(this);
			});
			stripFilter++;
		}
		//console.log('stripped '+(stripFilter-1)+' filters');
	}
	if(filteredOffers.length) {
		switch(mode) {
			case 'avg': //Durchschnittspreis
				var priceSum = 0;
				var offerSum = 0;
				$.each(filteredOffers,function(){
					priceSum += this.price * this.amount;
					offerSum += this.amount;
				});
				proposedPrice = (priceSum / offerSum);
				break;
			case 'top10': //Preis innerhalb der Top10
				var x = 0;
				$.each(filteredOffers,function(){
					x++;
					proposedPrice = this.price - 0.01;
					if(x==10) {
						return false;
					}
				});
				break;
			case 'min':
			default: //Minimalpreis
				proposedPrice = filteredOffers[0].price - 0.01;
				break;
		}
	}
	if(proposedPrice) {
		$('#value').val(proposedPrice.toFixed(2));
	} else {
		$('#value').val('0.00');
	}
}

/**
 * Verkauft die aktuell eingetragene Karte
 */
function sellCard() {
	$('#languages input:checked').each(function() {
		var currentUrl = sellUrl.replace(/#cardid#/g, $('#cardid').val());
		currentUrl = currentUrl.replace(/#amount#/g, $(this).val());
		currentUrl = currentUrl.replace(/#language#/g, parseInt($(this).attr('name').substr(9),10));
		currentUrl = currentUrl.replace(/#grading#/g, gradings[$('#grading').val()]);
		currentUrl = currentUrl.replace(/#foil#/g, ($('#foil').is(':checked') ? '&isFoil=on' : ''));
		currentUrl = currentUrl.replace(/#signed#/g, ($('#signed').is(':checked') ? '&isSigned=on' : ''));
		currentUrl = currentUrl.replace(/#price#/g, $('#value').val());

		var soldCard = soldTemplate.clone();
		soldCard.find('.name').text($('#cardname').val()).addClass($('#foil').is(':checked') ? 'foil':'').attr('href','http://www.magickartenmarkt.de/?mainPage=showProduct&idCategory=1&idProduct='+$('#cardid').val());
		soldCard.find('.amount').text($(this).val());
		soldCard.find('.price').text($('#value').val());
		soldCard.find('.flag').addClass('flag-'+parseInt($(this).attr('name').substr(9),10));
		soldCard.find('.loading').attr('src',currentUrl).error(function(){
			soldCard.find('.loading').attr('src','images/spacer.gif').removeClass('loading').addClass('done');
		});
		$('#sold').prepend(soldCard.show());
	});
}

/**
 * Gibt die korrekte Bild-URL für eine Karte zurück.
 * @param name
 * @param printing
 * @return string
 */
function getImageUrl(name,printing) {
	var regularImageUrl = 'http://gatherer.wizards.com/Handlers/Image.ashx?';
	var customImageUrl = 'http://tcgimages.eu/img/cards/';
	if(printing.img === "") { //reguläre karte
		imgUrl = regularImageUrl+'type=card&size=small&set='+printing.ed+'&name='+escape(name.replace(/ \(.*?\)/g,''));
	} else {
		imgUrl = customImageUrl+printing.img;
	}
	return imgUrl;
}
