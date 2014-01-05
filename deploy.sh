#!/bin/bash
coffee -j scripts/tradeassist.js -c sources/*.coffee
uglifyjs scripts/tradeassist.js -c -m -o scripts/tradeassist.js
sass -C --scss -t compressed -f --update sources/:styles/