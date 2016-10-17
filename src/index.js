import 'babel-polyfill';

// lookup methods
let lookups = {
  'cookie': function (req, options) {
    if (req.cookies) {
      return req.cookies[options.cookie.name];
    }
  },
  'domain': function (req, options) {
    if (options.map && options.map.domain && req.host) {
      return options.map.domain[req.host];
    }
  },
  'accept-language': function (req, options) {
    let locale;
    let accepted;

    if (req.acceptsLanguages) {
      accepted = req.acceptsLanguages();
    } else if (req.acceptedLanguages) {
      accepted = req.acceptedLanguages;
    } else {
      return false;
    }

    accepted.some(item => {
      locale = filter(complete(item.replace(/-+/g, '_'), options), options);
      return locale;
    });

    return locale;
  },
  'default': function (req, options) {
    return options['default'];
  }
};

// filter wrong formats (and optionally non-allowed values)
function filter (locale, options) {
  if (locale && locale.length === 5) {
    if (!options.allowed) {
      return locale;
    }
    if (options.allowed.indexOf(locale) >= 0) {
      return locale;
    }
  }
}

// complete languages to locale (if options available)
function complete (locale, options) {
  if (locale && locale.length === 2 && options.map) {
    if (options.map.language) {
      return options.map.language[locale.toLowerCase()];
    }
  }
  return locale;
}

// lookup locale using specified source method
function lookup (source, req, options) {
  if (!(source in lookups)) {
    throw Error('Locale lookup source method "' + source + '" not defined');
  }
  return filter(complete(lookups[source](req, options), options), options);
}

function createLocaleMiddleware (options = {}) {
  options = Object.assign({
    default: 'en_GB',
    cookie: {name: 'locale'},
    priority: ['accept-language', 'default']
  }, options);

  return function (req, res, next) {
    options.priority.some(source => {
      let locale = lookup(source, req, options);

      if (locale) {
        req.locale = {
          code: locale,
          source: source
        };
      }

      return locale;
    });

    next();
  };
}

createLocaleMiddleware.prototype.addLookup = function (name, lookup) {
  lookups[name] = lookup;
};

module.exports = createLocaleMiddleware;
