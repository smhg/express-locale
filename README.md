[![Build Status](https://travis-ci.org/smhg/express-locale.png?branch=master)](https://travis-ci.org/smhg/express-locale)
express-locale
==============

Express middleware to determine the [locale identifier](https://en.wikipedia.org/wiki/Locale_(computer_software)) of the incomming request.

It returns (only) full locale identifiers based on the middleware's configuration. Configuration defines possible sources, their order and, optionally, a whitelist. For performance reasons, on each request, remaining lookups are ignored as soon as a match is found.

> Use version 1.x for Express 3 support and/or older Node versions.

## Installation
`npm install --save express-locale`

## Usage
```javascript
import express from 'express';
import createLocaleMiddleware from 'express-locale';

express()
  .use(createLocaleMiddleware())
  .use((req, res) => {
    res.end(`Request locale: ${req.locale}`);
  })
  .listen(3000);
```

The `locale` property on the request object will contain an object with these properties:
```json
{
	"source": "default",
	"language": "en",
	"region": "GB"
}
```
When using this object in a string context, its `toString` method returns the locale identifier (`en-GB` in the example above).

**Note:** only full locales (language-REGION) are returned, but a [mapping](#map) of languages to a default locale can be provided as a lookup.


## Configuration
You can pass a configuration object to `createLocaleMiddleware()` with the default being:
```json
{
  "priority": ["accept-language", "default"],
  "default": "en-GB"
}
```
This tells the middleware to use 2 sources in order: `accept-language`, which has no configuration, and `default` which is set to `en-GB`.

The name of the lookup used in the priority list always matches the configuration key.

#### priority
Type: `Array` Default value `['accept-language', 'default']`

Defines the order of lookups. The first lookup to return a full locale will be the final result.

Built-in lookups:
* `cookie`
* `query`
* `hostname`
* `accept-language`
* `map`
* `default`

Read below on how to add [custom lookups](#custom-lookups).

#### cookie
Type: `Object` Default value `'{name: 'locale'}'`

The `name` of the cookie that contains the locale for the cookie lookup.

Use with [cookie-parser](https://github.com/expressjs/cookie-parser) middleware.

**Note:** you are responsible for writing the locale to the cookie.

#### query
Type: `Object` Default value `'{name: 'locale'}'`

The `name` of the query string parameter that contains the locale for the query lookup.

#### hostname
Type: `Object` Default value `{}`

A mapping of hostnames to locales for the hostname lookup.

#### map
Type: `Object` Default value `{}`

Maps lookup results that return only a language to a full locale.

#### default
Type: `String` Default value `'en-GB'`

The default locale for the default lookup.

#### allowed
Type: `Array` Default value `undefined`

Lookup results are validated against this list of allowed locales if provided.

#### requestProperty
Type: `String` Default value `'locale'`

By default, the locale is attached to `req.locale` but can be configured with the `requestProperty` option.

## Custom lookups
Add custom lookups or overwrite the default ones by using the `lookups` property:
```javascript
createLocaleMiddleware({
  priority: ['custom'],
  lookups: {
    custom: (req) => req.ip === '127.0.0.1' ? 'en-US' : undefined
  }
});
```
