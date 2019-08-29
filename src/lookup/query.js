function createQueryLookup ({ name = 'locale' } = {}) {
  const noNameError = new Error('A query string parameter name is required for query string locale lookup');

  if (typeof name !== 'string' || name.trim().length <= 0) {
    throw noNameError;
  }

  return function lookupQuery (req) {
    if (!(name in req.query)) {
      return;
    }

    return req.query[name];
  };
};

module.exports = createQueryLookup;
