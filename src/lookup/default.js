const createDefaultLookup = (locale = 'en_GB') => {
  const invalidLocaleError = new Error('A valid locale is required for default lookup');

  if (typeof locale !== 'string') {
    throw invalidLocaleError;
  }

  locale = locale.trim();

  if (locale.length !== 5) {
    throw invalidLocaleError;
  }

  return () => {
    return locale;
  };
};

export default createDefaultLookup;
