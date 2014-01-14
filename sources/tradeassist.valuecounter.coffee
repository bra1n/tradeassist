class TradeAssistValueCounter extends TradeAssistBase
  # Konstruktor für die Wertzähler-Klasse
  constructor: (counterElement, @tradeAssist) ->
    @counter = $(counterElement).text('0,00')
    @currentValue = 0
    @interval = 0
    @animationDuration = 500 # Millisekunden
    @fontGrowth = 10 # Schriftgroessenwachstum
    @fontSize = 30 # Schriftgroesse
    @frameRate = (1000/60) # wie oft der Counter pro Sekunde aktualisiert wird
    if @tradeAssist.isMobile
      @animationDuration = 200
      @frameRate = (1000/20)
    @events = {}

  # Zählt den Wertcounter um value Einheiten hoch/runter
  add: (value) ->
    value = parseFloat(value)
    unless value is 0
      @stepsize = (@currentValue - parseFloat(@counter.text().replace(/,/, '.')) + value) / (@animationDuration * 60 / 1000)
      @stepsize = (if @stepsize > 0 then 1 else -1) * 0.01 if Math.abs(@stepsize) < 0.01
      @currentValue = parseFloat(@currentValue.toFixed(2)) + parseFloat(value.toFixed(2))
      @incrementCounter() unless @interval
    @rebalance() if @tradeAssist.cardInterfaces.length > 1

  # Animations-Function für den Counter
  incrementCounter: ->
    if Math.abs(@currentValue - parseFloat(@counter.text().replace(/,/, '.'))) > Math.abs(@stepsize)
      @counter.text (parseFloat(@counter.text().replace(/,/, '.')) + @stepsize).toFixed(2).replace(/\./, ',')
      @interval = window.setTimeout @incrementCounter.bind(@), @frameRate
    else
      @counter.text @currentValue.toFixed(2).replace(/\./, ',')
      @interval = 0

  # Setzt den Counter wieder auf 0
  reset: -> @add @currentValue * -1

  # Passt die Schriftgröße / Farbe aller Counter an
  rebalance: ->
    min = null
    max = null
    $.each @tradeAssist.cardInterfaces, (index,element) =>
      counter = element.counter
      max = counter.currentValue unless max?
      min = counter.currentValue unless min?
      min = counter.currentValue if counter.currentValue < min
      max = counter.currentValue if counter.currentValue > max
    if min is 0 then factor = 1 else factor = Math.abs(Math.min((max/min)-1,1))
    $.each @tradeAssist.cardInterfaces, (index,element) =>
      counter = element.counter
      if counter.currentValue > (max+min)/2
        counter.counter.stop().animate
          color: 'rgb('+(255-Math.round(factor*255*(2*counter.currentValue-max-min)/(max-min)))+','+255+','+(255-Math.round(factor*255*(2*counter.currentValue-max-min)/(max-min)))+')'
          fontSize: Math.round(factor*@fontGrowth*(2*counter.currentValue-max-min)/(max-min))+@fontSize
      else if counter.currentValue < (max+min)/2
        counter.counter.stop().animate
          color: 'rgb('+255+','+(255-Math.round(factor*255*(max+min-2*counter.currentValue)/(max-min)))+','+(255-Math.round(factor*255*(max+min-2*counter.currentValue)/(max-min)))+')'
          fontSize: Math.round(factor*@fontGrowth*(2*counter.currentValue-max-min)/(max-min))+@fontSize
      else
        counter.counter.stop().animate
          color: 'rgb(255,255,255)'
          fontSize: @fontSize
      counter.fireEvent "propose", [max-min,factor]

  # TRUE wenn der aktuelle Counter den höchsten Wert hat
  isMax: ->
    max = null
    $.each @tradeAssist.cardInterfaces, (index, element) =>
      counter = element.counter
      max = counter.currentValue unless max?
      max = counter.currentValue if counter.currentValue > max
    @currentValue == max
