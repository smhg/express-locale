var locale = require('..'),
  assert = require('assert'),
  http = require('http'),
  express = require('express');

describe('express-locale', function () {
  it('should return a function', function () {
    var type = typeof locale();
    assert.equal(type, 'function');
  });

  describe('request', function () {
    var app;

    function openServer(localeConfig) {
      return function (done) {
        app = express()
          .use(locale(localeConfig))
          .use(function (req, res, next) {
            res.end(JSON.stringify({locale: req.locale, source: req.localeSource}));
          })
          .listen(4000, done);
      };
    }

    function closeServer (done) {
      app.close(done);
    }

    function get(options, done) {
      var data = '';
      http.get(options, function (res) {
        res.on('data', function (chunk) {
          data += chunk;
        });
        res.on('end', function () {
          done(JSON.parse(data));
        });
      });
    }

    describe('using default configuration', function () {
      before(openServer());
      it('without any headers', function (done) {
        get({
          host: 'localhost',
          port: 4000
        }, function(data) {
          assert.equal(data.locale, 'en_US');
          assert.equal(data.source, 'default');
          done();
        });
      });
      after(closeServer);
    });

    describe('using allowed list of locales', function () {
      before(openServer({
        allowed: ['de_AT', 'de_DE', 'de_CH'],
        priority: ['user-agent']
      }));
      it('with Accept header which should match a locale with a dash at the second place', function (done) {
        get({
          host: 'localhost',
          port: 4000,
          headers: {
            'Accept-Language': 'de,de-AT;q=0.8,en;q=0.6'
          }
        }, function(data) {
          assert.equal(data.locale, 'de_AT');
          assert.equal(data.source, 'user-agent');
          done();
        });
      });
      after(closeServer);
    });

    describe('using mapping with default fallback', function () {
      before(openServer({
        mapping: {
          "default": {
            "en": "en_UK"
          }
        },
        "default": 'en_UK',
        priority: ['user-agent', 'default']
      }));
      it('with Accept header which should the default locale after mapping', function (done) {
        get({
          host: 'localhost',
          port: 4000,
          headers: {
            'Accept-Language': 'de;q=0.8,en;q=0.6'
          }
        }, function(data) {
          assert.equal(data.locale, 'en_UK');
          assert.equal(data.source, 'user-agent');
          done();
        });
      });
      after(closeServer);
    });
  });
});
