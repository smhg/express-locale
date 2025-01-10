const { describe, it } = require('node:test');
const assert = require('assert');
const request = require('supertest');
const express = require('express');
const cookieParser = require('cookie-parser');
const createLocaleMiddleware = require('../src');

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
  it('should hook into Express', async () => {
    await request(createServer())
      .get('/')
      .expect(200);
  });

  it('should return default', async () => {
    await request(createServer())
      .get('/')
      .expect({
        source: 'default',
        language: 'en',
        region: 'GB'
      });
  });

  it('should parse accept-language header', async () => {
    await request(createServer({
      priority: 'accept-language'
    }))
      .get('/')
      .set('Accept-Language', 'de-CH;q=0.8,en-GB;q=0.6')
      .expect({
        source: 'accept-language',
        language: 'de',
        region: 'CH'
      });
  });

  describe('should handle lookup letter case', () => {
    it('forcing lower case for default lookups', async () => {
      await request(createServer({
        priority: 'Accept-Language'
      }))
        .get('/')
        .set('Accept-Language', 'es-MX;q=0.8,en-GB;q=0.6')
        .expect({
          source: 'accept-language',
          language: 'es',
          region: 'MX'
        });
    });

    it('ignoring for custom lookups', async () => {
      await request(createServer({
        priority: 'customLookup',
        lookups: {
          customLookup: () => 'fr_FR'
        }
      }))
        .get('/')
        .expect({
          source: 'customLookup',
          language: 'fr',
          region: 'FR'
        });
    });
  });

  it('should read cookie', async () => {
    await request(createServer({
      cookie: { name: 'lang' },
      priority: 'cookie'
    }))
      .get('/')
      .set('Cookie', 'lang=nl-BE')
      .expect({
        source: 'cookie',
        language: 'nl',
        region: 'BE'
      });
  });

  it('should read cookie with locale in underscore format', async () => {
    await request(createServer({
      cookie: { name: 'lang' },
      priority: 'cookie'
    }))
      .get('/')
      .set('Cookie', 'lang=nl_BE')
      .expect({
        source: 'cookie',
        language: 'nl',
        region: 'BE'
      });
  });

  it('should parse query string', async () => {
    await request(createServer({
      query: { name: 'l' },
      priority: 'query'
    }))
      .get('/?l=fr-CA')
      .expect({
        source: 'query',
        language: 'fr',
        region: 'CA'
      });
  });

  it('should map hostname', async () => {
    await request(createServer({
      hostname: { '127.0.0.1': 'nl-BE' },
      priority: 'hostname'
    }))
      .get('/')
      .expect({
        source: 'hostname',
        language: 'nl',
        region: 'BE'
      });
  });

  it('should validate against a whitelist', async () => {
    await request(createServer({
      default: 'de-DE',
      allowed: ['de-DE', 'de-AT', 'de-CH']
    }))
      .get('/')
      .set('Accept-Language', 'en,en-GB;q=0.8')
      .expect({
        source: 'default',
        language: 'de',
        region: 'DE'
      });
  });

  it('should map a language to a default', async () => {
    await request(createServer({
      priority: 'cookie,map',
      map: { de: 'de-DE' }
    }))
      .get('/')
      .set('Cookie', 'locale=de')
      .expect({
        source: ['cookie', 'map'],
        language: 'de',
        region: 'DE'
      });
  });

  it('should ignore values not whitelisted', async () => {
    await request(createServer({
      priority: ['query', 'map'],
      allowed: ['en-CA', 'fr-CA'],
      map: { en: 'en-CA', fr: 'fr-CA' }
    }))
      .get('/?locale=fr')
      .expect('');
  });

  it('should skip mapping if the same language returns in the next locale', async () => {
    await request(createServer({
      map: { de: 'de-DE' }
    }))
      .get('/')
      .set('Accept-Language', 'de,de-CH;q=0.8,en;q=0.6')
      .expect({
        source: 'accept-language',
        language: 'de',
        region: 'CH'
      });
  });

  it('should handle multiple lookups', async () => {
    await request(createServer({
      priority: ['cookie', 'query', 'accept-language', 'map', 'default'],
      map: { cs: 'cs-CZ' }
    }))
      .get('/')
      .set('Accept-Language', 'cs,de;q=0.8,de-AT;q=0.6')
      .expect({
        source: ['accept-language', 'map'],
        language: 'cs',
        region: 'CZ'
      });
  });

  it('should work', async () => {
    await request(createServer({
      priority: ['cookie', 'query', 'accept-language', 'map', 'default'],
      map: { en: 'en-GB' }
    }))
      .get('/?locale=en')
      .set('Accept-Language', 'nl,nl-BE;q=0.8,en-US;q=0.6')
      .expect({
        source: ['query', 'accept-language'],
        language: 'en',
        region: 'US'
      });
  });
});
