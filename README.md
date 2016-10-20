[![Build Status](https://travis-ci.org/smhg/express-locale.png?branch=master)](https://travis-ci.org/smhg/express-locale)
express-locale
==============

Express middleware to determine the [locale identifier](https://en.wikipedia.org/wiki/Locale_(computer_software)) of the incomming request.


## Installation
`npm install --save express-locale`


## Usage
```javascript
import express from 'express';
import createLocaleMiddleware from 'express-locale';

express()
  .use(createLocaleMiddleware())
  .use((req, res) => {
    res.end('Request locale: ' + req.locale.code);
  })
  .listen(3000);
```

The `locale` property on the request object will contain an object with this structure:
```javascript
{
	code: 'en_GB',
	source: 'default',
	language: 'en',
	region: 'GB'
}
```

**Note:** only full locales (language_REGION) are returned, but a [mapping](#map) of languages to a default locale can be provided.


## Configuration
You can pass a configuration object to the `createLocaleMiddleware()` call above with the default being:
```javascript
{
  {
    "priority": ["accept-language", "default"],
    "cookie": {"name": "locale"},
    "default": "en_GB"
  }
}
```

#### priority
Type: `Array` Default value `['accept-language', 'default']`

Defines the order of lookups. The first lookup to return a full locale will be the final result.

Built-in lookups:
* `cookie`
* `hostname`
* `accept-language`
* `default`

Read below on how to add [custom lookups](#custom-lookups).

#### default
Type: `String` Default value `'en_GB'`

The default locale to use (if `'default'` is present in [priority](#priority)).

#### cookie
Type: `Object` Default value `'{name: 'locale'}'`

Use with [cookie-parser](https://github.com/expressjs/cookie-parser) middleware.

If `'cookie'` is present in [priority](#priority), the cookie's name is read from this configuration object.
You are responsible for writing the locale to the cookie (e.g. when a user changes their preferred locale in you application).

#### hostname
Type: `Object` Default value `{}`

If provided and `'hostname'` is present in [priority](#priority), the hostname part of the request is mapped to a locale.

#### allowed
Type: `Array` Default value `undefined`

Lookup results are validated against this list of allowed locales if provided.

#### map
Type: `Array` Default value `undefined`

Maps lookup results that return only a language to a full locale.


## Custom lookups
Add a custom lookup by calling `addLookup` on the middleware:
```javascript
let localeMiddleware = createLocaleMiddleware({
  priority: 'custom'
});

localeMiddleware.addLookup('custom', req => {
	// custom method to return a locale or an array of locales
});
```
