var lastSuggest, suggestTemplate, queue = {"left":[],"right":[]};

$(document).ready(function(){
	lastSuggest = "";
	suggestTemplate = $('#suggestions li.template').clone().removeClass("template");
	var suggestTimer = 0;

	/* Suggestion Input */
	$('#search').bind("keyup",function(event){
		window.clearTimeout(suggestTimer);
		suggestTimer = window.setTimeout(function(){
			suggest(event.which);
		},500);
	});
	$('#main > .counter').click(function(){
		if($(this).hasClass('active') && $("ul.cardlist."+getSide($(this))).is(":visible") === false) {
			$(this).addClass('show');
			$("ul.cardlist."+getSide($(this))).show();
		} else if($(this).hasClass('active') && $(this).hasClass("show")) {
			$(this).removeClass('show');
			$("ul.cardlist."+getSide($(this))).hide();
		} else if($(this).siblings('.counter.show').length > 0) {
			$("ul.cardlist."+getSide($(this).siblings('.counter.show').removeClass("show"))).hide();
		}
		$(this).addClass('active').siblings('.active').removeClass('active');
		$("ul.cardlist."+getSide($(this))).addClass('active').siblings('ul.cardlist').removeClass('active');
	});

	if(navigator.userAgent.match(/Android/i)){
		if($(window).height()>=$('body').height()) $('#container').css('min-height',$(window).height()+40);
        window.scrollTo(0,1);
    }
});

/**
 * Schlage eine Karte vor
 * @param keycode
 * @todo Tastaturnavigation bauen
 */
function suggest(keycode) {
	if($('#search').val() != lastSuggest || keycode == 13) {
		lastSuggest = $('#search').val();
		if(lastSuggest.length>1) {
			$.getJSON("bridge.php",{"action":"suggest","arg":lastSuggest},function(data){
				if(data.cards) {
					$('#suggestions').empty();
					$.each(data.cards,function(){
						var card = suggestTemplate.clone();
						card.data('id',this.printings[0].id);
						card.attr('title',this.name).addClass("card-"+this.printings[0].id).find('.cardname').text(this.name);
						card.find('.thumb').css('background-image',"url("+getImageUrl(this.name,this.printings[0])+")");
						var edition = card.find('.edition').data('printing',this.printings[0]).addClass("active edition-"+this.printings[0].id);
						edition.find('.symbol').attr('src','images/editions/'+this.printings[0].edition+'.png');
						edition.find('span').text(this.printings[0].edition);
						$.each(this.printings.slice(1),function(){
							var editionCopy = edition.clone().css('background-image','images/editions/'+this.edition+'.png').attr('class','edition hidden edition-'+this.id).data('printing',this);
							editionCopy.find('.symbol').attr('src','images/editions/'+this.edition+'.png');
							editionCopy.find('span').text(this.edition);
							card.find('.editions').addClass('multiple').prepend(editionCopy);
						});
						card.click(handleCardclick);
						if(data.type == "foil") card.find('.edition').andSelf().addClass('foil');
						$('#suggestions').append(card);
					});
				}
			});
		} else {
			$('#suggestions').empty();
		}
	}
}

function handleCardclick(e) {
	var target = $(e.target),
		card = target.closest('li');
	if (target.hasClass('thumb') || target.hasClass('rate')) {
		// Thumbnail-Click
		if(target.hasClass('rate')) target = target.closest('.thumb');
		var thumb = $('<img/>').attr('src',target.css('background-image').replace(/^url\(\"(.*?)\"\)$/,'$1')).css(target.offset()).css({
			position: 'absolute',
			opacity: 0,
			cursor: 'pointer',
			border: '2px solid white',
			"z-index":100
		}).appendTo($('body'));
		var width = thumb.width(), height = thumb.height();
		thumb.css({width:target.width(),height:target.height()}).animate({
			width:width,
			height:height,
			opacity:1
		},'fast').click(function(){
			$(this).fadeOut('fast',function(){
				$(this).remove();
			});
		});
	} else if(target.hasClass('edition') || target.hasClass('editions') || target.parent().hasClass('edition')) {
		if(!target.hasClass('edition') && !target.hasClass('editions')) target = target.parent();
		// Editions-Symbolclick
		if(target.hasClass('hidden') || target.siblings('.edition:visible').length > 0) {
			var oldId = target.closest('li').data('id'),
				newId = target.data('printing').id;
			target.addClass('active').removeClass('hidden').siblings('.edition').addClass('hidden').removeClass('active').hide();
			card.data('id',newId).removeClass('card-'+oldId).addClass('card-'+newId).find('.thumb').css('background-image',"url("+getImageUrl(target.closest('li').find('.cardname').text(),target.data('printing'))+")");

			if(target.closest('ul').attr('id') != "suggestions") {
				cancelRequest(card);
				if(card.find('.edition-'+oldId).data('rate') > 0) {
					textadd($('#main > .counter.'+getSide(card.closest('ul'))+' .amount'),-1*card.find('.edition-'+oldId).data('rate'));
				}
				addMoney(card);
			}
		} else if(target.hasClass('edition')) {
			target.siblings('.edition.hidden').show();
		} else {
			target.find('.edition.hidden').show();
		}
	} else {
		// Karten-Click
		if(target.closest('ul').attr('id') == "suggestions") {
			card.fadeTo("fast",0.3).fadeTo("fast",1);
			addMoney(card.clone(true).css('opacity',1).appendTo($('ul.cardlist.'+getSide($('#main > .counter.active')))));
		} else {
			removeCard(card);
		}
	}
}

function addMoney(card) {
	var list = card.closest('ul'),
		counter = $('#main > .counter.'+getSide(list)),
		id = card.data('id');
	counter.find('.card').text(list.find('li').length);
	if(card.find('.edition.active').data('rate') > 0) {
		textadd(counter.find('.amount'),card.find('.edition.active').data('rate'));
		card.find('.rate').text(numform(card.find('.edition.active').data('rate'),false)).show();
		if(card.find('.edition.active').hasClass('foil')) card.addClass('foil');
		else card.removeClass('foil');
	} else {
		if(card.data('xhr')) {
			card.data('xhr').abort();
			card.data('xhr',null);
		}
		counter.addClass('loader');
		queue[getSide(list)].push(card);
		var xhr = $.getJSON("bridge.php",{"action":"value","arg":id},function(data) {
			if(!data.error && list.find('.card-'+id).length > 0) {
				if(data.rate > 0 && card.find('.edition.active').hasClass("foil") === false) {
					textadd(counter.find('.amount'),data.rate);
					card.removeClass('foil').find('.edition.active').data('rate',data.rate);
					card.find('.rate').text(numform(data.rate, false)).show();
				} else if(data.rate_foil > 0) {
					textadd(counter.find('.amount'),data.rate_foil);
					card.addClass('foil').find('.edition.active').data('rate',data.rate_foil).addClass('foil');
					card.find('.rate').text(numform(data.rate_foil, false)).show();
				}
			}
			card.data('xhr',null);
			queue[getSide(list)].shift();
			if(queue[getSide(list)].length === 0) counter.removeClass('loader');
		});
		card.data('xhr',xhr);
	}
}


function removeCard(card) {
	var list = card.closest('ul'),
		counter = $('#main > .counter.'+getSide(list));
	if(card.find('.edition.active').data('rate') > 0) {
		textadd(counter.find('.amount'),-1*card.find('.edition.active').data('rate'));
	}
	cancelRequest(card);
	card.remove();
	counter.find('.card').text(list.find('li').length);
}

/*
	Helper functions
 */
function textadd(element,value) { if(isNaN(value) === false) element.text(numform(numparse(element.text())+value)); }
function numform(val, signed) { return String(val.toFixed(2)).replace(/\./,",")+(typeof signed == "undefined" ? "€":""); }
function numparse(val) { return parseFloat(val.replace(/,/,".")); }
function getSide(element) { return element.hasClass('left') ? 'left':'right'; }

function cancelRequest(card) {
	if(card.data('xhr')) {
		card.data('xhr').abort();
		card.data('xhr',null);
		queue[getSide(card.closest('ul'))].shift();
		if(queue[getSide(card.closest('ul'))].length === 0) {
			$('#main > .counter.'+getSide(card.closest('ul'))).removeClass('loader');
		}
	}
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
		imgUrl = regularImageUrl+'type=card&size=small&set='+printing.edition+'&name='+escape(name.replace(/ \(.*?\)/g,''));
	} else {
		imgUrl = customImageUrl+printing.img;
	}
	return imgUrl;
}