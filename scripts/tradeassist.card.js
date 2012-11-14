/**
 * Konstruktor für die Erzeugung von Card-Objekten aus JSON-Objekten
 * @param objects
 * @return {TradeAssistCard}
 * @constructor
 */
function TradeAssistCard(objects) {
	if($.isArray(objects)) {
		$.each(objects,function(index,object) {
			objects[index] = new TradeAssistCard(object);
		});
		return objects;
	} else {
		this.name = {
			'en': objects.name || "",
			'de': objects.name_de || ""
		};
		this.printings = objects.printings;
		this.rates = {
			'normal': objects.rate || -1,
			'foil': objects.rate_foil || -1,
			'min': objects.minprice || -1,
			'min_foil': objects.minprice_foil || -1,
			'date': "",
			'special': ""
		};
		this.count = objects.count || 1;
		this.isFoil = objects.foil || false;
		this.isMinimum = this.isMinimum;
		this.events = {};
		return this;
	}
}

TradeAssistCard.prototype = new TradeAssistBase();
TradeAssistCard.prototype.isMinimum = false;
TradeAssistCard.prototype.constructor = TradeAssistCard;

/**
 * Gibt den Namen in der ausgewählten Sprache zurück (momentan nur "en" und "de")
 * @param language
 * @param limit
 * @return {String}
 */
TradeAssistCard.prototype.getName = function(language,limit) {
	language = language || "en";
	limit = limit || 0;
	if(limit > 5) {
		return (this.name[language].length>limit ? this.name[language].substr(0,this.name[language].substr(limit-5).indexOf(' ')+(limit-5))+'...':this.name[language])
	} else {
		return this.name[language];
	}
};

/**
 * Gibt die ID der Karte zurück
 * @return {*}
 */
TradeAssistCard.prototype.getId = function() {
	return this.printings[0].id;
};

/**
 * Gibt die Rarität der Karte zurück
 * @return {*}
 */
TradeAssistCard.prototype.getRarity = function() {
	return this.printings[0].rarity;
};

/**
 * Gibt die Anzahl dieser Karte zurück
 * @return {Number}
 */
TradeAssistCard.prototype.getCount = function() {
	return this.count;
};

/**
 * Setzt die Anzahl der Karte und löst ggf. ein Update aus
 * @param count
 */
TradeAssistCard.prototype.setCount = function(count) {
	count = (count < 0 ? 0 : count);
	if(count != this.count) {
		var diff = count-this.count;
		this.count = count;
		if(this.getRate() >= 0) this.fireEvent("valuechange",[diff*this.getRate()]);
		else if(count == 0) this.fireEvent("valuechange",[0]);
	}
};

TradeAssistCard.prototype.getIsFoil = function() {
	return this.isFoil;
};

TradeAssistCard.prototype.setIsFoil = function(isFoil) {
	if(isFoil != this.isFoil) {
		var oldRate = this.getRate();
		this.isFoil = isFoil;
		if(oldRate >= 0 && this.getRate() >= 0) this.fireEvent("valuechange",[this.getCount()*(this.getRate()-oldRate)]);
	}
};

TradeAssistCard.prototype.getIsMinimum = function() {
	return this.isMinimum;
};

TradeAssistCard.prototype.setIsMinimum = function(isMinimum) {
	if(isMinimum != this.isMinimum) {
		var oldRate = this.getRate();
		this.isMinimum = isMinimum;
		if(oldRate >= 0 && this.getRate() >= 0) {
			this.fireEvent("valuechange",[this.getCount()*(this.getRate()-oldRate)]);
		}
	}
};

TradeAssistCard.prototype.getSpecial = function() {
	return this.rates.special;
};

/**
 * Gibt die Bild-URL der Karte zurück
 * @return {String}
 */
TradeAssistCard.prototype.getImage = function() {
	var imgUrl = this.defaultImg;
	if(this.printings[0].img == "") { //reguläre karte
		imgUrl = this.regularImageUrl+'type=card&size=small&set='+this.getEdition(true)+'&name='+encodeURIComponent(this.getName().replace(/ \(.*?\)/g,''));
	} else {
		imgUrl = this.customImageUrl+this.printings[0].img;
	}
	return imgUrl;
};

/**
 * Gibt das aktuelle Editions-Kürzel der Karte zurück
 * @return {String}
 */
TradeAssistCard.prototype.getEdition = function(isShort) {
	return (isShort ? this.printings[0].ed : this.printings[0].edition);
};

/**
 * Gibt die Icon-URL für die aktuelle Edition der Karte zurück
 * @param edition
 * @return {String}
 */
TradeAssistCard.prototype.getEditionImage = function(edition) {
	return 'images/editions/'+(edition ? edition : this.getEdition(true))+'.png';
};

/**
 * Gibt alle Editionen einer Karte zurück.
 * @return {Array}
 */
TradeAssistCard.prototype.getEditions = function() {
	var editions = [];
	$.each(this.printings,function(index,edition){
		editions.push({
			'short':edition.ed,
			'long':edition.edition,
			'src':this.getEditionImage(edition.ed)
		});
	}.bind(this));
	return editions;
};

/**
 * Ändert die Edition der Karte, entweder um eine Edition nach links/rechts, oder auf die übergebene Edition
 * @param edition
 */
TradeAssistCard.prototype.setEdition = function(edition) {
	var oldRate = 0;
	if(this.rates.date != "") { // Karte hat für die alte Edition schon Werte
		this.printings[0].rates = this.rates;
		oldRate = this.getRate();
	}
	if(typeof edition != "string") { // durch die Editionen cyclen, entweder nach rechts, oder nach links
		if(!edition) {
			this.printings.unshift(this.printings.pop());
		} else {
			this.printings.push(this.printings.shift());
		}
	} else { // die übergebene Edition suchen und auswählen
		$.each(this.printings, function(index,printing){
			if(printing.ed == edition) {
				this.printings.unshift(this.printings.splice(index,1)[0]);
				return false;
			}
		}.bind(this));
	}
	if(this.printings[0].rates !== undefined && this.printings[0].rates !== null) { // neue Edition hat schon Werte
		this.rates = this.printings[0].rates;
		if(this.rates.special == "nofoil") this.isFoil = false;
		if(this.rates.special == "onlyfoil") this.isFoil = true;
		if(this.getRate() >= 0) this.fireEvent("valuechange",[this.getCount()*(this.getRate()-oldRate)]);
	} else { // neue Edition ohne Werte, also Standard nehmen
		this.rates = {'normal': -1,'foil': -1,'min': -1,'min_foil': -1,'date': "",'special':""};
		this.fireEvent("valuechange",[this.getCount()*(-oldRate)]);
	}
};

/**
 * Gibt den aktuellen Wert einer Karte mit allen Modifikatoren zurück, oder einen leeren String.
 * @return {Number}
 */
TradeAssistCard.prototype.getRate = function() {
	if(this.rates.date == "") {
		if(this.rates.special != this.getId()) {
			var id = this.getId();
			this.rates.special = id;
			$.getJSON(this.url,{'action':'value','arg':id},function(response) {
				if(!response.error && this.getId() == id) {
					this.rates.normal = parseFloat(response.rate);
					this.rates.foil = parseFloat(response.rate_foil);
					this.rates.min = parseFloat(response.minprice);
					this.rates.min_foil = parseFloat(response.minprice_foil);
					this.rates.date = response.timestamp;
					if(response.rate_foil > 0 && response.rate == 0) {
						this.rates.special = "onlyfoil";
						this.isFoil = true;
					} else if(response.rate_foil == 0) {
						this.rates.special = "nofoil";
						this.isFoil = false;
					} else {
						this.rates.special = "";
					}
					this.fireEvent("valuechange",[this.getRate()*this.getCount()]);
				}
			}.bind(this));
		}
		return -1;
	} else {
		if(this.getIsMinimum()) return (this.getIsFoil() ? this.rates.min_foil : this.rates.min);
		else return (this.getIsFoil() ? this.rates.foil : this.rates.normal);
	}
};

/**
 * Gibt das Datum der letzten Wertermittlung zurück
 * @return {String}
 */
TradeAssistCard.prototype.getRateTimestamp = function() {
	return (this.rates.date ? this.rates.date : null);
};

/**
 * Gibt den Link zur Karte auf MKM zurück
 * @return {String}
 */
TradeAssistCard.prototype.getMKMLink = function() {
	return 'http://www.magiccardmarket.eu/CardPage.c1p'+this.getId()+'.prod?referrer=bra1n';
}

/**
 * Erzeugt eine Kopie der Karte und gibt sie zurück
 * @return {TradeAssistCard}
 */
TradeAssistCard.prototype.clone = function() {
	var clone = new TradeAssistCard({}),
		cloneFields = ["name","printings","rates","count","isFoil","isMinimum"];
	for(var x= 0,y=cloneFields.length;x<y;x++) {
		clone[cloneFields[x]] = this[cloneFields[x]];
	}
	return clone;
};
