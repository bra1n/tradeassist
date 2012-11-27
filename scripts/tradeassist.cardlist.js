/**
 * Konstruktor für die Kartenlisten-Klasse
 * @param cardlistElement
 * @constructor
 */
function TradeAssistCardList(cardlistElement) {
	this.cards = [];
	this.sortElements = $('<div class="sort"><div class="title">sort by</div></div>');
	this.sortElements.prepend($('<div class="name active down">name</div>').on('click',function(e){
		if(!$(e.target).is('.active')) $(e.target).siblings('.active').removeClass('active').removeClass('down');
		this.sort('name',$(e.target).addClass('active').toggleClass('down').hasClass('down'));
	}.bind(this)));
	this.sortElements.prepend($('<div class="rarity">rarity</div>').on('click',function(e){
		if(!$(e.target).is('.active')) $(e.target).siblings('.active').removeClass('active').removeClass('down');
		this.sort('rarity',$(e.target).addClass('active').toggleClass('down').hasClass('down'));
	}.bind(this)));
	this.sortElements.prepend($('<div class="rate">price</div>').on('click',function(e){
		if(!$(e.target).is('.active')) $(e.target).siblings('.active').removeClass('active').removeClass('down');
		this.sort('rate',$(e.target).addClass('active').toggleClass('down').hasClass('down'));
	}.bind(this)));
	this.sortElements.prepend($('<div class="reset">X</div>').on('click',function(){ this.reset(); }.bind(this)));
	this.sortElements.prepend($('<div class="cards"><strong>0</strong> cards</div>'));
	this.cardlist = $('<ul class="cardlist"></ul>');
	$(cardlistElement).append(this.sortElements).append(this.cardlist);
	this.events = {};
}

TradeAssistCardList.prototype = new TradeAssistBase();
TradeAssistCardList.prototype.constructor = TradeAssistCardList;

/**
 * Nimmt eine Karte in die Liste auf
 * @param card
 */
TradeAssistCardList.prototype.addCard = function(card) {
	if(card === undefined || card === null) return;
	var cardContainer = this.generateCardTemplate(card);
	this.cardlist.append(cardContainer);
	this.cards.push(cardContainer.slideDown());
	card.removeEvents("valuechange").addEvent("valuechange",function(value){ this.handleValueChange(cardContainer, value); }.bind(this));
	this.sort(this.sortElements.find('.active').text(),this.sortElements.find('.active').hasClass('down'));
	this.updateCounter();
};

/**
 * Sortiert die Kartenliste nach field (name, edition, rarity, price) in der Reihenfolge order
 * @param field
 * @param order
 */
TradeAssistCardList.prototype.sort = function(field,order) {
	var sortFunction;
	order = (order ? 1:-1);
	switch(field) {
		case 'name':
			sortFunction = function(a,b){
				if($(a).data('card').getName().toLowerCase() > $(b).data('card').getName().toLowerCase()) return order;
				else return order*(-1);
			};
			break;
		case 'edition':
			sortFunction = function(a,b){
				if($(a).data('card').getEdition(false) > $(b).data('card').getEdition(false)) return order;
				else return order*(-1);
			};
			break;
		case 'rarity':
			sortFunction = function(a,b){
				var rarities = ['t','c','u','r','m','s'];
				if(rarities.indexOf($(a).data('card').getRarity()) < rarities.indexOf($(b).data('card').getRarity())) return order;
				else return order*(-1);
			};
			break;
		case 'rate':
		case 'price':
			sortFunction = function(a,b){
				if($(a).data('card').getRate() < $(b).data('card').getRate()) return order;
				else return order*(-1);
			};
			break;
	}
	if(this.cardlist.find('li.card').length > 0) {
		this.cardlist.append(this.cardlist.find('li.card').sort(sortFunction));
	}
};

/**
 * Leert die Kartenliste
 * @return {*}
 */
TradeAssistCardList.prototype.reset = function() {
	var totalValue = 0;
	$.each(this.cards,function(){
		var card = $(this).data('card');
		card.removeEvents("valuechange");
		totalValue -= Math.max(0,card.getRate()) * card.getCount();
		$(this).slideUp(200,function(){ $(this).remove(); });
	});
	this.fireEvent("valuechange",[totalValue]);
	this.cards = [];
	this.updateCounter();
	return this;
};

/**
 * Aktualisiert den Counter am oberen Rand der Kartenliste und blendet die Sortier-Header aus/ein
 */
TradeAssistCardList.prototype.updateCounter = function() {
	var counter = 0;
	$.each(this.cards,function(index,card){
		counter += card.data('card').getCount();
	}.bind(this));
	this.sortElements.find('.cards').html("<strong>"+counter+"</strong> card"+(counter == 1 ? "":"s"));
	if(counter) {
		if(!this.sortElements.is(':visible')) this.sortElements.slideDown();
	} else {
		if(this.sortElements.is(':visible')) this.sortElements.slideUp();
	}
};

/**
 * Gibt die Kartenliste als Objekt zurück
 * @return {Object}
 */
TradeAssistCardList.prototype.exportToObject = function() {
	var listExport = {};
	listExport.cards = [];
	$.each(this.cards,function(index,card){
		listExport.cards.push({
			id:card.data('card').getId(),
			count:card.data('card').getCount(),
			foil:card.data('card').getIsFoil()
		});
	});
	return listExport;
};

/**
 * Erzeugt aus einem Objekt eine Kartenliste
 * @param list
 */
TradeAssistCardList.prototype.importFromObject = function(list) {
	if(list.cards) {
		$.each(list.cards,function(index,card){
			this.addCard(new TradeAssistCard(card));
		}.bind(this));
		this.sort(this.sortElements.find('.active').text(),this.sortElements.find('.active').hasClass('down'));
	}
};

/**
 * Setzt bei allen Karten den Minimum/Durchschnittspreis-Modus
 * @param useMinimumPrices
 */
TradeAssistCardList.prototype.togglePrices = function(useMinimumPrices) {
	$.each(this.cards,function(index,card){
		card.data('card').setIsMinimum(useMinimumPrices);
	});
};

/**
 * Generiert ein Karten-Template
 * @param card
 * @return cardContainer
 */
TradeAssistCardList.prototype.generateCardTemplate = function(card) {
	var cardContainer  = $('<li class="card"></li>'),
		rightContainer = $('<div class="right"></div>');
	rightContainer.append('<span class="count">'+card.getCount()+'x</span><span class="rate'+(card.getIsFoil() ? ' foil':'')+''+(card.getIsMinimum() ? ' min':'')+'"></span>');
	rightContainer.append($('<button class="plus">+</button>').on('click',function(){ card.setCount(card.getCount()+1); }));
	rightContainer.append('<img class="rarity '+card.getRarity()+'" src="'+this.defaultImg+'" alt=""/><br/>');
	rightContainer.append($('<img class="edition" alt="'+card.getEdition(true)+'" title="'+card.getEdition(false)+'" src="'+card.getEditionImage(null)+'"/>').on('click',function(){
		// ---- EDITIONS WÄHLER ---- //
		if(card.getEditions().length > 1) {
			var editionPicker = $('<div class="editions"></div>');
			$.each(card.getEditions(),function(index,edition){
				editionPicker.prepend($('<img class="edition choice"/>').attr({
					'alt':edition.short,
					'src':edition.src,
					'title':edition.long
				}).on('click',function(){
					editionPicker.remove();
					card.setEdition(edition.short);
					rightContainer.find('.edition').attr({
						'alt':card.getEdition(true),
						'title':card.getEdition(false),
						'src':card.getEditionImage(null)
					}).show();
					rightContainer.find('.rarity').attr('class','rarity '+card.getRarity());
					cardContainer.find('.thumbnail').attr('src',card.getImage()).parent('a').attr('href',card.getMKMLink());
				}));
			});
			$(this).hide().after(editionPicker);
		}
	}).toggleClass('multiple',card.getEditions().length>1));
	rightContainer.append($('<div class="checkbox foil" title="Normal / Foil"></div>').toggleClass('checked',card.getIsFoil()).on('click',function(){
		if(!$(this).hasClass('locked')) card.setIsFoil($(this).toggleClass('checked').hasClass('checked'));
	}));
	rightContainer.append($('<button class="minus">&ndash;</button>').on('click',function(){ card.setCount(card.getCount()-1); }.bind(this)));
	rightContainer.append('<img class="rarity '+card.getRarity()+'" src="'+this.defaultImg+'"/>');
	cardContainer.append(rightContainer);
	cardContainer.append($('<a href="'+card.getMKMLink()+'" target="_blank">' +
		'<img class="thumbnail" alt="'+card.getName()+'" title="'+card.getName()+'" src="'+card.getImage()+'"/></a>').on({
		'mouseenter':function(){
			var el = $(this).find('.thumbnail');
			$('#fullcard').stop().remove();
			el.clone().attr('id','fullcard').css(el.offset()).css({
				'left':(el.offset().left-250),
				'top':(el.offset().top-100),
				'display':'none'
			}).appendTo('body').fadeIn();
		},
		'mouseleave':function(){ $('#fullcard').stop().fadeOut(500, function(){ $(this).remove(); }); }
	}));
	cardContainer.append('<div class="name">'+card.getName("en",60)+'</div>').data('card',card);
	if(card.getRate() >= 0) {
		this.handleValueChange(cardContainer, card.getRate());
	} else {
		rightContainer.find('span.rate').addClass('loader');
	}
	return cardContainer;
};

/**
 * Handhabt die Wertveränderung einer Karte
 * @param cardContainer Karten-DOM
 * @param value Wert um den sich der Preis der Karte verändert
 */
TradeAssistCardList.prototype.handleValueChange = function(cardContainer,value) {
	var card = cardContainer.data('card');
	if(card.getCount() == 0) {
		$.each(this.cards,function(index,c){
			if(c == cardContainer) this.cards.splice(index,1);
		}.bind(this));
		cardContainer.slideUp(500,function(){$(this).remove();});
	} else {
		// Wert
		if(card.getRate() < 0) cardContainer.find('span.rate').addClass('loader').text("").attr('title',card.getRateTimestamp());
		else cardContainer.find('span.rate').removeClass('loader').text(card.getRate().toFixed(2).replace(/\./,',')).attr('title',card.getRateTimestamp());
		cardContainer.find('span.rate').toggleClass('foil',card.getIsFoil()).toggleClass('min',card.getIsMinimum());
		cardContainer.find('span.count').text(card.getCount()+"x");
		if(card.getSpecial() == "onlyfoil") {
			cardContainer.find('.name').addClass('foil');
			cardContainer.find('.checkbox.foil').addClass('checked locked').attr('title','');
		} else if(card.getSpecial() == "nofoil") {
			cardContainer.find('.name').removeClass('foil');
			cardContainer.find('.checkbox.foil').addClass('locked').removeClass('checked');
		} else {
			cardContainer.find('.name').toggleClass('foil',card.getIsFoil());
			cardContainer.find('.checkbox.foil').removeClass('locked').toggleClass('checked',card.getIsFoil());
		}
	}
	this.updateCounter();
	if(this.sortElements.find('.active').text() == "price") {
		this.sort('rate',this.sortElements.find('.active').hasClass('down'));
	}
	this.fireEvent("valuechange",[value]);
}