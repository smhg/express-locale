const createHostnameLookup = (map = {}) =>
  (req) => {
    const hostname = req.hostname || req.host;

    if (!(hostname in map)) {
      return;
    }

    return map[hostname];
  };

module.exports = createHostnameLookup;
