$(document).ready ->
  ta = new TradeAssist()
  ta.addCardInterface $('#left')
  ta.addCardInterface $('#right')

# Base-Klasse mit Utility-Functions
class TradeAssistBase
  defaultImg:       'images/spacer.gif'
  regularImageUrl:  'http://gatherer.wizards.com/Handlers/Image.ashx?'
  #customImageUrl:  'http://magickartenmarkt.de/img/cards/'
  customImageUrl:   'http://tcgimages.eu/img/cards/'
  url:              'bridge.php'
  events:           {}
  test:             ''
  # Fügt einen Event-Listener hinzu
  addEvent: (type, fn) ->
    if type? and fn?
      @events[type] = @events[type] || []
      @events[type].push fn
    @
  # Entfernt alle Event-Listener eines Typs
  removeEvents: (type) ->
    @events[type] = []
    @
  # Triggert alle für ein Event registrierten Functions
  fireEvent: (type, args) ->
    if @events[type]?
      # todo replace each with native iterators
      $.each @events[type], (key,fn) => fn.apply(@, args)
    @


class TradeAssist extends TradeAssistBase
  cardInterfaces: []
  requestRunning: false
  isMobile: false

  # load list if there is a hash
  # bind control icons and popup events
  constructor: ->
    @loadLists window.location.hash.substr(1) if window.location.hash isnt ""
    # bind hooks
    if $('#controlicons').length
      $('#controlicons .save').on 'click', => @saveLists()
      $('#controlicons .price').on 'click', => @togglePrices()
    # toggle left / right for mobile
    $('#container > div').on 'click', '.counter', ->
      $(@).closest('.inactive').removeClass('inactive').siblings('div').addClass('inactive')
    # hide popups on click
    @popup = $('#popup').on('click','.window', -> $(@).stop().fadeOut -> $(@).remove()).find '.window'
    @isMobile = $('#left').css('display') is 'block'

  # registers a cardInterface to the base class
  # and passes a reference to itself
  addCardInterface: (side) -> @cardInterfaces.push new TradeAssistCardInterface(side,@)

  # stores the cardlists in the database
  saveLists: ->
    listExport = [];
    $.each @cardInterfaces, (index,element) ->
      listExport[index] = element.cardlist.exportToObject()
    unless @requestRunning
      @requestRunning = true
      $.post @url, {action:'export',arg:JSON.stringify(listExport)}, (response) =>
        if response
          window.location.hash = response
          url = window.location.toString();
          @showPopup "List saved",'List has been saved and can be shared with this URL:<br/><a href="'+url+'">'+url+'</a>'
        @requestRunning = false

  # retrieves cardlists from the server
  # and passes them to the cardInterfaces
  loadLists: (id) ->
    unless @requestRunning
      @requestRunning = true
      $.getJSON @url, {action:'import', arg:id}, (response) =>
        if response?
          $.each response, (index,list) => @cardInterfaces[index]?.cardlist.reset().importFromObject(list)
        @requestRunning = false

  # switch between average and min prices
  togglePrices: ->
    isMinimum = TradeAssistCard.prototype.isMinimum = !TradeAssistCard.prototype.isMinimum;
    $('#controlicons .price')
      .text(if isMinimum then "Use Average Prices" else "Use Minimum Prices")
      .toggleClass "min", !isMinimum
    $.each @cardInterfaces, (index,element) -> element.cardlist.togglePrices isMinimum
    @showPopup "Switched Prices", "The cards are now compared by <em>#{if isMinimum then "minimum" else "average"} prices</em>"

  # shows a popup with title and text body
  showPopup: (title, body) ->
    @popup.clone()
      .find('h1').text(title).end()
      .find('p').html(body).end()
      .appendTo('#popup').slideDown().delay(2500).fadeOut -> $(@).remove()

# hack while migrating to coffee
window.TradeAssistBase = TradeAssistBase
window.TradeAssist = TradeAssist