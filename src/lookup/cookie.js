function createCookieLookup ({ name = 'locale' } = {}) {
  const noNameError = new Error('A cookie name is required for cookie locale lookup');

  if (typeof name !== 'string' || name.trim().length <= 0) {
    throw noNameError;
  }

  return function lookupCookie (req) {
    if (!('cookies' in req)) {
      return;
    }

    if (!(name in req.cookies)) {
      return;
    }

    return req.cookies[name];
  };
};

module.exports = createCookieLookup;
