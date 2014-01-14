class TradeAssistSuggestions extends TradeAssistBase
  # Konstruktor für die Suggestions-Klasse */
  constructor: (inputElement, @tradeAssist) ->
	  @inputElement = $(inputElement)
	  @container = $('<ul class="suggestions"></ul>')
	  @events = {}

 # AJAX Request ausführen für einen Suchbegriff
  suggest: (name) ->
    if name isnt ""
      @xhr?.abort() if @xhr?.readyState isnt 4
      @xhr = $.getJSON @url, {action:'suggest', arg:name},(response) =>
        if name is @lastSuggest #aktueller Request
          if response?.cards.length > 0
            @show new TradeAssistCard(response.cards, @tradeAssist)
          else
            @hide()
      @lastSuggest = name
    else
      @hide()

  # Suggestions anzeigen
  show: (cards) ->
    if cards
      @container.empty()
      $.each cards, (index, card) =>
        line = $('<li class="suggestion'+(if index then '' else ' active')+'"></li>').data('card',card)
        realname = ""
        displayname = ""
        searchPattern = @escapeRegExp(@lastSuggest)
        if !@lastSuggest or new RegExp(searchPattern,"i").test(card.getName())
          displayname = card.getName().replace(new RegExp("("+searchPattern+")","i"),'<em>$1</em>')
        else
          displayname = card.getName('de').replace(new RegExp("("+searchPattern+")","i"),'<em>$1</em>')
          realname = card.getName()
        line.append $("<span class='name'>#{displayname}</span>")
        line.append $("<span class='name_real'>(#{realname})</span>") if realname isnt ""
        line.append $("<img class='thumbnail'/>").attr
          src: card.getImage()
          title: card.getName()
          alt: card.getName()
        line.prepend $("<img class='edition'/>").attr
          src: card.getEditionImage()
          title: card.getEdition()
          alt: card.getEdition(yes)
        if card.getEditions().length > 1
          line.prepend $('<div class="arrow left">&larr;</div>').on 'click',(e) =>
            e.stopPropagation()
            @left(line)
          line.prepend $('<div class="arrow right">&rarr;</div>').on 'click',(e) =>
            e.stopPropagation()
            @right(line)
        line.on
          click: => @fireEvent 'click', [card]
          mouseenter: =>
            if !line.is('.active')
              $('li.active',@container).removeClass('active')
              line.addClass('active')
        @container.append line
    if !@isUp() and $('li.suggestion',@container).length
      @inputElement.parent('.input').after @container
      # scroll down if the suggestions would be outside of the current window
      w = $(window)
      if w.height() + w.scrollTop() < @container.offset().top + @container.outerHeight()
        $('body').animate({scrollTop: @inputElement.offset().top })

  # Entfernt die Suggestions aus dem DOM-Tree
  hide: -> @inputElement.parent('.input').next('.suggestions').detach() if @isUp()

  # TRUE wenn die Suggestions gerade sichtbar sind
  isUp: -> @inputElement.parent('.input').next('.suggestions').length > 0

  # Führt einen Click auf die ausgewählte Suggestion aus
  fire: ->
    @hide()
    $('li.active',@container).trigger('click')

  # Bewegt die Auswahl nach unten
  down: ->
    if @isUp()
      return if $('li.suggestion',@container).length <= 1
      current = $('li.active',@container).removeClass('active')
      if current.next('li.suggestion').addClass('active').length is 0
        $('li.suggestion:first',@container).addClass('active')
    else @show()

  # Bewegt die Auswahl nach oben
  up: ->
    if @isUp()
      return if $('li.suggestion',@container).length <= 1
      current = $('li.active',@container).removeClass('active')
      if current.prev('li.suggestion').addClass('active').length is 0
        $('li.suggestion:last',@container).addClass('active')
    else @show()

  # Ändert die ausgewählte Edition einer Suggestion
  changeEdition: (line, right) ->
    if @isUp()
      line = $('li.active',@container) unless line?
      card = line.data('card')
      if card.getEditions().length > 1
        card.setEdition(right)
        $('.thumbnail',line).attr 'src', card.getImage() unless @tradeAssist.isMobile
        $('.edition',line).attr
          alt: card.getEdition(true)
          title: card.getEdition()
          src: card.getEditionImage()

  # Eine Edition nach links
  left: (line) -> @changeEdition line, false

  # Eine Edition nach rechts
  right: (line) -> @changeEdition line, true

	# Credit: XRegExp 0.6.1 (c) 2007-2008 Steven Levithan <http://stevenlevithan.com/regex/xregexp/> MIT License
  escapeRegExp: (string) -> string.replace /[-[\]{}()*+?.\\^$|,#\s]/g, (match) -> '\\' + match