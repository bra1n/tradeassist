(function(){var t,e,i,s,n,r,a,o={}.hasOwnProperty,c=function(t,e){function i(){this.constructor=t}for(var s in e)o.call(e,s)&&(t[s]=e[s]);return i.prototype=e.prototype,t.prototype=new i,t.__super__=e.prototype,t};$(document).ready(function(){var e;return e=new t,e.addCardInterface($("#left")),e.addCardInterface($("#right"))}),e=function(){function t(){}return t.prototype.defaultImg="images/spacer.gif",t.prototype.regularImageUrl="http://gatherer.wizards.com/Handlers/Image.ashx?",t.prototype.customImageUrl="http://tcgimages.eu/img/cards/",t.prototype.url="bridge.php",t.prototype.events={},t.prototype.test="",t.prototype.addEvent=function(t,e){return null!=t&&null!=e&&(this.events[t]=this.events[t]||[],this.events[t].push(e)),this},t.prototype.removeEvents=function(t){return this.events[t]=[],this},t.prototype.fireEvent=function(t,e){var i=this;return null!=this.events[t]&&$.each(this.events[t],function(t,s){return s.apply(i,e)}),this},t}(),t=function(t){function e(){var t=this;""!==window.location.hash&&this.loadLists(window.location.hash.substr(1)),$("#controlicons").length&&($("#controlicons .save").on("click",function(){return t.saveLists()}),$("#controlicons .price").on("click",function(){return t.togglePrices()})),$("#container > div").on("click",".counter",function(){return $(this).closest(".inactive").removeClass("inactive").siblings("div").addClass("inactive")}),this.popup=$("#popup").on("click",".window",function(){return $(this).stop().fadeOut(function(){return $(this).remove()})}).find(".window"),this.isMobile="block"===$("#left").css("display")}return c(e,t),e.prototype.cardInterfaces=[],e.prototype.requestRunning=!1,e.prototype.isMobile=!1,e.prototype.addCardInterface=function(t){return this.cardInterfaces.push(new s(t,this))},e.prototype.saveLists=function(){var t,e=this;return t=[],$.each(this.cardInterfaces,function(e,i){return t[e]=i.cardlist.exportToObject()}),this.requestRunning?void 0:(this.requestRunning=!0,$.post(this.url,{action:"export",arg:JSON.stringify(t)},function(t){var i;return t&&(window.location.hash=t,i=window.location.toString(),e.showPopup("List saved",'List has been saved and can be shared with this URL:<br/><a href="'+i+'">'+i+"</a>")),e.requestRunning=!1}))},e.prototype.loadLists=function(t){var e=this;return this.requestRunning?void 0:(this.requestRunning=!0,$.getJSON(this.url,{action:"import",arg:t},function(t){return null!=t&&$.each(t,function(t,i){var s;return null!=(s=e.cardInterfaces[t])?s.cardlist.reset().importFromObject(i):void 0}),e.requestRunning=!1}))},e.prototype.togglePrices=function(){var t;return t=i.prototype.isMinimum=!i.prototype.isMinimum,$("#controlicons .price").text(t?"Use Average Prices":"Use Minimum Prices").toggleClass("min",!t),$.each(this.cardInterfaces,function(e,i){return i.cardlist.togglePrices(t)}),this.showPopup("Switched Prices","The cards are now compared by <em>"+(t?"minimum":"average")+" prices</em>")},e.prototype.showPopup=function(t,e){return this.popup.clone().find("h1").text(t).end().find("p").html(e).end().appendTo("#popup").slideDown().delay(2500).fadeOut(function(){return $(this).remove()})},e}(e),i=function(t){function e(t){return $.isArray(t)?($.each(t,function(i,s){return t[i]=new e(s)}),t):(this.name={en:t.name||"",de:t.name_de||""},this.printings=t.printings,this.rates={normal:t.rate||-1,foil:t.rate_foil||-1,min:t.minprice||-1,min_foil:t.minprice_foil||-1,date:"",special:""},this.count=t.count||1,this.isFoil=t.foil||!1,this.events={},this.isMinimum=e.prototype.isMinimum,this)}return c(e,t),e.prototype.isMinimum=!1,e.prototype.getName=function(t){return null==t&&(t="en"),this.name[t]},e.prototype.getId=function(){return this.printings[0].id},e.prototype.getRarity=function(){return this.printings[0].rarity},e.prototype.getCount=function(){return this.count},e.prototype.setCount=function(t){var e;if(t=Math.max(0,t),t!==this.count){if(e=t-this.count,this.count=t,this.getRate()>=0)return this.fireEvent("valuechange",[e*this.getRate()]);if(0===t)return this.fireEvent("valuechange",[0])}},e.prototype.getIsFoil=function(){return this.isFoil},e.prototype.setIsFoil=function(t){var e;return t!==this.isFoil&&(e=this.getRate(),this.isFoil=t,e>=0&&this.getRate()>=0)?this.fireEvent("valuechange",[this.getCount()*(this.getRate()-e)]):void 0},e.prototype.getIsMinimum=function(){return this.isMinimum},e.prototype.setIsMinimum=function(t){var e;return t!==this.isMinimum&&(e=this.getRate(),this.isMinimum=t,e>=0&&this.getRate()>=0)?this.fireEvent("valuechange",[this.getCount()*(this.getRate()-e)]):void 0},e.prototype.getSpecial=function(){return this.rates.special},e.prototype.getImage=function(){var t;return t=this.defaultImg,""===this.printings[0].img?(t=this.regularImageUrl+"type=card&size=small&set=",t+=this.getEdition(!0)+"&name=",t+=encodeURIComponent(this.getName().replace(RegExp(" \\(.*?\\)","g"),""))):t=this.customImageUrl+this.printings[0].img,t},e.prototype.getEdition=function(t){return null==t&&(t=!1),t?this.printings[0].ed:this.printings[0].edition},e.prototype.getEditionImage=function(t){return null==t&&(t=!1),"images/editions/"+(t||this.getEdition(!0))+".png"},e.prototype.getEditions=function(){var t,e=this;return t=[],$.each(this.printings,function(i,s){return t.push({"short":s.ed,"long":s.edition,src:e.getEditionImage(s.ed)})}),t},e.prototype.setEdition=function(t){var e,i=this;return e=0,""!==this.rates.date&&(this.printings[0].rates=this.rates,e=this.getRate()),"string"!=typeof t?t?this.printings.push(this.printings.shift()):this.printings.unshift(this.printings.pop()):$.each(this.printings,function(e,s){return s.ed===t?(i.printings.unshift(i.printings.splice(e,1)[0]),!1):void 0}),null==this.printings[0].rates?(this.rates={normal:-1,foil:-1,min:-1,min_foil:-1,date:"",special:""},this.fireEvent("valuechange",[this.getCount()*-e])):(this.rates=this.printings[0].rates,"nofoil"===this.rates.special&&(this.isFoil=!1),"onlyfoil"===this.rates.special&&(this.isFoil=!0),this.getRate()>=0?this.fireEvent("valuechange",[this.getCount()*(this.getRate()-e)]):void 0)},e.prototype.getRate=function(){var t,e=this;return""===this.rates.date?(this.rates.special!==this.getId()&&(t=this.getId(),this.rates.special=t,$.getJSON(this.url,{action:"value",arg:t},function(i){return i.error||e.getId()!==t?void 0:(e.rates.normal=parseFloat(i.rate),e.rates.foil=parseFloat(i.rate_foil),e.rates.min=parseFloat(i.minprice),e.rates.min_foil=parseFloat(i.minprice_foil),e.rates.date=i.timestamp,e.rates.foil>0&&0===e.rates.normal?(e.rates.special="onlyfoil",e.isFoil=!0):0===e.rates.foil?(e.rates.special="nofoil",e.isFoil=!1):e.rates.special="",e.fireEvent("valuechange",[e.getRate()*e.getCount()]))})),-1):this.getIsFoil()?this.getIsMinimum()?this.rates.min_foil:this.rates.foil:this.getIsMinimum()?this.rates.min:this.rates.normal},e.prototype.getRateTimestamp=function(){return this.rates.date||null},e.prototype.getMKMLink=function(){return"http://www.magiccardmarket.eu/CardPage.c1p"+this.getId()+".prod?referrer=bra1n"},e.prototype.clone=function(){var t,i,s,n,r;for(t=new e({}),i=["name","printings","rates","count","isFoil","isMinimum"],n=0,r=i.length;r>n;n++)s=i[n],t[s]=this[s];return t},e}(e),s=function(t){function e(t,e){var i=this;this.tradeAssist=e,t=$(t),this.input=t.find(".input_cardname"),this.propose=t.find(".propose"),this.lastSuggest="",this.counter=new a(t.find(".currentvalue"),this.tradeAssist),this.tradeAssist.isMobile||this.counter.addEvent("propose",function(t,e){return i.proposeTimer&&window.clearTimeout(i.proposeTimer),i.proposeTimer=window.setTimeout(function(){return i.proposeCard(t,e)},250)}),this.cardlist=new n(t.find(".cardlist_container"),this.tradeAssist),this.cardlist.addEvent("valuechange",function(t){return i.counter.add(t)}),this.suggestions=new r(this.input,this.tradeAssist),this.suggestions.addEvent("click",function(t){return i.cardlist.addCard(t.clone()),i.suggestions.hide(),i.input.val("").focus(),i.lastSuggest=""}),this.input.on({keyup:function(t){return i.inputKeyEvent(t.which)}})}return c(e,t),e.prototype.inputKeyEvent=function(t){var e=this;switch(t){case 13:if(this.suggestions.isUp())return this.suggestions.fire(),this.input.val(""),this.lastSuggest="";if(""!==this.input.val())return this.lastSuggest=this.input.val(),this.suggestions.suggest(this.input.val());break;case 37:return this.suggestions.left();case 38:return this.suggestions.up();case 39:return this.suggestions.right();case 40:return this.suggestions.down();default:return this.suggestTimer&&window.clearTimeout(this.suggestTimer),this.suggestTimer=window.setTimeout(function(){return e.input.val()!==e.lastSuggest?(e.lastSuggest=e.input.val(),e.suggestions.suggest(e.lastSuggest)):e.suggestions.isUp()?void 0:e.suggestions.show()},250)}},e.prototype.proposeCard=function(t,e){var s,n,r=this;return e>.05&&!this.counter.isMax()&&t>0?(s=[],$.each(this.tradeAssist.cardInterfaces,function(t,e){return e.counter.isMax()?$.each(e.cardlist.exportToObject().cards,function(t,e){return s.push(e.id)}):void 0}),null!=this.xhr&&4!==this.xhr.readyState&&this.xhr.abort(),this.xhr=$.getJSON(this.url,{action:"propose",arg:parseFloat(t).toFixed(2),exclude:s.join(","),minprice:i.prototype.isMinimum},function(t){var e;return t?(e=new i(t),r.propose.off("click").empty(),r.propose.append($('<img class="thumbnail" src="'+e.getImage()+'" alt="" title="'+e.getName()+'"/>').on({mouseenter:function(){var t;return t=$(this),t.closest(".propose").hasClass("show")?($("#fullcard").stop().remove(),t.clone().attr("id","fullcard").css(t.offset()).css({left:t.offset().left-245,top:t.offset().top-20,display:"none"}).appendTo("body").fadeIn()):void 0},mouseleave:function(){return $("#fullcard").stop().fadeOut(500,function(){return $(this).remove()})}})),r.propose.append("<img class='rarity "+e.getRarity()+"' src='"+r.defaultImg+"' alt=''/>"),r.propose.append("<img class='edition' src='"+e.getEditionImage()+("' alt='"+e.getEdition(!0)+"' title='"+e.getEdition(!1)+"'/>")),r.propose.append("<div class='name'>"+e.getName("en")+"</div>"),r.propose.on("click",function(){return r.cardlist.addCard(e),r.propose.off("click").removeClass("show")}),r.propose.addClass("show")):r.propose.off("click").removeClass("show")})):(null!=(n=this.xhr)&&n.abort(),this.propose.off("click").removeClass("show"))},e}(e),n=function(t){function e(t,e){var i,s=this;this.tradeAssist=e,this.cards=[],this.events={},i=this,this.sortElements=$('<div class="sort"><div class="title">sort by</div></div>'),this.sortElements.prepend($('<div class="name active down">name</div>').on("click",function(){return $(this).is(".active")||$(this).siblings(".active").removeClass("active").removeClass("down"),i.sort("name",$(this).addClass("active").toggleClass("down").hasClass("down"))})),this.sortElements.prepend($('<div class="rarity">rarity</div>').on("click",function(){return $(this).is(".active")||$(this).siblings(".active").removeClass("active").removeClass("down"),i.sort("rarity",$(this).addClass("active").toggleClass("down").hasClass("down"))})),this.sortElements.prepend($('<div class="rate">price</div>').on("click",function(){return $(this).is(".active")||$(this).siblings(".active").removeClass("active").removeClass("down"),i.sort("rate",$(this).addClass("active").toggleClass("down").hasClass("down"))})),this.sortElements.prepend($('<div class="reset">X</div>').on("click",function(){return s.reset()})),this.sortElements.prepend($('<div class="cards"><strong>0</strong> cards</div>')),this.cardlist=$('<ul class="cardlist"></ul>'),$(t).append(this.sortElements).append(this.cardlist)}return c(e,t),e.prototype.addCard=function(t){var e,i=this;return null!=t?(e=this.generateCardTemplate(t),this.cardlist.append(e),this.cards.push(e.slideDown()),t.removeEvents("valuechange").addEvent("valuechange",function(t){return i.handleValueChange(e,t)}),this.sort(this.sortElements.find(".active").text(),this.sortElements.find(".active").hasClass("down")),this.updateCounter()):void 0},e.prototype.sort=function(t,e){var i;switch(e=e&&1||-1,t){case"name":i=function(t,i){return $(t).data("card").getName().toLowerCase()>$(i).data("card").getName().toLowerCase()?e:-1*e};break;case"edition":i=function(t,i){return $(t).data("card").getEdition(!1)>$(i).data("card").getEdition(!1)?e:-1*e};break;case"rarity":i=function(t,i){var s;return s=["t","c","u","r","m","s"],s.indexOf($(t).data("card").getRarity())<s.indexOf($(i).data("card").getRarity())?e:-1*e};break;case"rate":case"price":i=function(t,i){return $(t).data("card").getRate()<$(i).data("card").getRate()?e:-1*e};break;default:i=function(){return 0}}return this.cardlist.find("li.card").length>0?this.cardlist.append(this.cardlist.find("li.card").sort(i)):void 0},e.prototype.reset=function(){var t;return t=0,$.each(this.cards,function(){var e;return e=$(this).data("card"),e.removeEvents("valuechange"),t-=Math.max(0,e.getRate())*e.getCount(),$(this).slideUp(200,function(){return $(this).remove()})}),this.fireEvent("valuechange",[t]),this.cards=[],this.updateCounter()},e.prototype.updateCounter=function(){var t;return t=0,$.each(this.cards,function(e,i){return t+=i.data("card").getCount()}),this.sortElements.find(".cards").html("<strong>"+t+"</strong> card"+(1===t?"":"s")),t&&this.sortElements.slideDown(),t||this.sortElements.slideUp(),this},e.prototype.exportToObject=function(){var t;return t={cards:[]},$.each(this.cards,function(e,i){return t.cards.push({id:i.data("card").getId(),count:i.data("card").getCount(),foil:i.data("card").getIsFoil()})}),t},e.prototype.importFromObject=function(t){var e=this;return t.cards?($.each(t.cards,function(t,s){return e.addCard(new i(s))}),this.sort(this.sortElements.find(".active").text(),this.sortElements.find(".active").hasClass("down"))):void 0},e.prototype.togglePrices=function(t){return $.each(this.cards,function(e,i){return i.data("card").setIsMinimum(t)})},e.prototype.generateCardTemplate=function(t){var e,i,s;return s=this,e=$('<li class="card"></li>'),i=$('<div class="right"></div>'),i.append('<span class="count">'+t.getCount()+'x</span><span class="rate'+(t.getIsFoil()?" foil":"")+(t.getIsMinimum()?" min":"")+'"></span>'),i.append($('<button class="plus">+</button>').on("click",function(){return t.setCount(t.getCount()+1)})),i.append('<img class="rarity '+t.getRarity()+'" src="'+this.defaultImg+'" alt=""/><br/>'),i.append($('<img class="edition" alt="'+t.getEdition(!0)+'" title="'+t.getEdition(!1)+'" src="'+t.getEditionImage()+'"/>').on("click",function(){var s;return t.getEditions().length>1?(s=$('<div class="editions"></div>'),$.each(t.getEditions(),function(n,r){return s.prepend($('<img class="edition choice"/>').attr({alt:r.short,src:r.src,title:r.long}).on("click",function(){return s.remove(),t.setEdition(r.short),i.find(".edition").attr({alt:t.getEdition(!0),title:t.getEdition(!1),src:t.getEditionImage()}).show(),i.find(".rarity").attr("class","rarity "+t.getRarity()),e.find(".thumbnail").attr("src",t.getImage()).parent("a").attr("href",t.getMKMLink())}))}),$(this).hide().after(s)):void 0}).toggleClass("multiple",t.getEditions().length>1)),i.append($('<div class="checkbox foil" title="Normal / Foil"></div>').toggleClass("checked",t.getIsFoil()).on("click",function(){return $(this).hasClass("locked")?void 0:t.setIsFoil($(this).toggleClass("checked").hasClass("checked"))})),i.append($('<button class="minus">&ndash;</button>').on("click",function(){return t.setCount(t.getCount()-1)})),i.append('<img class="rarity '+t.getRarity()+'" src="'+this.defaultImg+'"/>'),e.append(i),e.append($('<a href="'+t.getMKMLink()+'" target="_blank"><img class="thumbnail" alt="'+t.getName()+'" title="'+t.getName()+'" src="'+t.getImage()+'"/></a>').on({mouseenter:function(){var t;if(!s.tradeAssist.isMobile)return t=$(this).find(".thumbnail"),$("#fullcard").stop().remove(),t.clone().attr("id","fullcard").css(t.offset()).css({left:t.offset().left-250,top:t.offset().top-100,display:"none"}).appendTo("body").fadeIn()},mouseleave:function(){return $("#fullcard").stop().fadeOut(500,function(){return $(this).remove()})}})),e.append('<div class="name">'+t.getName("en")+"</div>").data("card",t),t.getRate()>=0?this.handleValueChange(e,t.getRate()):i.find("span.rate").addClass("loader"),e},e.prototype.handleValueChange=function(t,e){var i,s=this;if(i=t.data("card"),i.getCount()>0)switch(i.getRate()<0?t.find("span.rate").addClass("loader").text("").attr("title",i.getRateTimestamp()):t.find("span.rate").removeClass("loader").text(i.getRate().toFixed(2).replace(/\./,",")).attr("title",i.getRateTimestamp()),t.find("span.rate").toggleClass("foil",i.getIsFoil()).toggleClass("min",i.getIsMinimum()),t.find("span.count").text(i.getCount()+"x"),i.getSpecial()){case"onlyfoil":t.find(".name").addClass("foil"),t.find(".checkbox.foil").addClass("checked locked").attr("title","");break;case"nofoil":t.find(".name").removeClass("foil"),t.find(".checkbox.foil").addClass("locked").removeClass("checked");break;default:t.find(".name").toggleClass("foil",i.getIsFoil()),t.find(".checkbox.foil").removeClass("locked").toggleClass("checked",i.getIsFoil())}else $.each(this.cards,function(e,i){return i===t?s.cards.splice(e,1):void 0}),t.slideUp(500,function(){return $(this).remove()});return this.updateCounter(),"price"===this.sortElements.find(".active").text()&&this.sort("rate",this.sortElements.find(".active").hasClass("down")),this.fireEvent("valuechange",[e])},e}(e),r=function(t){function e(t,e){this.tradeAssist=e,this.inputElement=$(t),this.container=$('<ul class="suggestions"></ul>'),this.events={}}return c(e,t),e.prototype.suggest=function(t){var e,s,n=this;return""!==t?(4!==(null!=(e=this.xhr)?e.readyState:void 0)&&null!=(s=this.xhr)&&s.abort(),this.xhr=$.getJSON(this.url,{action:"suggest",arg:t},function(e){return t===n.lastSuggest?(null!=e?e.cards.length:void 0)>0?n.show(new i(e.cards)):n.hide():void 0}),this.lastSuggest=t):this.hide()},e.prototype.show=function(t){var e,i=this;return t&&(this.container.empty(),$.each(t,function(t,e){var s,n,r,a;return n=$('<li class="suggestion'+(t?"":" active")+'"></li>').data("card",e),r="",s="",a=i.escapeRegExp(i.lastSuggest),!i.lastSuggest||new RegExp(a,"i").test(e.getName())?s=e.getName().replace(new RegExp("("+a+")","i"),"<em>$1</em>"):(s=e.getName("de").replace(new RegExp("("+a+")","i"),"<em>$1</em>"),r=e.getName()),n.append($("<span class='name'>"+s+"</span>")),""!==r&&n.append($("<span class='name_real'>("+r+")</span>")),n.append($("<img class='thumbnail'/>").attr({src:e.getImage(),title:e.getName(),alt:e.getName()})),n.prepend($("<img class='edition'/>").attr({src:e.getEditionImage(),title:e.getEdition(),alt:e.getEdition(!0)})),e.getEditions().length>1&&(n.prepend($('<div class="arrow left">&larr;</div>').on("click",function(t){return t.stopPropagation(),i.left(n)})),n.prepend($('<div class="arrow right">&rarr;</div>').on("click",function(t){return t.stopPropagation(),i.right(n)}))),n.on({click:function(){return i.fireEvent("click",[e])},mouseenter:function(){return n.is(".active")?void 0:($("li.active",i.container).removeClass("active"),n.addClass("active"))}}),i.container.append(n)})),!this.isUp()&&$("li.suggestion",this.container).length&&(this.inputElement.parent(".input").after(this.container),e=$(window),e.height()+e.scrollTop()<this.container.offset().top+this.container.outerHeight())?$("html").animate({scrollTop:this.container.offset().top+this.container.outerHeight()-e.height()}):void 0},e.prototype.hide=function(){return this.isUp()?this.inputElement.parent(".input").next(".suggestions").detach():void 0},e.prototype.isUp=function(){return this.inputElement.parent(".input").next(".suggestions").length>0},e.prototype.fire=function(){return this.hide(),$("li.active",this.container).trigger("click")},e.prototype.down=function(){var t;if(!this.isUp())return this.show();if(!($("li.suggestion",this.container).length<=1))return t=$("li.active",this.container).removeClass("active"),0===t.next("li.suggestion").addClass("active").length?$("li.suggestion:first",this.container).addClass("active"):void 0},e.prototype.up=function(){var t;if(!this.isUp())return this.show();if(!($("li.suggestion",this.container).length<=1))return t=$("li.active",this.container).removeClass("active"),0===t.prev("li.suggestion").addClass("active").length?$("li.suggestion:last",this.container).addClass("active"):void 0},e.prototype.changeEdition=function(t,e){var i;return this.isUp()&&(null==t&&(t=$("li.active",this.container)),i=t.data("card"),i.getEditions().length>1)?(i.setEdition(e),this.tradeAssist.isMobile||$(".thumbnail",t).attr("src",i.getImage()),$(".edition",t).attr({alt:i.getEdition(!0),title:i.getEdition(),src:i.getEditionImage()})):void 0},e.prototype.left=function(t){return this.changeEdition(t,!1)},e.prototype.right=function(t){return this.changeEdition(t,!0)},e.prototype.escapeRegExp=function(t){return t.replace(/[-[\]{}()*+?.\\^$|,#\s]/g,function(t){return"\\"+t})},e}(e),a=function(t){function e(t,e){this.tradeAssist=e,this.counter=$(t).text("0,00"),this.currentValue=0,this.interval=0,this.animationDuration=500,this.fontGrowth=10,this.fontSize=30,this.events={}}return c(e,t),e.prototype.add=function(t){return t=parseFloat(t),0!==t&&(this.stepsize=(this.currentValue-parseFloat(this.counter.text().replace(/,/,"."))+t)/(60*this.animationDuration/1e3),Math.abs(this.stepsize)<.01&&(this.stepsize=.01*(this.stepsize>0?1:-1)),this.currentValue=parseFloat(this.currentValue.toFixed(2))+parseFloat(t.toFixed(2)),this.interval||this.incrementCounter()),this.tradeAssist.cardInterfaces.length>1?this.rebalance():void 0},e.prototype.incrementCounter=function(){return Math.abs(this.currentValue-parseFloat(this.counter.text().replace(/,/,".")))>Math.abs(this.stepsize)?(this.counter.text((parseFloat(this.counter.text().replace(/,/,"."))+this.stepsize).toFixed(2).replace(/\./,",")),this.interval=window.setTimeout(this.incrementCounter.bind(this),17)):(this.counter.text(this.currentValue.toFixed(2).replace(/\./,",")),this.interval=0)},e.prototype.reset=function(){return this.add(-1*this.currentValue)},e.prototype.rebalance=function(){var t,e,i,s=this;return i=null,e=null,$.each(this.tradeAssist.cardInterfaces,function(t,s){var n;return n=s.counter,null==e&&(e=n.currentValue),null==i&&(i=n.currentValue),n.currentValue<i&&(i=n.currentValue),n.currentValue>e?e=n.currentValue:void 0}),t=0===i?1:Math.abs(Math.min(e/i-1,1)),$.each(this.tradeAssist.cardInterfaces,function(n,r){var a;return a=r.counter,a.currentValue>(e+i)/2?a.counter.stop().animate({color:"rgb("+(255-Math.round(255*t*(2*a.currentValue-e-i)/(e-i)))+","+255+","+(255-Math.round(255*t*(2*a.currentValue-e-i)/(e-i)))+")",fontSize:Math.round(t*s.fontGrowth*(2*a.currentValue-e-i)/(e-i))+s.fontSize}):a.currentValue<(e+i)/2?a.counter.stop().animate({color:"rgb(255,"+(255-Math.round(255*t*(e+i-2*a.currentValue)/(e-i)))+","+(255-Math.round(255*t*(e+i-2*a.currentValue)/(e-i)))+")",fontSize:Math.round(t*s.fontGrowth*(2*a.currentValue-e-i)/(e-i))+s.fontSize}):a.counter.stop().animate({color:"rgb(255,255,255)",fontSize:s.fontSize}),a.fireEvent("propose",[e-i,t])})},e.prototype.isMax=function(){var t;return t=null,$.each(this.tradeAssist.cardInterfaces,function(e,i){var s;return s=i.counter,null==t&&(t=s.currentValue),s.currentValue>t?t=s.currentValue:void 0}),this.currentValue===t},e}(e)}).call(this);