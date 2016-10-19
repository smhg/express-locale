import assert from 'assert';
import createLocaleMiddleware from '../src';
import request from 'supertest';
import express3 from 'express3';
import express4 from 'express';
import cookieParser from 'cookie-parser';

const createServer = (version, middlewareOptions) => {
  return (version === 3 ? express3 : express4)()
    .use(version === 3 ? express3.cookieParser() : cookieParser())
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
  it('should add a custom lookup method', () => {
    let localeMiddleware = createLocaleMiddleware({
      priority: ['custom']
    });

    localeMiddleware.addLookup('custom', req => {
      return 'fr_FR';
    });

    let req = {};
    localeMiddleware(req, {}, () => {});
    assert.equal(req.locale.code, 'fr_FR');
  });
});

const runTests = (version) => {
  describe(`on Express ${version || 'latest'}`, () => {
    it('should hook into Express', done => {
      request(createServer(version))
        .get('/')
        .expect(200, done);
    });

    it('should return default', done => {
      request(createServer(version))
        .get('/')
        .expect({
          code: 'en_GB',
          source: 'default',
          language: 'en',
          region: 'GB'
        }, done);
    });

    it('should parse accept-language header', done => {
      request(createServer(version, {
        priority: 'accept-language'
      }))
        .get('/')
        .set('Accept-Language', 'de-CH;q=0.8,en-GB;q=0.6')
        .expect({
          code: 'de_CH',
          source: 'accept-language',
          language: 'de',
          region: 'CH'
        })
        .end(done);
    });

    it('should read cookie', done => {
      request(createServer(version, {
        cookie: {name: 'lang'},
        priority: 'cookie'
      }))
        .get('/')
        .set('Cookie', 'lang=nl_BE')
        .expect({
          code: 'nl_BE',
          source: 'cookie',
          language: 'nl',
          region: 'BE'
        }, done);
    });

    it('should map hostname', done => {
      request(createServer(version, {
        hostname: {'127.0.0.1': 'nl_BE'},
        priority: 'hostname'
      }))
        .get('/')
        .expect({
          code: 'nl_BE',
          source: 'hostname',
          language: 'nl',
          region: 'BE'
        }, done);
    });

    it('should validate against a whitelist', done => {
      request(createServer(version, {
        default: 'de_DE',
        allowed: ['de_DE', 'de_AT', 'de_CH']
      }))
        .get('/')
        .set('Accept-Language', 'en,en-GB;q=0.8')
        .expect({
          code: 'de_DE',
          source: 'default',
          language: 'de',
          region: 'DE'
        }, done);
    });

    it('should map a language to a default', done => {
      request(createServer(version, {
        priority: 'cookie',
        map: {'de': 'de_DE'}
      }))
        .get('/')
        .set('Cookie', 'locale=de')
        .expect({
          code: 'de_DE',
          source: 'cookie',
          language: 'de',
          region: 'DE'
        }, done);
    });

    it('should skip mapping if the same language returns in the next locale', done => {
      request(createServer(version, {
        map: {'de': 'de_DE'}
      }))
        .get('/')
        .set('Accept-Language', 'de,de-CH;q=0.8,en;q=0.6')
        .expect({
          code: 'de_CH',
          source: 'accept-language',
          language: 'de',
          region: 'CH'
        }, done);
    });
  });
};

runTests();
runTests(3);
