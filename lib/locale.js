// lookup methods
var lookups = {
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
    var locale;
    (req.acceptedLanguages || []).some(function (item) {
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
function filter(locale, options) {
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
function complete(locale, options) {
  if (locale && locale.length === 2 && options.map) {
    if (options.map.language) {
      return options.map.language[locale.toLowerCase()];
    }
  }
  return locale;
}

// lookup locale using speficied source method
function lookup(source, req, options) {
  if (!lookups[source]) {
    throw Error('Locale lookup source method "' + source + '" not defined');
  }
  return filter(complete(lookups[source](req, options), options), options);
}

function locale(config) {
  var options = config || {};

  options['default'] = options['default'] || 'en_GB';
  options.cookie = options.cookie || {name: 'locale'};
  options.priority = options.priority || ['accept-language', 'default'];

  return function (req, res, next) {
    options.priority.some(function (source) {
      var locale = lookup(source, req, options);
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

locale.prototype.addLookup = function (name, lookup) {
  lookups[name] = lookup;
};

module.exports = locale;
