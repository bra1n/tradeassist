class TradeAssistCardInterface extends TradeAssistBase
  # Konstruktor für die Karteninterface-Klasse
  constructor: (sideContainer, @tradeAssist) ->
    @sideContainer = $(sideContainer)
    # Internal Vars
    @input = @sideContainer.find('.input_cardname')
    @difference = @sideContainer.find('.difference')
    @lastSuggest = ""

    @counter = new TradeAssistValueCounter @sideContainer.find('.currentvalue'), @tradeAssist
    @counter.addEvent 'difference',(value,factor) =>
      window.clearTimeout(@differenceTimer) if @differenceTimer
      @differenceTimer = window.setTimeout (=> @updateDifference value, factor), 250
    if @tradeAssist.isMobile
      # hide controlpanel on suggestion focus
      @input.on 'focus', => $('#controlpanel').hide()
      @input.on 'blur', => $('#controlpanel').show()

    @cardlist = new TradeAssistCardList @sideContainer.find('.cardlist_container'), @tradeAssist
    @cardlist.addEvent 'valuechange', (value) => @counter.add value

    @suggestions = new TradeAssistSuggestions @input, @tradeAssist
    @suggestions.addEvent 'click', (card) =>
      @cardlist.addCard card.clone()
      @suggestions.hide()
      @input.val('').focus() unless @tradeAssist.isMobile
      @lastSuggest = ''

    # Option Binds
    @input.on
      keyup: (e) => @inputKeyEvent e.which

  # Löst bei Tastatur-Eingabe die entsprechende Suggestion-Funktion aus
  inputKeyEvent: (key) ->
    switch key
      when 13 #enter
        if @suggestions.isUp()
          @suggestions.fire()
          @input.val('')
          @lastSuggest = ''
        else if @input.val() isnt ""
          @lastSuggest = @input.val()
          @suggestions.suggest @input.val()
      when 37 then @suggestions.left()
      when 38 then @suggestions.up()
      when 39 then @suggestions.right()
      when 40 then @suggestions.down()
      else
        window.clearTimeout(@suggestTimer) if @suggestTimer
        @suggestTimer = window.setTimeout =>
          if @input.val() isnt @lastSuggest
            @lastSuggest = @input.val()
            @suggestions.suggest(@lastSuggest)
          else if !@suggestions.isUp()
            @suggestions.show()
        , 250

  # Schlägt eine Karte mit dem Wert value vor, wenn der factor (Anteil von value am Gesamt-Tauschwert) über 0.05 liegt
  updateDifference: (value,factor) ->
    if Math.abs(0.5-factor)>0.05 and !@counter.isMax() and value > 0
      # there's at least 5% difference
      excludedIds = []
      for side in @tradeAssist.cardInterfaces when side.counter.isMax()
        excludedIds.push card.id for card in side.cardlist.exportToObject().cards
      @difference.addClass('show').find('span').text value.toFixed(2).replace(/\./,',')
      @difference.find('.slider').css 'width', 100-(factor*100)+"%"
      propose = @difference.find('.propose').off 'click'
      # let's see if we have a card with that value
      @xhr.abort() if @xhr? and @xhr.readyState != 4
      @xhr = $.getJSON @url,
        action: 'propose'
        arg: parseFloat(value).toFixed(2)
        exclude: excludedIds.join(',')
        minprice: @tradeAssist.isMinimum
        region: @tradeAssist.region
      , (response) =>
        if response
          # we have a proposed card
          card = new TradeAssistCard response, @tradeAssist
          propose.find('a').text card.getName() + " ("+card.getEdition(yes)+")"
          propose.on 'click','a', =>
            if @tradeAssist.isMobile # show the list that we add the card to
              @sideContainer.removeClass('inactive').siblings('div').addClass('inactive')
            @cardlist.addCard card
            propose.off('click')
            false
          propose.show()
        else
          propose.hide()
    else
      # less than 5% difference or non-max counter
      @xhr?.abort()
      @difference.removeClass('show').find('.propose').off 'click'
