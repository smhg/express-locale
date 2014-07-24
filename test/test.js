var locale = require('..'),
  assert = require('assert'),
  http = require('http'),
  express = require('express'),
  fs = require('fs');

describe('express-locale', function () {
  it('should return a function', function () {
    var type = typeof locale();
    assert.equal(type, 'function');
  });

  describe('request', function () {
    var app,
      config = {};

    function startServer(done) {
      app = express()
        .use(express.cookieParser())
        .use(locale(config))
        .use(function (req, res, next) {
          res.end(JSON.stringify(req.locale));
        })
        .listen(4000, done);
    }

    function endServer (done) {
      app.close(done);
    }

    function get(headers, callback) {
      var data = '';

      if (typeof headers === 'function') {
        callback = headers;
        headers = {};
      }

      http.get({
          host: 'localhost',
          port: 4000,
          headers: headers
        }, function (res) {
          res.on('data', function (chunk) {
            data += chunk;
          });
          res.on('end', function () {
            callback(JSON.parse(data));
          });
        });
    }

    beforeEach(startServer);
    afterEach(endServer);

    describe('using default configuration', function () {
      it('without any headers', function (done) {
        get(function(locale) {
          assert.equal(locale.code, 'en_GB');
          assert.equal(locale.source, 'default');
          done();
        });
      });
    });

    describe('using allowed option', function () {
      before(function () {
        config = require('./fixture/allowed.json');
      });
      it('with "Accept-Language: de,de-CH;q=0.8,en;q=0.6"', function (done) {
        get({
          'Accept-Language': 'de,de-CH;q=0.8,en;q=0.6'
        }, function(locale) {
          assert.equal(locale.code, 'de_CH');
          assert.equal(locale.source, 'accept-language');
          done();
        });
      });
    });

    describe('using map.language option', function () {
      before(function () {
        config = require('./fixture/map-language.json');
      });
      it('with "Accept-Language: de,de-CH;q=0.8,en;q=0.6"', function (done) {
        get({
          'Accept-Language': 'de,de-CH;q=0.8,en;q=0.6'
        }, function(locale) {
          assert.equal(locale.code, 'de_DE');
          assert.equal(locale.source, 'accept-language');
          done();
        });
      });
    });

    describe('using map.domain option', function () {
      before(function () {
        config = require('./fixture/map-domain.json');
      });
      it('without any headers', function (done) {
        get(function(locale) {
          assert.equal(locale.code, 'nl_BE');
          assert.equal(locale.source, 'domain');
          done();
        });
      });
    });

    describe('using cookie lookup', function () {
      before(function () {
        config = require('./fixture/cookie.json');
      });
      it('with "Cookie: locale=nl_BE"', function (done) {
        get({
          'Cookie': 'locale=nl_BE'
        }, function(locale) {
          assert.equal(locale.code, 'nl_BE');
          assert.equal(locale.source, 'cookie');
          done();
        });
      });
    });
  });
});
