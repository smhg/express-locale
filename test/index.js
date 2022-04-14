const assert = require('assert');
const createLocaleMiddleware = require('../src');
const request = require('supertest');
const express = require('express');
const cookieParser = require('cookie-parser');

const createServer = (middlewareOptions) => {
  return express()
    .use(cookieParser())
    .use(createLocaleMiddleware(middlewareOptions))
    .get('/', (req, res) => {
      res.json(req.locale);
    });
};

describe('()', () => {
  it('should return a function', () => {
    const type = typeof createLocaleMiddleware();
    assert.strictEqual(type, 'function');
  });

  it('should extend the request object adding the default requestProperty', () => {
    const localeMiddleware = createLocaleMiddleware();

    const req = {};
    localeMiddleware(req, {}, () => {});
    assert('locale' in req);
    assert.notStrictEqual(req.locale, undefined);
  });

  it('should extend the request object adding the custom requestProperty', () => {
    const localeMiddleware = createLocaleMiddleware({ requestProperty: 'custom-locale' });

    const req = {};
    localeMiddleware(req, {}, () => {});
    assert('custom-locale' in req);
    assert.notStrictEqual(req['custom-locale'], undefined);
  });

  it('should support custom lookup methods', () => {
    const localeMiddleware = createLocaleMiddleware({
      priority: ['custom'],
      lookups: {
        custom: () => 'fr-FR'
      }
    });

    const req = {};

    localeMiddleware(req, {}, () => {});

    assert.strictEqual(req.locale.toString(), 'fr-FR');
    assert.strictEqual(req.locale.source, 'custom');
  });

  it('should support priority using any case', () => {
    const localeMiddleware = createLocaleMiddleware({ priority: 'AcCePt-LanGuaGe' });

    const req = {};
    localeMiddleware(req, {}, () => {});
    assert('locale' in req);
    assert.strictEqual(req.locale, undefined);
  });

  it('should check existence of custom lookup methods', () => {
    function createUndefinedLookup () {
      createLocaleMiddleware({
        priority: ['abc', 'def', 'ghi'],
        lookups: {
          abc: () => 'fr_FR'
        }
      });
    }

    assert.throws(createUndefinedLookup, new Error('Undefined lookup (def)'));
  });

  it('should warn about invalid configuration in non-production env', () => {
    function createInvalidConfig () {
      createLocaleMiddleware({
        priority: ['default'],
        allowed: ['nl-BE', 'fr-BE'],
        default: 'en-GB'
      });
    }

    assert.throws(createInvalidConfig, new Error('Invalid configuration (locale \'en-GB\' in lookup \'default\' should be whitelisted)'));
  });
});

describe('with Express', () => {
  it('should hook into Express', done => {
    request(createServer())
      .get('/')
      .expect(200, done);
  });

  it('should return default', done => {
    request(createServer())
      .get('/')
      .expect({
        source: 'default',
        language: 'en',
        region: 'GB'
      }, done);
  });

  it('should parse accept-language header', done => {
    request(createServer({
      priority: 'accept-language'
    }))
      .get('/')
      .set('Accept-Language', 'de-CH;q=0.8,en-GB;q=0.6')
      .expect({
        source: 'accept-language',
        language: 'de',
        region: 'CH'
      })
      .end(done);
  });

  it('should read cookie', done => {
    request(createServer({
      cookie: { name: 'lang' },
      priority: 'cookie'
    }))
      .get('/')
      .set('Cookie', 'lang=nl-BE')
      .expect({
        source: 'cookie',
        language: 'nl',
        region: 'BE'
      }, done);
  });

  it('should read cookie with locale in underscore format', done => {
    request(createServer({
      cookie: { name: 'lang' },
      priority: 'cookie'
    }))
      .get('/')
      .set('Cookie', 'lang=nl_BE')
      .expect({
        source: 'cookie',
        language: 'nl',
        region: 'BE'
      }, done);
  });

  it('should parse query string', done => {
    request(createServer({
      query: { name: 'l' },
      priority: 'query'
    }))
      .get('/?l=fr-CA')
      .expect({
        source: 'query',
        language: 'fr',
        region: 'CA'
      }, done);
  });

  it('should map hostname', done => {
    request(createServer({
      hostname: { '127.0.0.1': 'nl-BE' },
      priority: 'hostname'
    }))
      .get('/')
      .expect({
        source: 'hostname',
        language: 'nl',
        region: 'BE'
      }, done);
  });

  it('should validate against a whitelist', done => {
    request(createServer({
      default: 'de-DE',
      allowed: ['de-DE', 'de-AT', 'de-CH']
    }))
      .get('/')
      .set('Accept-Language', 'en,en-GB;q=0.8')
      .expect({
        source: 'default',
        language: 'de',
        region: 'DE'
      }, done);
  });

  it('should map a language to a default', done => {
    request(createServer({
      priority: 'cookie,map',
      map: { de: 'de-DE' }
    }))
      .get('/')
      .set('Cookie', 'locale=de')
      .expect({
        source: ['cookie', 'map'],
        language: 'de',
        region: 'DE'
      }, done);
  });

  it('should ignore values not whitelisted', done => {
    request(createServer({
      priority: ['query', 'map'],
      allowed: ['en-CA', 'fr-CA'],
      map: { en: 'en-CA', fr: 'fr-CA' }
    }))
      .get('/?locale=fr')
      .expect('', done);
  });

  it('should skip mapping if the same language returns in the next locale', done => {
    request(createServer({
      map: { de: 'de-DE' }
    }))
      .get('/')
      .set('Accept-Language', 'de,de-CH;q=0.8,en;q=0.6')
      .expect({
        source: 'accept-language',
        language: 'de',
        region: 'CH'
      }, done);
  });

  it('should handle multiple lookups', done => {
    request(createServer({
      priority: ['cookie', 'query', 'accept-language', 'map', 'default'],
      map: { cs: 'cs-CZ' }
    }))
      .get('/')
      .set('Accept-Language', 'cs,de;q=0.8,de-AT;q=0.6')
      .expect({
        source: ['accept-language', 'map'],
        language: 'cs',
        region: 'CZ'
      }, done);
  });

  it('should work', done => {
    request(createServer({
      priority: ['cookie', 'query', 'accept-language', 'map', 'default'],
      map: { en: 'en-GB' }
    }))
      .get('/?locale=en')
      .set('Accept-Language', 'nl,nl-BE;q=0.8,en-US;q=0.6')
      .expect({
        source: ['query', 'accept-language'],
        language: 'en',
        region: 'US'
      }, done);
  });
});
