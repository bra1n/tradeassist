/**
 * Konstruktor für die Karteninterface-Klasse
 * @param sideContainer
 * @param tradeAssist
 * @constructor
 */
function TradeAssistCardInterface(sideContainer,tradeAssist) {
	this.tradeAssist = tradeAssist;
	sideContainer = $(sideContainer);
	/* Internal Vars */
	this.input = sideContainer.find('.input_cardname');
	this.propose = sideContainer.find('.propose');
	this.lastSuggest = "";

	this.counter = new TradeAssistValueCounter(sideContainer.find('.currentvalue'),this.tradeAssist);
	this.counter.addEvent('propose',function(value,factor){
		if(this.proposeTimer) window.clearTimeout(this.proposeTimer);
		this.proposeTimer = window.setTimeout(function(){ this.proposeCard(value,factor); }.bind(this),250);
	}.bind(this));

	this.cardlist = new TradeAssistCardList(sideContainer.find('.cardlist_container'));
	this.cardlist.addEvent('valuechange',function(value){
		this.counter.add(value);
	}.bind(this));

	this.suggestions = new TradeAssistSuggestions(this.input);
	this.suggestions.addEvent('click',function(card){
		this.cardlist.addCard(card.clone());
		this.suggestions.hide();
		this.input.val('').focus();
		this.lastSuggest = '';
	}.bind(this));

	/* Option Binds */
	this.input.on({
		'keyup':function(e){
			this.inputKeyEvent(e.which);
		}.bind(this),
		'blur':function(){
			if(this.input.val() == "") {
				this.input.addClass('inactive').val('enter cardname');
			}
		}.bind(this),
		'focus':function(){
			if(this.input.hasClass('inactive')) {
				this.input.removeClass('inactive').val('');
			}
		}.bind(this)
	});
}

TradeAssistCardInterface.prototype = new TradeAssistBase();
TradeAssistCardInterface.prototype.constructor = TradeAssistCardInterface;

/**
 * Löst bei Tastatur-Eingabe die entsprechende Suggestion-Funktion aus
 * @param key
 */
TradeAssistCardInterface.prototype.inputKeyEvent = function(key) {
	switch(key) {
		case 13: //enter
			if(this.suggestions.isUp()) {
				this.suggestions.fire();
				this.input.val('');
				this.lastSuggest = '';
			} else if(this.input.val()!=""){
				this.lastSuggest = this.input.val();
				this.suggestions.suggest(this.input.val());
			}
			break;
		case 40: //down
			this.suggestions.down();
			break;
		case 38: //up
			this.suggestions.up();
			break;
		case 37: //left
			this.suggestions.left();
			break;
		case 39: //right
			this.suggestions.right();
			break;
		default:
			if(this.suggestTimer) window.clearTimeout(this.suggestTimer);
			this.suggestTimer = window.setTimeout(function(){
				if(this.input.val() != this.lastSuggest) {
					this.lastSuggest = this.input.val();
					this.suggestions.suggest(this.lastSuggest);
				} else if(!this.suggestions.isUp()) {
					this.suggestions.show();
				}
			}.bind(this),250);
	}
};

/**
 * Schlägt eine Karte mit dem Wert value vor, wenn der factor (Anteil von value am Gesamt-Tauschwert) über 0.05 liegt
 * @param value Wert der vorzuschlagenden Karte
 * @param factor Anteil von value am Gesamt-Tauschwert
 */
TradeAssistCardInterface.prototype.proposeCard = function(value,factor) {
	if(factor>0.05 && !this.counter.isMax() && value > 0) {
		var excludedIds = [];
		$.each(this.tradeAssist.cardInterfaces,function(index,side){
			if(side.counter.isMax()) {
				$.each(side.cardlist.exportToObject().cards,function(index,card){
					excludedIds.push(card.id);
				});
			}
		});

		if(this.xhr && this.xhr.readyState != 4) {
			this.xhr.abort();
		}
		this.xhr = $.getJSON(this.url, {'action':'propose','arg':parseFloat(value).toFixed(2),'exclude':excludedIds.join(','),'minprice':TradeAssistCard.prototype.isMinimum},function(response){
			if(response) {
				var card = new TradeAssistCard(response);
				this.propose.off('click').empty();
				this.propose.append($('<img class="thumbnail" src="'+card.getImage()+'" alt="" title="'+card.getName()+'"/>').on({
					'mouseenter':function(){
						var el = $(this);
						$('#fullcard').stop().remove();
						el.clone().attr('id','fullcard').css(el.offset()).css({
							'left':(el.offset().left-245),
							'top':(el.offset().top-20),
							'display':'none'
						}).appendTo('body').fadeIn();
					},
					'mouseleave':function(){ $('#fullcard').stop().fadeOut(500, function(){ $(this).remove(); }); }
				}));
				this.propose.append('<img class="rarity '+card.getRarity()+'" src="'+this.defaultImg+'" alt=""/>');
				this.propose.append('<img class="edition" src="'+card.getEditionImage(null)+'" alt="'+card.getEdition(true)+'" title="'+card.getEdition(false)+'"/>');
				this.propose.append('<div class="name">'+card.getName("en",40)+'</div>');
				this.propose.on('click',function(){
					this.cardlist.addCard(card);
					this.propose.off('click').fadeOut();
				}.bind(this));
				this.propose.stop().fadeIn();
			} else {
				this.propose.off('click').stop().fadeOut();
			}
		}.bind(this));
	} else {
		if(this.xhr) { this.xhr.abort(); }
		this.propose.off('click').stop().fadeOut();
	}
};
