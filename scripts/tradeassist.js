var ta;
$(document).ready(function(){
  ta = new TradeAssist().addCardInterface($('#left')).addCardInterface($('#right'));
});

/**
 * Base-Klasse mit Utility-Functions
 * @constructor
 */
function TradeAssistBase() {
  this.defaultImg = 'images/spacer.gif';
  this.regularImageUrl = 'http://gatherer.wizards.com/Handlers/Image.ashx?';
  //this.customImageUrl = 'http://magickartenmarkt.de/img/cards/';
  this.customImageUrl = 'http://tcgimages.eu/img/cards/';
  this.url = "bridge.php";
  this.events = {};
  this.test = "";
}

TradeAssistBase.prototype = {
  /**
   * Fügt einen Event-Listener hinzu
   * @param type
   * @param fn
   * @return {*}
   */
  addEvent: function(type, fn){
    if (fn !== null && fn !== undefined){
      this.events[type] = this.events[type] || [];
      this.events[type].push(fn);
    }
    return this;
  },
  /**
   * Entfernt alle Event-Listener eines Typs
   * @param type
   * @return {*}
   */
  removeEvents: function(type){
    this.events[type] = [];
    return this;
  },
  /**
   * Triggert alle für ein Event registrierten Functions
   * @param type String
   * @param args Array
   * @return {*}
   */
  fireEvent: function(type, args){
    if (!this.events || !this.events[type]) return this;
    $.each(this.events[type],function(key,fn){
      fn.apply(this, args);
    });
    return this;
  },
  setTest: function(value) {
    this.test = value;
  },
  getTest: function() {
    return this.test;
  }
};

/**
 * Konstruktor für die Tradeassist-Klasse
 * @constructor
 * @return {*}
 */
function TradeAssist() {
  this.cardInterfaces = [];
  this.requestRunning = false;
  this.useMinimumPrices = false;
  if(window.location.hash != "") this.loadLists(window.location.hash.substr(1));
  // bind hooks
  if($('#controlicons').length) {
    $('#controlicons .save').on('click',function(){	this.saveLists(); }.bind(this));
    $('#controlicons .price').on('click',function(){ this.togglePrices(); }.bind(this));
  }
  this.popup = $('#popup').on('click','.window',function(){
    $(this).stop().fadeOut(function(){$(this).remove();})
  }).find('.window');
  return this;
}

TradeAssist.prototype = new TradeAssistBase();
TradeAssist.prototype.constructor = TradeAssist;

/**
 * Legt ein CardInterface im side-Element an
 * @param side
 * @return {*}
 */
TradeAssist.prototype.addCardInterface = function(side) {
  this.cardInterfaces.push(new TradeAssistCardInterface(side,this));
  return this;
};

/**
 * Speichert die in den Listen eingetragenen Karten
 */
TradeAssist.prototype.saveLists = function() {
  var listExport = [];
  $.each(this.cardInterfaces,function(index,element){
    var cardlist = element.cardlist;
    listExport[index] = cardlist.exportToObject();
  });
  if(!this.requestRunning) {
    this.requestRunning = true;
    $.post(this.url,{'action':'export','arg':JSON.stringify(listExport)},function(response) {
      if(response) {
        window.location.hash = response;
        var url = window.location.toString();
        this.showPopup("List saved",'List has been saved and can be shared with this URL:<br/><a href="'+url+'">'+url+'</a>')
      }
      this.requestRunning = false;
    }.bind(this));
  }
};

/**
 * Läd die Kartenlisten anhand der übergebenen ID
 * @param id
 */
TradeAssist.prototype.loadLists = function(id) {
  if(!this.requestRunning) {
    this.requestRunning = true;
    $.getJSON(this.url,{'action':'import','arg':id},function(response){
      if(response !== null && response !== undefined && response.length) {
        $.each(response,function(index,list){
          if(this.cardInterfaces[index]) {
            this.cardInterfaces[index].cardlist.reset().importFromObject(list);
          }
        }.bind(this));
      }
      this.requestRunning = false;
    }.bind(this));
  }
};

/**
 * Wechselt zwischen Min-Price und Average-Price
 */
TradeAssist.prototype.togglePrices = function() {
  var isMinimum = TradeAssistCard.prototype.isMinimum = !TradeAssistCard.prototype.isMinimum;
  $('#controlicons .price').text(isMinimum ? "Use Average Prices":"Use Minimum Prices").toggleClass("min",!isMinimum);
  $.each(this.cardInterfaces,function(index,element){
    element.cardlist.togglePrices(isMinimum);
  }.bind(this));
  this.showPopup("Switched Prices","The cards are now compared by <b>"+(isMinimum ? "minimum prices":"average prices")+'</b>');
}

/**
 * Zeigt ein Popup mit Titel, Text und optionaler Button-Beschriftung
 * @param title
 * @param body
 */
TradeAssist.prototype.showPopup = function(title, body) {
  this.popup.clone()
    .find('h1').text(title).end()
    .find('p').html(body).end()
    .appendTo('#popup').slideDown().delay(2500).fadeOut(function(){$(this).remove();});
};