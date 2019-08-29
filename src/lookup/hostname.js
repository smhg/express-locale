function createHostnameLookup (map = {}) {
  function lookupHostname (req) {
    const hostname = req.hostname || req.host;

    if (!(hostname in map)) {
      return;
    }

    return map[hostname];
  };

  lookupHostname.uses = Object.values(map);

  return lookupHostname;
}

module.exports = createHostnameLookup;
