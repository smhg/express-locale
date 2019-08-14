function splitLocale (locale) {
  const [, language, region] = locale.match(/([a-z]{2})(?:-([a-z]{2}))?/i);

  const result = { language: language.toLowerCase() };

  if (region) {
    result.region = region.toUpperCase();
  }

  return result;
};

function createLocale (code, source) {
  let cachedString;

  const proto = {
    ...splitLocale(code),
    toString: () => {
      if (!cachedString) {
        cachedString = `${proto.language}-${proto.region}`;
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
