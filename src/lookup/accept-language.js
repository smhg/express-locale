const createAcceptLanguageLookup = () =>
  (req) => {
    let locales = [];

    if ('acceptsLanguages' in req) {
      locales = req.acceptsLanguages();
    } else if ('acceptedLanguages' in req) {
      locales = req.acceptedLanguages;
    }

    locales = locales
      .filter(locale =>
        locale.length === 2 ||
        locale.length === 5
      );

    if (locales.length <= 0) {
      return;
    }

    return locales;
  };

export default createAcceptLanguageLookup;
