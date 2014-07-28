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

express().use(locale({
      // ...
      // configuration, defaults to:
      // {
      //   "default": "en_GB",
      //   "priority": ["user-agent", "default"],
      //   "cookie": {"name": "locale"}
      // }
    }))
  .use(function (req, res) {
      res.end('Request locale: ' + req.locale.code);
    })
  .listen(3000);
```
**Note:** only full locales (language_REGION) are returned, but a mapping of languages to a default locale can be provided (see below).


## Configuration
#### priority
Type: `Array` Default value `['accept-language', 'default']`

Defines the order of lookups. The first lookup to return a locale will be the final result.

Available values (lookups):
* `cookie`
* `domain`
* `accept-language`
* `default`

[Custom lookups](#custom-lookups) can be added.

#### default
Type: `String` Default value `'en_GB'`

The default locale to use (if `'default'` is present in [priority](#priority)).

#### allowed
Type: `Array` Default value `undefined`

Lookup results are validated against this list of allowed locales if provided.

#### cookie.name
Type: `String` Default value `'locale'`

Use with [cookieParser](http://www.senchalabs.org/connect/cookieParser.html) middleware.

If `'cookie'` is present in [priority](#priority), a cookie with this name is read.
You are responsible for writing the locale to the cookie (e.g. when a user changes their preferred locale in you application).

### Mappings
#### map.language
Type: `Array` Default value `undefined`

Lookup results that return only a language can be mapped to a default locale.

#### map.domain
Type: `Array` Default value `undefined`

If provided and `'domain'` is present in [priority](#priority), the host part of the request is mapped to a locale.

## Custom lookups
TODO: describe how to derive from path or querystring
