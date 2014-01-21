class TradeAssistCardList extends TradeAssistBase
  # Konstruktor für die Kartenlisten-Klasse
  constructor: (cardlistElement, @tradeAssist) ->
    @cards = []
    @events = {}
    self = @
    #todo put in template
    @sortElements = $ '<div class="sort"><div class="title">sort by</div></div>'
    @sortElements.prepend($('<div class="name active down">name</div>').on 'click', ->
      $(@).siblings('.active').removeClass('active').removeClass('down') unless $(@).is('.active')
      self.sort 'name', $(@).addClass('active').toggleClass('down').hasClass('down')
    )
    @sortElements.prepend($('<div class="rarity">rarity</div>').on 'click', ->
      $(@).siblings('.active').removeClass('active').removeClass('down') unless $(@).is('.active')
      self.sort 'rarity', $(@).addClass('active').toggleClass('down').hasClass('down')
    )
    @sortElements.prepend($('<div class="rate">price</div>').on 'click', ->
      $(@).siblings('.active').removeClass('active').removeClass('down') unless $(@).is('.active')
      self.sort 'rate', $(@).addClass('active').toggleClass('down').hasClass('down')
    )
    @sortElements.prepend $('<div class="reset">X</div>').on 'click', => @reset()
    @sortElements.prepend $('<div class="cards"><strong>0</strong> cards</div>')
    @cardlist = $ '<ul class="cardlist"></ul>'
    $(cardlistElement).append(@sortElements).append(@cardlist)

  # Nimmt eine Karte in die Liste auf
  addCard: (card) ->
    if card?
      cardContainer = @generateCardTemplate card
      @cardlist.append cardContainer
      @cards.push cardContainer.slideDown()
      card.removeEvents("valuechange").addEvent "valuechange", (value) => @handleValueChange(cardContainer, value)
      @sort @sortElements.find('.active').text(),@sortElements.find('.active').hasClass('down')
      @updateCounter()

  # Sortiert die Kartenliste nach field (name, edition, rarity, price) in der Reihenfolge order
  sort: (field,order) ->
    order = order and 1 or -1
    switch field
      when 'name' then sort = (a,b) ->
        return order if $(a).data('card').getName().toLowerCase() > $(b).data('card').getName().toLowerCase()
        return order*(-1)
      when 'edition' then sort = (a,b) ->
        return order if $(a).data('card').getEdition(false) > $(b).data('card').getEdition(false)
        return order*(-1)
      when 'rarity' then sort = (a,b) ->
        rarities = ['t','c','u','r','m','s']
        return order if rarities.indexOf($(a).data('card').getRarity()) < rarities.indexOf($(b).data('card').getRarity())
        return order*(-1)
      when 'rate', 'price' then sort = (a,b) ->
        return order if $(a).data('card').getRate() < $(b).data('card').getRate()
        return order*(-1)
      else sort = -> 0
    @cardlist.append(@cardlist.find('li.card').sort(sort)) if @cardlist.find('li.card').length > 0

  # Leert die Kartenliste
  reset: ->
    totalValue = 0
    for cardElement in @cards
      card = cardElement.data 'card'
      card.removeEvents 'valuechange'
      totalValue -= Math.max(0,card.getRate()) * card.getCount()
      cardElement.slideUp 200, -> $(@).remove()
    @fireEvent "valuechange", [totalValue]
    @cards = []
    @updateCounter()

  # Aktualisiert den Counter am oberen Rand der Kartenliste und blendet die Sortier-Header aus/ein
  updateCounter: ->
    counter = 0
    counter += card.data('card').getCount() for card in @cards
    @sortElements.find('.cards').html "<strong>"+counter+"</strong> card"+(if counter is 1 then "" else "s")
    @sortElements.slideDown() if counter
    @sortElements.slideUp() unless counter
    @

  # Gibt die Kartenliste als Objekt zurück
  exportToObject: ->
  	listExport = {cards:[]}
  	for card in @cards
  		listExport.cards.push
  			id:   card.data('card').getId()
  			count:card.data('card').getCount()
  			foil: card.data('card').getIsFoil()
  	listExport

  # Erzeugt aus einem Objekt eine Kartenliste
  importFromObject: (list) ->
    if list.cards
      @addCard new TradeAssistCard(card, @tradeAssist) for card in list.cards
      @sort @sortElements.find('.active').text(),@sortElements.find('.active').hasClass('down')

  # Setzt bei allen Karten den Minimum/Durchschnittspreis-Modus
  updatePrices: -> card.data('card').updateRate() for card in @cards

  # Generiert ein Karten-Template
  generateCardTemplate: (card) ->
    # todo make template
    self = @
    cardContainer  = $ '<li class="card"></li>'
    rightContainer = $ '<div class="right"></div>'
    rightContainer.append('<span class="count">'+card.getCount()+'x</span><span class="rate currency'+(if card.getIsFoil() then ' foil' else'')+'"></span>')
    rightContainer.append($('<button class="plus">+</button>').on 'click', -> card.setCount(card.getCount()+1))
    rightContainer.append('<img class="rarity '+card.getRarity()+'" src="'+@defaultImg+'" alt=""/><br/>')
    rightContainer.append($('<img class="edition" alt="'+card.getEdition(true)+'" title="'+card.getEdition(false)+'" src="'+card.getEditionImage()+'"/>').on 'click', ->
      #// ---- EDITIONS WÄHLER ---- //
      if card.getEditions().length > 1
        editionPicker = $ '<div class="editions"></div>'
        for edition in card.getEditions()
          editionPicker.prepend($('<img class="edition choice"/>').attr(
            alt:  edition.short
            src:  edition.src
            title:edition.long
          ).on 'click', ->
            editionPicker.remove()
            card.setEdition edition.short
            rightContainer.find('.edition').attr(
              alt:  card.getEdition(true)
              title:card.getEdition(false)
              src:  card.getEditionImage()
            ).show()
            rightContainer.find('.rarity').attr('class','rarity '+card.getRarity())
            cardContainer.find('.thumbnail').attr('src',card.getImage()).parent('a').attr('href',card.getMKMLink())
          )
        $(@).hide().after(editionPicker)
    .toggleClass 'multiple', (card.getEditions().length > 1))
    rightContainer.append $('<div class="checkbox foil" title="Normal / Foil"></div>').toggleClass('checked',card.getIsFoil()).on 'click', ->
      card.setIsFoil($(@).toggleClass('checked').hasClass('checked')) unless $(@).hasClass 'locked'
    rightContainer.append $('<button class="minus">&ndash;</button>').on 'click', -> card.setCount(card.getCount()-1)
    rightContainer.append '<img class="rarity '+card.getRarity()+'" src="'+@defaultImg+'"/>'
    cardContainer.append rightContainer
    cardContainer.append $('<a href="'+card.getMKMLink()+'" target="_blank"><img class="thumbnail" alt="'+card.getName()+'" title="'+card.getName()+'" src="'+card.getImage()+'"/></a>').on
      mouseenter: ->
        return if self.tradeAssist.isMobile
        el = $(@).find '.thumbnail'
        $('#fullcard').stop().remove()
        el.clone().attr('id','fullcard').css(el.offset()).css(
          left:   el.offset().left - 250
          top:    el.offset().top - 100
          display:'none'
        ).appendTo('body').fadeIn()
      mouseleave: -> $('#fullcard').stop().fadeOut 500, -> $(@).remove()
    cardContainer.append('<div class="name">'+card.getName("en")+'</div>').data 'card', card
    if card.getRate() >= 0
      @handleValueChange cardContainer, card.getRate()
    else
      rightContainer.find('span.rate').addClass 'loader'
    cardContainer

  # Handhabt die Wertveränderung einer Karte
  handleValueChange: (cardContainer,value) ->
    card = cardContainer.data('card')
    if card.getCount() is 0
      # Karte rauswerfen
      for thatCard, index in @cards when thatCard is cardContainer
        @cards.splice index, 1
      cardContainer.slideUp 500, -> $(@).remove()
    else
      # Wert
      if card.getRate() < 0
        cardContainer.find('span.rate').addClass('loader').text("").attr 'title', card.getRateTimestamp()
      else
        cardContainer.find('span.rate').removeClass('loader').text(card.getRate().toFixed(2).replace(/\./,',')).attr('title',card.getRateTimestamp())
      cardContainer.find('span.rate').toggleClass('foil',card.getIsFoil())
      cardContainer.find('span.count').text(card.getCount()+"x")
      switch card.getSpecial()
        when "onlyfoil"
          cardContainer.find('.name').addClass('foil')
          cardContainer.find('.checkbox.foil').addClass('checked locked').attr('title','')
        when "nofoil"
          cardContainer.find('.name').removeClass('foil')
          cardContainer.find('.checkbox.foil').addClass('locked').removeClass('checked')
        else
          cardContainer.find('.name').toggleClass('foil',card.getIsFoil())
          cardContainer.find('.checkbox.foil').removeClass('locked').toggleClass('checked',card.getIsFoil())
    @updateCounter()
    @sort 'rate', @sortElements.find('.active').hasClass('down') if @sortElements.find('.active').text() is "price"
    @fireEvent "valuechange", [value]
