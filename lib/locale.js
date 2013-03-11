var str = require('underscore.string');

var config = {};

var lookups = {
  cookie: function (req) {
  },
  domain: function (req) {
    if (config.mapping) {
      var mapping = config.mapping.domain;
      if (mapping) {
        return mapping[req.host];
      }
    }
  },
  userAgent: function (req) {
    var locale;
    (req.acceptedLanguages || []).some(function (item) {
      locale = filter(complete(item.replace(/-+/g, '_')));
      return locale;
    });
    return locale;
  },
  'default': function () {
    return config['default'];
  }
};

function filter(locale) {
  if (locale && locale.length === 5) {
    if (!config.allowed) {
      return locale;
    }
    if (config.allowed.indexOf(locale) >= 0) {
      return locale;
    }
  }
}

function complete(locale) {
  if (locale && locale.length === 2 && config.mapping) {
    var mapping = config.mapping['default'];
    if (mapping) {
      return mapping[locale.toLowerCase()];
    }
  }
  return locale;
}

function lookup(source, req) {
  return filter(complete(lookups[str.camelize(source)](req)));
}

function locale(options) {
  config = options || {};

  config['default'] = config['default'] || 'en_US';
  config.cookie = config.cookie || {name: 'locale'};
  config.priority = config.priority || ['user-agent', 'default'];

  return function (req, res, next) {
    config.priority.some(function (source) {
      req.locale = lookup(source, req);
      req.localeSource = source;
      return req.locale;
    });

    if (config.required && !req.locale) {
      throw Error('unable to define locale');
    }

    next();
  };
}

locale.prototype.addLookup = function (name, lookup) {
  lookups[name] = lookup;
};

module.exports = locale;
