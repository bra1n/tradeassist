/**
 * Konstruktor für die Wertzähler-Klasse
 * @param counterElement Element, das den Counter enthält
 * @param tradeAssist Hauptklasse, für Vergleiche mit anderen Countern
 * @constructor
 */
function TradeAssistValueCounter(counterElement, tradeAssist) {
  this.counter = $(counterElement).text('0,00');
  this.currentValue = 0;
  this.animationRunning = 0;
  this.animationDuration = 500; //Millisekunden
  this.fontGrowth = 10; //Schriftgroessenwachstum
  this.fontSize = 30; //Schriftgroesse
  this.tradeAssist = tradeAssist;
  this.events = {};
}

TradeAssistValueCounter.prototype = new TradeAssistBase();
TradeAssistValueCounter.prototype.constructor = TradeAssistValueCounter;

/**
 * Zählt den Wertcounter um value Einheiten hoch/runter
 * @param value Zu addierender Wert
 */
TradeAssistValueCounter.prototype.add = function (value) {
  value = parseFloat(value);
  if (value != 0) {
    this.stepsize = (this.currentValue - parseFloat(this.counter.text().replace(/,/, '.')) + value) / (this.animationDuration * 60 / 1000);
    if (Math.abs(this.stepsize) < 0.01) this.stepsize = (this.stepsize > 0 ? 1 : (-1)) * 0.01;
    this.currentValue = parseFloat(this.currentValue.toFixed(2)) + parseFloat(value.toFixed(2));
    if (!this.animationRunning) this.incrementCounter();
  }
  if (this.tradeAssist.cardInterfaces.length > 1) this.rebalance();
};

/**
 * Animations-Function für den Counter
 */
TradeAssistValueCounter.prototype.incrementCounter = function() {
  if (Math.abs(this.currentValue - parseFloat(this.counter.text().replace(/,/, '.'))) > Math.abs(this.stepsize)) {
    this.counter.text((parseFloat(this.counter.text().replace(/,/, '.')) + this.stepsize).toFixed(2).replace(/\./, ','));
    this.interval = window.setTimeout(this.incrementCounter.bind(this),17);
  } else {
    this.counter.text(this.currentValue.toFixed(2).replace(/\./, ','));
    this.interval = 0;
  }
};

/**
 * Setzt den Counter wieder auf 0
 */
TradeAssistValueCounter.prototype.reset = function() {
  this.add(this.currentValue * (-1));
};

/**
 * Passt die Schriftgröße / Farbe aller Counter an
 */
TradeAssistValueCounter.prototype.rebalance = function() {
  var max = null, min = null, factor = null;
  $.each(this.tradeAssist.cardInterfaces,function(index,element){
    var counter = element.counter;
    if(max === null) max = counter.currentValue;
    if(min === null) min = counter.currentValue;
    if(counter.currentValue<min) min = counter.currentValue;
    if(counter.currentValue>max) max = counter.currentValue;
  });
  if(min == 0) factor = 1;
  else factor = Math.abs(Math.min((max/min)-1,1));
  $.each(this.tradeAssist.cardInterfaces,function(index,element){
    var counter = element.counter;
    if(counter.currentValue>(max+min)/2) {
      counter.counter.stop().animate({
        'color':'rgb('+(255-Math.round(factor*255*(2*counter.currentValue-max-min)/(max-min)))+','+255+','+(255-Math.round(factor*255*(2*counter.currentValue-max-min)/(max-min)))+')',
        'font-size':Math.round(factor*this.fontGrowth*(2*counter.currentValue-max-min)/(max-min))+this.fontSize
      });
    } else if(counter.currentValue<(max+min)/2) {
      counter.counter.stop().animate({
        'color':'rgb('+255+','+(255-Math.round(factor*255*(max+min-2*counter.currentValue)/(max-min)))+','+(255-Math.round(factor*255*(max+min-2*counter.currentValue)/(max-min)))+')',
        'font-size':Math.round(factor*this.fontGrowth*(2*counter.currentValue-max-min)/(max-min))+this.fontSize
      });
    } else {
      counter.counter.stop().animate({
        'color':'rgb(255,255,255)',
        'font-size':this.fontSize
      });
    }
    counter.fireEvent("propose",[max-min,factor]);
  }.bind(this));
};

/**
 * TRUE wenn der aktuelle Counter den höchsten Wert hat
 * @return {Boolean}
 */
TradeAssistValueCounter.prototype.isMax= function() {
  var max = null;
  $.each(this.tradeAssist.cardInterfaces, function (index, element) {
    var counter = element.counter;
    if (max === null) max = counter.currentValue;
    if (counter.currentValue > max) max = counter.currentValue;
  });
  return this.currentValue == max;
};
