class TradeAssistCardInterface extends TradeAssistBase
  # Konstruktor für die Karteninterface-Klasse
  constructor: (sideContainer, @tradeAssist) ->
    sideContainer = $(sideContainer)
    # Internal Vars
    @input = sideContainer.find('.input_cardname')
    @propose = sideContainer.find('.propose')
    @lastSuggest = ""

    @counter = new TradeAssistValueCounter sideContainer.find('.currentvalue'), @tradeAssist
    unless @tradeAssist.isMobile
      @counter.addEvent 'propose',(value,factor) =>
        window.clearTimeout(@proposeTimer) if @proposeTimer
        @proposeTimer = window.setTimeout (=> @proposeCard value, factor), 250

    @cardlist = new TradeAssistCardList sideContainer.find('.cardlist_container'), @tradeAssist
    @cardlist.addEvent 'valuechange', (value) => @counter.add value

    @suggestions = new TradeAssistSuggestions @input, @tradeAssist
    @suggestions.addEvent 'click', (card) =>
      @cardlist.addCard card.clone()
      @suggestions.hide()
      @input.val('').focus()
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
  proposeCard: (value,factor) ->
    if factor>0.05 and !@counter.isMax() and value > 0
      # there's at least 5% difference
      excludedIds = []
      $.each @tradeAssist.cardInterfaces, (index,side) =>
        if side.counter.isMax()
          $.each side.cardlist.exportToObject().cards, (index,card) => excludedIds.push(card.id)

      @xhr.abort() if @xhr? and @xhr.readyState != 4
      @xhr = $.getJSON @url,
        action: 'propose'
        arg: parseFloat(value).toFixed(2)
        exclude: excludedIds.join(',')
        minprice: TradeAssistCard.prototype.isMinimum
      , (response) =>
        if response
          # we have a proposed card
          card = new TradeAssistCard response
          @propose.off('click').empty()
          # thumbnail handling
          @propose.append $('<img class="thumbnail" src="'+card.getImage()+'" alt="" title="'+card.getName()+'"/>').on
            mouseenter: ->
              el = $(@)
              return if !el.closest('.propose').hasClass('show')
              $('#fullcard').stop().remove()
              el.clone().attr('id','fullcard').css(el.offset()).css
                left: el.offset().left - 245
                top: el.offset().top - 20
                display: 'none'
              .appendTo('body').fadeIn()
            mouseleave: -> $('#fullcard').stop().fadeOut 500, -> $(@).remove()
          @propose.append "<img class='rarity #{card.getRarity()}' src='"+@defaultImg+"' alt=''/>"
          @propose.append "<img class='edition' src='"+card.getEditionImage()+"' alt='#{card.getEdition(true)}' title='#{card.getEdition(false)}'/>"
          @propose.append "<div class='name'>#{card.getName('en')}</div>"
          @propose.on 'click',=>
            @cardlist.addCard card
            @propose.off('click').removeClass 'show'
          @propose.addClass 'show'
        else
          # no card proposed :(
          @propose.off('click').removeClass 'show'
    else
      # less than 5% difference
      @xhr?.abort()
      @propose.off('click').removeClass 'show'
