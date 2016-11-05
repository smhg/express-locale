function splitLocale (locale) {
  let [, language, region] = locale.match(/([a-z]{2})(?:_([a-z]{2}))?/i);

  let result = {language: language.toLowerCase()};

  if (region) {
    result.region = region.toUpperCase();
  }

  return result;
};

function createLocale (code, source) {
  let cachedString;

  let proto = {
    ...splitLocale(code),
    toString: () => {
      if (!cachedString) {
        cachedString = `${proto.language}_${proto.region}`;
      }

      return cachedString;
    }
  };

  if (source) {
    proto.source = source;
  }

  return proto;
}

module.exports = createLocale;
