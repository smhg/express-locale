function createDefaultLookup (locale = 'en-GB') {
  const invalidLocaleError = new Error('A valid locale is required for default lookup');

  if (typeof locale !== 'string') {
    throw invalidLocaleError;
  }

  locale = locale.trim();

  if (locale.length !== 5) {
    throw invalidLocaleError;
  }

  function lookupDefault () {
    return locale;
  };

  lookupDefault.uses = [locale];

  return lookupDefault;
};

module.exports = createDefaultLookup;
