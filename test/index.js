import assert from 'assert';
import createLocaleMiddleware from '..';
import createServer from './util/server';

describe('express-locale', () => {
  it('should return a function', () => {
    let type = typeof createLocaleMiddleware();
    assert.equal(type, 'function');
  });

  it('should be chainable', (done) => {
    let localeMiddleware = createLocaleMiddleware();
    localeMiddleware({}, {}, done);
  });

  function runOnExpress (version) {
    describe(`on Express ${version}`, () => {
      let server = createServer(version);
      beforeEach(server.start);
      afterEach(server.end);

      it('should return default', done => {
        server.send(locale => {
          assert.equal(locale.code, 'en_GB');
          assert.equal(locale.source, 'default');
          done();
        });
      });

      describe('sources', () => {
        before(() => {
          server.configure({
            'cookie': {'name': 'lang'},
            'priority': ['cookie', 'accept-language', 'default']
          });
        });
        it('should return locale from cookie', done => {
          server.send({
            'Cookie': 'lang=nl_BE'
          }, locale => {
            assert.equal(locale.code, 'nl_BE');
            assert.equal(locale.source, 'cookie');
            done();
          });
        });
      });

      describe('option allowed', () => {
        before(() => {
          server.configure({
            'allowed': ['de_AT', 'de_DE', 'de_CH']
          });
        });
        it('should return first allowed locale', done => {
          server.send({
            'Accept-Language': 'de,de-CH;q=0.8,en;q=0.6'
          }, locale => {
            assert.equal(locale.code, 'de_CH');
            assert.equal(locale.source, 'accept-language');
            done();
          });
        });
      });

      describe('option map.language', () => {
        before(() => {
          server.configure({
            'map': {'language': {'de': 'de_DE'}}
          });
        });
        it('should map language to full locale', done => {
          server.send({
            'Accept-Language': 'de,de-CH;q=0.8,en;q=0.6'
          }, locale => {
            assert.equal(locale.code, 'de_DE');
            assert.equal(locale.source, 'accept-language');
            done();
          });
        });
      });

      describe('option map.domain', () => {
        before(() => {
          server.configure({
            'map': {'domain': {'localhost': 'nl_BE'}},
            'priority': ['domain', 'default']
          });
        });
        it('should map request domain to locale', done => {
          server.send(locale => {
            assert.equal(locale.code, 'nl_BE');
            assert.equal(locale.source, 'domain');
            done();
          });
        });
      });
    });
  }

  runOnExpress(4);
  runOnExpress(3);
});
