[![Build Status](https://travis-ci.org/smhg/express-locale.png?branch=master)](https://travis-ci.org/smhg/express-locale)
express-locale
==============

Express middleware to determine locale based on configuration and request.

Configuration (likely from a JSON file) enables mappings and lookup priorities.


## Installation
`npm install --save express-locale`


## Usage
```javascript
var express = require('express'),
    locale = require('express-locale');

var app = express();
app.use(locale({
        // ... defaults to user-agent's first full locale with fallback to en_UK
    }))
    .use(function (req, res) {
        res.end('Request locale: ' + req.locale.code);
    })
    .listen(3000);
```
**Note:** only full locales (language_REGION) are returned, but a mapping of languages to a default locale can be provided (see below).


## Configuration
#### Defining lookup priority
`priority Array (['accept-language', 'default'])`
The priority defines the order of lookups. The first lookup to return a locale will be the final result.

Available values (lookups):
* `domain`
* `cookie`
* `accept-language`
* `default`

(Custom lookups) can be added.

#### Default
`default String ('en_UK')`
The default locale to use (if 'default' is present in priority option).

#### Defining allowed locales
`allowed Array (undefined)`
Lookup results are validated against this list of allowed locales if provided.

#### Mappings
##### Languages to locales
`map.language Array (undefined)`
Lookup results that return only a language can be mapped to a default locale.

##### Domains to locales
`map.domain Array (undefined)`
If provided and 'domain' is present in the priority list, the host part of the request is mapped to a locale.


## Custom lookups
TODO: describe how to derive from path or querystring
