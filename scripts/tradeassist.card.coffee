class TradeAssistCard extends TradeAssistBase
  isMinimum: false
  # Konstruktor für die Erzeugung von Card-Objekten aus JSON-Objekten
  constructor: (objects) ->
    if $.isArray(objects)
      $.each objects, (index,object) => objects[index] = new TradeAssistCard(object)
      return objects
    else
      @name =
        en: objects["name"] or ""
        de: objects["name_de"] or ""
      @printings = objects.printings
      @rates =
        normal:   objects["rate"] or -1
        foil:     objects["rate_foil"] or -1
        min:      objects["minprice"] or -1
        min_foil: objects["minprice_foil"] or -1
        date:     ""
        special:  ""
      @count = objects.count or 1
      @isFoil = objects.foil or false
      @events = {}
      return @

  # Gibt den Namen in der ausgewählten Sprache zurück (momentan nur "en" und "de")
  getName: (language = "en") -> @name[language]

  # Gibt die ID der Karte zurück
  getId: -> @printings[0]["id"]

  # Gibt die Rarität der Karte zurück
  getRarity: -> @printings[0]["rarity"]

  # Gibt die Anzahl dieser Karte zurück
  getCount: -> @count

  # Setzt die Anzahl der Karte und löst ggf. ein Update aus
  setCount: (count) ->
    count = Math.max 0, count
    if count isnt @count
      diff = count - @count
      @count = count
      if @getRate() >= 0 then @fireEvent "valuechange", [diff*@getRate()]
      else if count is 0 then @fireEvent "valuechange", [0]

  getIsFoil: -> @isFoil

  setIsFoil: (isFoil) ->
    if isFoil isnt @isFoil
      oldRate = @getRate()
      @isFoil = isFoil
      @fireEvent "valuechange", [@getCount()*(@getRate()-oldRate)] if oldRate >= 0 and @getRate() >= 0

  getIsMinimum: -> @isMinimum

  setIsMinimum: (isMinimum) ->
    if isMinimum != @isMinimum
      oldRate = @getRate()
      @isMinimum = isMinimum
      @fireEvent "valuechange", [@getCount()*(@getRate()-oldRate)] if oldRate >= 0 and @getRate() >= 0

  getSpecial: -> @rates.special

  # Gibt die Bild-URL der Karte zurück
  getImage: ->
    imgUrl = @defaultImg
    if @printings[0]["img"] is "" #reguläre karte
      imgUrl = @regularImageUrl+'type=card&size=small&set='
      imgUrl+= @getEdition(true)+'&name='
      imgUrl+= encodeURIComponent @getName().replace(RegExp(' \\(.*?\\)','g'),'')
    else
      imgUrl = @customImageUrl+@printings[0]["img"]
    imgUrl

  # Gibt das aktuelle Editions-Kürzel der Karte zurück
  getEdition: (isShort = false) -> if isShort then @printings[0]["ed"] else @printings[0]["edition"]

  # Gibt die Icon-URL für die aktuelle Edition der Karte zurück
  getEditionImage: (edition = false) -> 'images/editions/'+(edition or @getEdition(true))+'.png'

  # Gibt alle Editionen einer Karte zurück.
  getEditions: ->
    editions = []
    $.each @printings, (index,edition) =>
      editions.push
        short: edition["ed"]
        long:  edition["edition"]
        src:   @getEditionImage edition["ed"]
    editions

  # Ändert die Edition der Karte, entweder um eine Edition nach links/rechts, oder auf die übergebene Edition
  setEdition: (edition) ->
    oldRate = 0
    if @rates.date isnt "" # Karte hat für die alte Edition schon Werte
      @printings[0].rates = @rates
      oldRate = @getRate()
    if typeof edition isnt "string" # durch die Editionen cyclen, entweder nach rechts, oder nach links
      if !edition
        @printings.unshift @printings.pop()
      else
        @printings.push @printings.shift()
    else # die übergebene Edition suchen und auswählen
      $.each @printings, (index,printing) =>
        if printing["ed"] is edition
          @printings.unshift @printings.splice(index,1)[0]
          false
    if @printings[0].rates? # neue Edition hat schon Werte
      @rates = @printings[0].rates
      @isFoil = no if @rates.special is "nofoil"
      @isFoil = on if @rates.special is "onlyfoil"
      @fireEvent "valuechange", [@getCount()*(@getRate()-oldRate)] if @getRate() >= 0
    else # neue Edition ohne Werte, also Standard nehmen
      @rates = { normal: -1, foil: -1, min: -1, min_foil: -1, date: "", special: "" }
      @fireEvent "valuechange", [@getCount()*(-oldRate)]

  # Gibt den aktuellen Wert einer Karte mit allen Modifikatoren zurück, oder einen leeren String.
  getRate: ->
    if @rates.date is ""
      if @rates.special isnt @getId()
        id = @getId()
        @rates.special = id
        $.getJSON @url, {action:'value',arg:id}, (response) =>
          if !response.error and @getId() is id
            @rates.normal = parseFloat response["rate"]
            @rates.foil = parseFloat response["rate_foil"]
            @rates.min = parseFloat response["minprice"]
            @rates.min_foil = parseFloat(response["minprice_foil"])
            @rates.date = response["timestamp"]
            if @rates.foil > 0 and @rates.normal is 0
              @rates.special = "onlyfoil"
              @isFoil = true
            else if @rates.foil is 0
              @rates.special = "nofoil"
              @isFoil = false
            else
              @rates.special = ""
            @fireEvent "valuechange", [@getRate()*@getCount()]
      return -1
    else if @getIsFoil()
      return if @getIsMinimum() then @rates.min_foil else @rates.foil
    else
      return if @getIsMinimum() then @rates.min else @rates.normal

  # Gibt das Datum der letzten Wertermittlung zurück
  getRateTimestamp: -> @rates.date or null

  # Gibt den Link zur Karte auf MKM zurück
  getMKMLink: -> "http://www.magiccardmarket.eu/CardPage.c1p#{@getId()}.prod?referrer=bra1n"

  # Erzeugt eine Kopie der Karte und gibt sie zurück
  clone: ->
    clone = new TradeAssistCard {}
    cloneFields = ["name","printings","rates","count","isFoil","isMinimum"]
    clone[field] = @[field] for field in cloneFields
    clone

# hack until it is all one big coffee file
window.TradeAssistCard = TradeAssistCard