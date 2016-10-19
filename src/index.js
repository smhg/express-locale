import 'babel-polyfill';
import createCookieLookup from './lookup/cookie';
import createHostnameLookup from './lookup/hostname';
import createDefaultLookup from './lookup/default';
import createAcceptLanguageLookup from './lookup/accept-language';

const LOOKUPS = {
  'cookie': createCookieLookup,
  'hostname': createHostnameLookup,
  'accept-language': createAcceptLanguageLookup,
  'default': createDefaultLookup
};

const splitLocale = locale => {
  let [, language, region] = locale.match(/([a-z]{2})_([a-z]{2})/i);
  language = language.toLowerCase();
  region = region.toUpperCase();
  return {language, region};
};

function createLocaleMiddleware (options = {}) {
  options = Object.assign({
    priority: ['accept-language', 'default']
  }, options);

  let lookups = Object.keys(LOOKUPS).reduce((result, lookup) => {
    result[lookup] = LOOKUPS[lookup](options[lookup]);
    return result;
  }, {});

  let middleware = function (req, res, next) {
    if (typeof options.priority === 'string') {
      options.priority = [options.priority];
    }

    let languageBuffer, result;

    options.priority.some(source => {
      if (!(source in lookups)) {
        throw Error('Locale lookup source method "' + source + '" not defined');
      }

      let locales = lookups[source](req);

      if (typeof locales === 'string') {
        locales = [locales];
      }

      if (!Array.isArray(locales) || locales.length <= 0) {
        return false;
      }

      locales
        .map(locale => locale.trim().replace(/[^a-z]/i, '_'))
        .some(locale => {
          if (locale.length === 2) {
            languageBuffer = {
              language: locale.toLowerCase(),
              source
            };

            return false;
          }

          if (locale.length !== 5) {
            return false;
          }

          let {language, region} = splitLocale(locale);

          if (typeof languageBuffer === 'undefined' || languageBuffer.language === language) {
            locale = `${language}_${region}`;

            if (Array.isArray(options.allowed)) {
              if (options.allowed.indexOf(locale) === -1) {
                languageBuffer = undefined;
                return false;
              }
            }

            result = {
              code: locale,
              source,
              language,
              region
            };

            return true;
          }

          return false;
        });
    });

    if (typeof result === 'undefined' &&
      typeof languageBuffer !== 'undefined' &&
      'map' in options
    ) {
      let locale = options.map[languageBuffer.language];

      if (typeof locale !== 'undefined') {
        let {language, region} = splitLocale(locale);
        locale = `${language}_${region}`;

        result = {
          code: locale,
          source: languageBuffer.source,
          language,
          region
        };
      }
    }

    req.locale = result;

    next();
  };

  middleware.addLookup = function (name, lookup) {
    lookups[name] = lookup;
  };

  return middleware;
}

module.exports = createLocaleMiddleware;
