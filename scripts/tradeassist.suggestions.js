/**
 * Konstruktor für die Suggestions-Klasse
 * @param inputElement Anker für das Eingabe-Feld
 * @constructor
 */
function TradeAssistSuggestions(inputElement) {
	this.inputElement = $(inputElement);
	this.container = $('<ul class="suggestions"></ul>');
	this.events = {};
}

TradeAssistSuggestions.prototype = new TradeAssistBase();
TradeAssistSuggestions.prototype.constructor = TradeAssistSuggestions;

/**
 * AJAX Request ausführen für einen Suchbegriff
 * @param name
 */
TradeAssistSuggestions.prototype.suggest = function(name) {
	if(name!="") {
		if(this.xhr && this.xhr.readyState != 4) {
			this.xhr.abort();
		}
		this.xhr = $.getJSON(this.url, {'action':'suggest','arg':name},function(response){
			if(name == this.lastSuggest) { //aktueller Request
				if(response && response.cards.length>0) {
					this.show(new TradeAssistCard(response.cards));
				} else {
					this.hide();
				}
			}
		}.bind(this));
		this.lastSuggest = name;
	} else {
		this.hide();
	}
};

/**
 * Suggestions anzeigen
 * @param cards
 */
TradeAssistSuggestions.prototype.show = function(cards) {
	if(cards) {
		this.container.empty();
		$.each(cards,function(index,card){
			var line = $('<li class="suggestion'+(index ? '':' active')+'"></li>').data('card',card),
				realname = "",
				displayname = "",
				searchPattern = this.escapeRegExp(this.lastSuggest);
			if(!this.lastSuggest || new RegExp(searchPattern,"i").test(card.getName())) {
				displayname = card.getName().replace(new RegExp("("+searchPattern+")","i"),'<em>$1</em>');
			} else {
				displayname = card.getName('de').replace(new RegExp("("+searchPattern+")","i"),'<em>$1</em>');
				realname = card.getName();
			}
			line.append($('<span class="name">'+(displayname.length>40 ? displayname.substr(0,displayname.substr(35).indexOf(' ')+35)+'...':displayname)+'</span>'));
			if(realname != "") {
				line.append($('<span class="name_real">('+realname+')</span>'));
			}
			line.append($('<img class="thumbnail" src="'+card.getImage()+'" title="'+card.getName()+'" alt="'+card.getName()+'"/>'));
			line.prepend($('<img class="edition" alt="'+card.getEdition(true)+'" title="'+card.getEdition()+'" src="'+card.getEditionImage()+'"/>'));
			if(card.getEditions().length > 1) {
				line.prepend($('<div class="arrow left">&larr;</div>').on('click',function(e){
					e.stopPropagation();
					this.left(line);
				}.bind(this)));
				line.prepend($('<div class="arrow right">&rarr;</div>').on('click',function(e){
					e.stopPropagation();
					this.right(line);
				}.bind(this)));
			}
			line.on({
				'click':function(){
					this.fireEvent('click',[card]);
				}.bind(this),
				'mouseenter':function(){
					if(!line.is('.active')) {
						$('li.active',this.container).removeClass('active');
						line.addClass('active');
					}
				}.bind(this)
			});
			this.container.append(line);
		}.bind(this));
	}
	if(!this.isUp() && $('li.suggestion',this.container).length) {
		this.inputElement.parent('.input').after(this.container);
		var w = $(window);
		if(w.height() + w.scrollTop() < this.container.offset().top + this.container.outerHeight()) {
			$('html').animate({scrollTop: this.container.offset().top + this.container.outerHeight() - w.height()});
		}
	}
};

/**
 * Entfernt die Suggestions aus dem DOM-Tree
 */
TradeAssistSuggestions.prototype.hide = function() {
	if(this.isUp()) {
		this.inputElement.parent('.input').next('.suggestions').detach();
	}
};

/**
 * TRUE wenn die Suggestions gerade sichtbar sind
 * @return {Boolean}
 */
TradeAssistSuggestions.prototype.isUp = function() {
	return (this.inputElement.parent('.input').next('.suggestions').length > 0);
};

/**
 * Führt einen Click auf die ausgewählte Suggestion aus
 */
TradeAssistSuggestions.prototype.fire = function() {
	this.hide();
	$('li.active',this.container).trigger('click');
};

/**
 * Bewegt die Auswahl nach unten
 */
TradeAssistSuggestions.prototype.down = function() {
	if(this.isUp()) {
		if($('li.suggestion',this.container).length <= 1) return;
		var current = $('li.active',this.container).removeClass('active');
		if(current.next('li.suggestion').addClass('active').length == 0) {
			$('li.suggestion:first',this.container).addClass('active');
		}
	} else {
		this.show();
	}
};

/**
 * Bewegt die Auswahl nach oben
 */
TradeAssistSuggestions.prototype.up = function() {
	if(this.isUp()) {
		if($('li.suggestion',this.container).length <= 1) return;
		var current = $('li.active',this.container).removeClass('active');
		if(current.prev('li.suggestion').addClass('active').length == 0) {
			$('li.suggestion:last',this.container).addClass('active');
		}
	} else {
		this.show();
	}
};

/**
 * Ändert die ausgewählte Edition einer Suggestion
 * @param line
 * @param right
 */
TradeAssistSuggestions.prototype.changeEdition = function(line, right) {
	if(this.isUp()) {
		this.inputElement.focus();
		if(!line) line = $('li.active',this.container);
		var card = line.data('card');
		if(card.getEditions().length > 1) {
			card.setEdition(right);
			$('.thumbnail',line).attr('src',card.getImage());
			$('.edition',line).attr({'alt':card.getEdition(true),'title':card.getEdition()}).attr('src',card.getEditionImage());
		}
	}
};

/**
 * Eine Edition nach links
 * @param line
 */
TradeAssistSuggestions.prototype.left = function(line) { this.changeEdition(line,false); };

/**
 * Eine Edition nach rechts
 * @param line
 */
TradeAssistSuggestions.prototype.right = function(line) { this.changeEdition(line,true); };

TradeAssistSuggestions.prototype.escapeRegExp = function(string){
	// Credit: XRegExp 0.6.1 (c) 2007-2008 Steven Levithan <http://stevenlevithan.com/regex/xregexp/> MIT License
	return string.replace(/[-[\]{}()*+?.\\^$|,#\s]/g, function(match){
		return '\\' + match;
	});
};