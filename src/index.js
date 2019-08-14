const createCookieLookup = require('./lookup/cookie');
const createQueryLookup = require('./lookup/query');
const createHostnameLookup = require('./lookup/hostname');
const createDefaultLookup = require('./lookup/default');
const createAcceptLanguageLookup = require('./lookup/accept-language');
const createMapLookup = require('./lookup/map');
const createLocale = require('./locale');

const LOOKUP_CREATORS = {
  cookie: createCookieLookup,
  query: createQueryLookup,
  hostname: createHostnameLookup,
  'accept-language': createAcceptLanguageLookup,
  map: createMapLookup,
  default: createDefaultLookup
};

const nonLocaleCharacters = /[^a-z]/ig;
const trailingHyphens = /^-+|-+$/g;
const languageOrLocale = /^[a-z]{2}(?:-[a-z]{2})?$/i;

function trimLocale (locale) {
  return locale
    .replace(nonLocaleCharacters, '-')
    .replace(trailingHyphens, '');
}

function isLanguageOrLocale (locale) {
  return languageOrLocale.test(locale);
}

function createLocaleMiddleware (options = {}) {
  options = {
    priority: ['accept-language', 'default'],
    requestProperty: 'locale',
    ...options
  };

  if (typeof options.priority === 'string') {
    options.priority = options.priority.split(/ *, */g);
  }

  options.lookups = options.lookups || {};

  const isDefined = name => (name in LOOKUP_CREATORS) || (name in options.lookups);

  if (!options.priority.every(isDefined)) {
    const notFound = options.priority.find(name => !isDefined(name));

    throw new Error(`Undefined lookup (${notFound})`);
  }

  const lookups = new Map(options.priority.map(
    name => [
      name,
      name in options.lookups
        ? options.lookups[name]
        : LOOKUP_CREATORS[name](options[name])
    ]
  ));

  const isAllowed = locale => !options.allowed || options.allowed.indexOf(locale) >= 0;

  if (process.env.NODE_ENV !== 'production') {
    // validate configuration
    [...lookups]
      .forEach(([name, { uses = [] }]) => {
        uses.filter(locale => !isAllowed(locale))
          .forEach(locale => {
            throw new Error(`Invalid configration (locale '${locale}' in lookup '${name}' should be whitelisted)`);
          });
      });
  }

  function * lookup (req, all) {
    for (const source of options.priority) {
      let locales = lookups.get(source)(req, all);

      if (typeof locales === 'string') {
        locales = [locales];
      }

      if (Array.isArray(locales) && locales.length > 0) {
        locales = locales
          .map(trimLocale)
          .filter(isLanguageOrLocale)
          .filter(isAllowed)
          .map(code => createLocale(code, source));

        for (const locale of locales) {
          yield locale;
        }
      }
    }
  }

  const middleware = function (req, res, next) {
    const locales = [];
    let result;
    let languageBuffer;

    function filterResult (locale) {
      if ('region' in locale) {
        if (languageBuffer) {
          if (languageBuffer.language === locale.language) {
            if (languageBuffer.source !== locale.source) {
              locale.source = [languageBuffer.source, locale.source];
            }

            return locale;
          }
        } else {
          return locale;
        }
      } else {
        if (!languageBuffer) {
          languageBuffer = locale;
        }
      }
    }

    // perform lookups one by one, exiting early
    for (const locale of lookup(req, locales)) {
      if ((result = filterResult(locale))) {
        break;
      }

      locales.push(locale);
    }

    // if no early exit was found, eliminate results one by one
    while (!result && locales.length > 0) {
      languageBuffer = undefined;
      locales.shift();

      for (const locale of locales) {
        if ((result = filterResult(locale))) {
          break;
        }
      }
    }

    req[options.requestProperty] = result;

    next();
  };

  return middleware;
}

module.exports = createLocaleMiddleware;
