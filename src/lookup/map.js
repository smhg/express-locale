function createMapLookup (map = {}) {
  function lookupMap (req, locales) {
    return locales
      .filter(locale => !locale.region && locale.language in map)
      .map(locale => map[locale.language]);
  };

  lookupMap.uses = Object.values(map);

  return lookupMap;
};

module.exports = createMapLookup;
