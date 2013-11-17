# Magic Trade Assist
Providing a (mobile) webservice to compare prices of Magic cards.
You can see it live on http://tradeassi.st

## Setup
The code should work out of the box, but you need some data to do anything useful!
In order to get this data, you should set up a MySQL server and create some tables.

Card information will be stored in the `cards` table:
```sql
CREATE TABLE cards
(
    id INT UNSIGNED NOT NULL,
    name VARCHAR(120) DEFAULT '' NOT NULL,
    name_de VARCHAR(200) DEFAULT '' NOT NULL,
    img_url VARCHAR(200) DEFAULT '' NOT NULL,
    edition SMALLINT UNSIGNED NOT NULL,
    rarity VARCHAR(1) DEFAULT '' NOT NULL,
    available SMALLINT UNSIGNED NOT NULL,
    available_foil SMALLINT UNSIGNED NOT NULL,
    rate DECIMAL(8,2) NOT NULL,
    rate_foil DECIMAL(8,2) NOT NULL,
    rate_us DECIMAL(8,2) NOT NULL,
    minprice DECIMAL(8,2) NOT NULL,
    minprice_foil DECIMAL(8,2) NOT NULL,
    minprice_us DECIMAL(8,2) NOT NULL,
    timestamp_mkm TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    timestamp_us TIMESTAMP DEFAULT '0000-00-00 00:00:00' NOT NULL
);
CREATE UNIQUE INDEX id ON cards ( id );
CREATE INDEX cardname ON cards ( name, name_de );
```

Each card belongs to an edition:
```sql
CREATE TABLE editions
(
    id SMALLINT UNSIGNED PRIMARY KEY NOT NULL AUTO_INCREMENT,
    edition VARCHAR(255) DEFAULT '' NOT NULL,
    shortname VARCHAR(5) DEFAULT '' NOT NULL,
    mkm_name VARCHAR(255) DEFAULT '' NOT NULL,
    us_name VARCHAR(255) DEFAULT '' NOT NULL,
    isregular BIT DEFAULT 1 NOT NULL
);
CREATE UNIQUE INDEX shortname ON editions ( shortname );
```

Trades can be saved in the `export` table:
```sql
CREATE TABLE export
(
    id INT UNSIGNED PRIMARY KEY NOT NULL AUTO_INCREMENT,
    cardlists LONGTEXT NOT NULL,
    md5 VARCHAR(32) NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE UNIQUE INDEX md5 ON export ( md5 );
```

Filling these tables with meaningful data is left as an exercise to the reader.

## Developing
In order to easily make changes to the JS / CSS files, you need to run Coffeescript and SCSS/SASS so that they will
automatically compile the `.coffee` and `.scss` files in `/sources`. When not server on the configured `HOSTNAME`, the
main page will try to load all assets from there, allowing you to easily modify the code and reload the page without
having to redeploy every time.

### SASS
Run `sass --sourcemap --watch sources` in the project root folder.

### Coffee
Run `coffee -m -b -c -w sources` in the project root folder.

## Deploying
To update the static CSS / JS assets, simply run `./deploy.sh`, which will generate the tradeassist.js and tradeassist.css

## License
Copyright (c) 2013 Steffen Baumgart
See the [LICENSE](https://github.com/bra1n/tradeassist/blob/master/LICENSE) file for details.