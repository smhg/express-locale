[![Build Status](https://travis-ci.org/smhg/express-locale.png?branch=master)](https://travis-ci.org/smhg/express-locale)
express-locale
==============

Express middleware to determine locale based on configuration and request.
Configuration (likely from a JSON file) enables mappings and lookup priorities.

```javascript
var express = require('express'),
    locale = require('express-locale');

var app = express();
app.use(locale({
        // ... defaults to user-agent's first full locale with fallback to en_US
    }))
    .use(function (req, res) {
        res.end('Request locale: ' + req.locale + ' (' + req.localeSource + ')');
    })
    .listen(3000);
```
**Note:** only full locales (language_REGION) are returned, but a mapping of languages to a default locale can be provided (see below).


## Configuration
#### Require a result
`required` Boolean (false)

An error will be thrown when set to *true*.

#### Default locale string
`default` String ('en_US')

#### Defining lookup priority
`priority` Array (['default'])

#### Limiting to predefined locales
`allowed` Array (undefined)

#### Mappings
##### Languages to locales
`mapping.default` Array (undefined)
##### Domains to locales
`mapping.domain` Array (undefined)


## Custom lookups
TODO: describe how to derive from path or querystring
