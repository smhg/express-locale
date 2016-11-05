import assert from 'assert';
import createLocaleMiddleware from '../src';
import request from 'supertest';
import express3 from 'express3';
import express4 from 'express';
import cookieParser from 'cookie-parser';

const createServer = (expressVersion, middlewareOptions) => {
  return (expressVersion === 3 ? express3 : express4)()
    .use(expressVersion === 3 ? express3.cookieParser() : cookieParser())
    .use(createLocaleMiddleware(middlewareOptions))
    .get('/', (req, res) => {
      res.json(req.locale);
    });
};

describe('()', () => {
  it('should return a function', () => {
    let type = typeof createLocaleMiddleware();
    assert.equal(type, 'function');
  });

  it('should extend the request object', () => {
    let localeMiddleware = createLocaleMiddleware();

    let req = {};
    localeMiddleware(req, {}, () => {});
    assert('locale' in req);
    assert.notEqual(req.locale, undefined);
  });
});

describe('.addLookup()', () => {
  it('should support custom lookup methods', () => {
    let localeMiddleware = createLocaleMiddleware({
      priority: ['custom'],
      lookups: {
        custom: () => 'fr_FR'
      }
    });

    let req = {};
    localeMiddleware(req, {}, () => {});
    assert.equal(req.locale, 'fr_FR');
    assert.equal(req.locale.source, 'custom');
  });
});

const runTests = (expressVersion) => {
  describe(`on Express ${expressVersion || 'latest'}`, () => {
    it('should hook into Express', done => {
      request(createServer(expressVersion))
        .get('/')
        .expect(200, done);
    });

    it('should return default', done => {
      request(createServer(expressVersion))
        .get('/')
        .expect({
          source: 'default',
          language: 'en',
          region: 'GB'
        }, done);
    });

    it('should parse accept-language header', done => {
      request(createServer(expressVersion, {
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
      request(createServer(expressVersion, {
        cookie: {name: 'lang'},
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
      request(createServer(expressVersion, {
        query: {name: 'l'},
        priority: 'query'
      }))
        .get('/?l=fr_CA')
        .expect({
          source: 'query',
          language: 'fr',
          region: 'CA'
        }, done);
    });

    it('should map hostname', done => {
      request(createServer(expressVersion, {
        hostname: {'127.0.0.1': 'nl_BE'},
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
      request(createServer(expressVersion, {
        default: 'de_DE',
        allowed: ['de_DE', 'de_AT', 'de_CH']
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
      request(createServer(expressVersion, {
        priority: 'cookie,map',
        map: {'de': 'de_DE'}
      }))
        .get('/')
        .set('Cookie', 'locale=de')
        .expect({
          source: ['cookie', 'map'],
          language: 'de',
          region: 'DE'
        }, done);
    });

    it('should skip mapping if the same language returns in the next locale', done => {
      request(createServer(expressVersion, {
        map: {'de': 'de_DE'}
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
      request(createServer(expressVersion, {
        priority: ['cookie', 'query', 'accept-language', 'map', 'default'],
        map: {'cs': 'cs_CZ'}
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
      request(createServer(expressVersion, {
        priority: ['cookie', 'query', 'accept-language', 'map', 'default'],
        map: {'en': 'en_GB'}
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
};

runTests();
runTests(3);
