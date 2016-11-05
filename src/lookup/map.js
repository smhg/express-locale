const createMapLookup = (map = {}) => {
  return (req, locales) => {
    return locales
      .filter(locale => !locale.region && locale.language in map)
      .map(locale => map[locale.language])
  };
};

export default createMapLookup;
