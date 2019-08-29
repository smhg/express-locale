function createAcceptLanguageLookup () {
  return function lookupAcceptLanguage (req) {
    let locales;

    if ('acceptsLanguages' in req) {
      locales = req.acceptsLanguages();
    } else if ('acceptedLanguages' in req) {
      locales = req.acceptedLanguages;
    }

    if (!Array.isArray(locales)) {
      return;
    }

    if (locales.length <= 0) {
      return;
    }

    return locales;
  };
}

module.exports = createAcceptLanguageLookup;
