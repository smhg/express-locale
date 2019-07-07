import createCookieLookup from './lookup/cookie';
import createQueryLookup from './lookup/query';
import createHostnameLookup from './lookup/hostname';
import createDefaultLookup from './lookup/default';
import createAcceptLanguageLookup from './lookup/accept-language';
import createMapLookup from './lookup/map';
import createLocale from './locale';

const LOOKUP_CREATORS = {
  'cookie': createCookieLookup,
  'query': createQueryLookup,
  'hostname': createHostnameLookup,
  'accept-language': createAcceptLanguageLookup,
  'map': createMapLookup,
  'default': createDefaultLookup
};

const nonLocaleCharacters = /[^a-z]/ig;
const trailingUnderscores = /^_+|_+$/g;
const languageOrLocale = /^[a-z]{2}(?:_[a-z]{2})?$/i;

function trimLocale (locale) {
  return locale
    .replace(nonLocaleCharacters, '_')
    .replace(trailingUnderscores, '');
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

  const lookups = {
    ...Object.keys(LOOKUP_CREATORS).reduce((result, lookup) => {
      result[lookup] = LOOKUP_CREATORS[lookup](options[lookup]);
      return result;
    }, {}),
    ...(options.lookups || {})
  };

  if (typeof options.priority === 'string') {
    options.priority = options.priority.split(/ *, */g);
  }

  if (!options.priority.every(source => source in lookups)) {
    const notFound = options.priority.filter(source => !(source in lookups));

    throw Error(`Undefined lookup${notFound.length === 1 ? '' : 's'} (${notFound.join(', ')})`);
  }

  function isAllowed (locale) {
    return !options.allowed || options.allowed.indexOf(locale) >= 0 || ( options.default && options.default === locale );
  }

  function * lookup (req, all) {
    for (let source of options.priority) {
      let locales = lookups[source](req, all);

      if (typeof locales === 'string') {
        locales = [locales];
      }

      if (Array.isArray(locales) && locales.length > 0) {
        locales = locales
          .map(trimLocale)
          .filter(isLanguageOrLocale)
          .filter(isAllowed)
          .map(code => createLocale(code, source));

        for (let locale of locales) {
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
    for (let locale of lookup(req, locales)) {
      if ((result = filterResult(locale))) {
        break;
      }

      locales.push(locale);
    }

    // if no early exit was found, eliminate results one by one
    while (!result && locales.length > 0) {
      languageBuffer = undefined;
      locales.shift();

      for (let locale of locales) {
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
