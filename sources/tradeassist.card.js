// Generated by CoffeeScript 1.6.3
var TradeAssistCard,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

TradeAssistCard = (function(_super) {
  __extends(TradeAssistCard, _super);

  TradeAssistCard.prototype.isMinimum = false;

  function TradeAssistCard(objects) {
    var _this = this;
    if ($.isArray(objects)) {
      $.each(objects, function(index, object) {
        return objects[index] = new TradeAssistCard(object);
      });
      return objects;
    } else {
      this.name = {
        en: objects["name"] || "",
        de: objects["name_de"] || ""
      };
      this.printings = objects.printings;
      this.rates = {
        normal: objects["rate"] || -1,
        foil: objects["rate_foil"] || -1,
        min: objects["minprice"] || -1,
        min_foil: objects["minprice_foil"] || -1,
        date: "",
        special: ""
      };
      this.count = objects.count || 1;
      this.isFoil = objects.foil || false;
      this.events = {};
      return this;
    }
  }

  TradeAssistCard.prototype.getName = function(language) {
    if (language == null) {
      language = "en";
    }
    return this.name[language];
  };

  TradeAssistCard.prototype.getId = function() {
    return this.printings[0]["id"];
  };

  TradeAssistCard.prototype.getRarity = function() {
    return this.printings[0]["rarity"];
  };

  TradeAssistCard.prototype.getCount = function() {
    return this.count;
  };

  TradeAssistCard.prototype.setCount = function(count) {
    var diff;
    count = Math.max(0, count);
    if (count !== this.count) {
      diff = count - this.count;
      this.count = count;
      if (this.getRate() >= 0) {
        return this.fireEvent("valuechange", [diff * this.getRate()]);
      } else if (count === 0) {
        return this.fireEvent("valuechange", [0]);
      }
    }
  };

  TradeAssistCard.prototype.getIsFoil = function() {
    return this.isFoil;
  };

  TradeAssistCard.prototype.setIsFoil = function(isFoil) {
    var oldRate;
    if (isFoil !== this.isFoil) {
      oldRate = this.getRate();
      this.isFoil = isFoil;
      if (oldRate >= 0 && this.getRate() >= 0) {
        return this.fireEvent("valuechange", [this.getCount() * (this.getRate() - oldRate)]);
      }
    }
  };

  TradeAssistCard.prototype.getIsMinimum = function() {
    return this.isMinimum;
  };

  TradeAssistCard.prototype.setIsMinimum = function(isMinimum) {
    var oldRate;
    if (isMinimum !== this.isMinimum) {
      oldRate = this.getRate();
      this.isMinimum = isMinimum;
      if (oldRate >= 0 && this.getRate() >= 0) {
        return this.fireEvent("valuechange", [this.getCount() * (this.getRate() - oldRate)]);
      }
    }
  };

  TradeAssistCard.prototype.getSpecial = function() {
    return this.rates.special;
  };

  TradeAssistCard.prototype.getImage = function() {
    var imgUrl;
    imgUrl = this.defaultImg;
    if (this.printings[0]["img"] === "") {
      imgUrl = this.regularImageUrl + 'type=card&size=small&set=';
      imgUrl += this.getEdition(true) + '&name=';
      imgUrl += encodeURIComponent(this.getName().replace(RegExp(' \\(.*?\\)', 'g'), ''));
    } else {
      imgUrl = this.customImageUrl + this.printings[0]["img"];
    }
    return imgUrl;
  };

  TradeAssistCard.prototype.getEdition = function(isShort) {
    if (isShort == null) {
      isShort = false;
    }
    if (isShort) {
      return this.printings[0]["ed"];
    } else {
      return this.printings[0]["edition"];
    }
  };

  TradeAssistCard.prototype.getEditionImage = function(edition) {
    if (edition == null) {
      edition = false;
    }
    return 'images/editions/' + (edition || this.getEdition(true)) + '.png';
  };

  TradeAssistCard.prototype.getEditions = function() {
    var editions,
      _this = this;
    editions = [];
    $.each(this.printings, function(index, edition) {
      return editions.push({
        short: edition["ed"],
        long: edition["edition"],
        src: _this.getEditionImage(edition["ed"])
      });
    });
    return editions;
  };

  TradeAssistCard.prototype.setEdition = function(edition) {
    var oldRate,
      _this = this;
    oldRate = 0;
    if (this.rates.date !== "") {
      this.printings[0].rates = this.rates;
      oldRate = this.getRate();
    }
    if (typeof edition !== "string") {
      if (!edition) {
        this.printings.unshift(this.printings.pop());
      } else {
        this.printings.push(this.printings.shift());
      }
    } else {
      $.each(this.printings, function(index, printing) {
        if (printing["ed"] === edition) {
          _this.printings.unshift(_this.printings.splice(index, 1)[0]);
          return false;
        }
      });
    }
    if (this.printings[0].rates != null) {
      this.rates = this.printings[0].rates;
      if (this.rates.special === "nofoil") {
        this.isFoil = false;
      }
      if (this.rates.special === "onlyfoil") {
        this.isFoil = true;
      }
      if (this.getRate() >= 0) {
        return this.fireEvent("valuechange", [this.getCount() * (this.getRate() - oldRate)]);
      }
    } else {
      this.rates = {
        normal: -1,
        foil: -1,
        min: -1,
        min_foil: -1,
        date: "",
        special: ""
      };
      return this.fireEvent("valuechange", [this.getCount() * (-oldRate)]);
    }
  };

  TradeAssistCard.prototype.getRate = function() {
    var id,
      _this = this;
    if (this.rates.date === "") {
      if (this.rates.special !== this.getId()) {
        id = this.getId();
        this.rates.special = id;
        $.getJSON(this.url, {
          action: 'value',
          arg: id
        }, function(response) {
          if (!response.error && _this.getId() === id) {
            _this.rates.normal = parseFloat(response["rate"]);
            _this.rates.foil = parseFloat(response["rate_foil"]);
            _this.rates.min = parseFloat(response["minprice"]);
            _this.rates.min_foil = parseFloat(response["minprice_foil"]);
            _this.rates.date = response["timestamp"];
            if (_this.rates.foil > 0 && _this.rates.normal === 0) {
              _this.rates.special = "onlyfoil";
              _this.isFoil = true;
            } else if (_this.rates.foil === 0) {
              _this.rates.special = "nofoil";
              _this.isFoil = false;
            } else {
              _this.rates.special = "";
            }
            return _this.fireEvent("valuechange", [_this.getRate() * _this.getCount()]);
          }
        });
      }
      return -1;
    } else if (this.getIsFoil()) {
      if (this.getIsMinimum()) {
        return this.rates.min_foil;
      } else {
        return this.rates.foil;
      }
    } else {
      if (this.getIsMinimum()) {
        return this.rates.min;
      } else {
        return this.rates.normal;
      }
    }
  };

  TradeAssistCard.prototype.getRateTimestamp = function() {
    return this.rates.date || null;
  };

  TradeAssistCard.prototype.getMKMLink = function() {
    return "http://www.magiccardmarket.eu/CardPage.c1p" + (this.getId()) + ".prod?referrer=bra1n";
  };

  TradeAssistCard.prototype.clone = function() {
    var clone, cloneFields, field, _i, _len;
    clone = new TradeAssistCard({});
    cloneFields = ["name", "printings", "rates", "count", "isFoil", "isMinimum"];
    for (_i = 0, _len = cloneFields.length; _i < _len; _i++) {
      field = cloneFields[_i];
      clone[field] = this[field];
    }
    return clone;
  };

  return TradeAssistCard;

})(TradeAssistBase);

/*
//@ sourceMappingURL=tradeassist.card.map
*/