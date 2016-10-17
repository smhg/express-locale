import createLocaleMiddleware from '..';
import assert from 'assert';
import http from 'http';
import express3 from 'express3';

describe('express-locale', () => {
  it('should return a function', () => {
    let type = typeof createLocaleMiddleware();
    assert.equal(type, 'function');
  });

  describe('request', () => {
    let app;
    let config = {};

    function startServer (done) {
      app = express3()
        .use(express3.cookieParser())
        .use(createLocaleMiddleware(config))
        .use((req, res, next) => {
          res.end(JSON.stringify(req.locale));
        })
        .listen(4000, done);
    }

    function endServer (done) {
      app.close(done);
    }

    function get (headers, callback) {
      let data = '';

      if (typeof headers === 'function') {
        callback = headers;
        headers = {};
      }

      http.get({
        host: 'localhost',
        port: 4000,
        headers: headers
      }, function (res) {
        res.on('data', chunk => {
          data += chunk;
        });
        res.on('end', () => {
          callback(JSON.parse(data));
        });
      });
    }

    beforeEach(startServer);
    afterEach(endServer);

    describe('using default configuration', () => {
      it('without any headers', done => {
        get(locale => {
          assert.equal(locale.code, 'en_GB');
          assert.equal(locale.source, 'default');
          done();
        });
      });
    });

    describe('using allowed option', () => {
      before(() => {
        config = require('./fixture/allowed.json');
      });
      it('with "Accept-Language: de,de-CH;q=0.8,en;q=0.6"', done => {
        get({
          'Accept-Language': 'de,de-CH;q=0.8,en;q=0.6'
        }, locale => {
          assert.equal(locale.code, 'de_CH');
          assert.equal(locale.source, 'accept-language');
          done();
        });
      });
    });

    describe('using map.language option', () => {
      before(() => {
        config = require('./fixture/map-language.json');
      });
      it('with "Accept-Language: de,de-CH;q=0.8,en;q=0.6"', done => {
        get({
          'Accept-Language': 'de,de-CH;q=0.8,en;q=0.6'
        }, locale => {
          assert.equal(locale.code, 'de_DE');
          assert.equal(locale.source, 'accept-language');
          done();
        });
      });
    });

    describe('using map.domain option', () => {
      before(() => {
        config = require('./fixture/map-domain.json');
      });
      it('without any headers', done => {
        get(locale => {
          assert.equal(locale.code, 'nl_BE');
          assert.equal(locale.source, 'domain');
          done();
        });
      });
    });

    describe('using cookie lookup', () => {
      before(() => {
        config = require('./fixture/cookie.json');
      });
      it('with "Cookie: locale=nl_BE"', done => {
        get({
          'Cookie': 'locale=nl_BE'
        }, locale => {
          assert.equal(locale.code, 'nl_BE');
          assert.equal(locale.source, 'cookie');
          done();
        });
      });
    });
  });
});
