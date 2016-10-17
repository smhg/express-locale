import createLocaleMiddleware from '../..';
import http from 'http';
import express3 from 'express3';
import express4 from 'express';
import cookieParser from 'cookie-parser';

let createServer = (version = 4) => {
  let app;
  let config = {};

  return {
    configure: options => {
      config = options;
    },
    start: done => {
      app = (version === 3 ? express3 : express4)()
        .use(version === 3 ? express3.cookieParser() : cookieParser())
        .use(createLocaleMiddleware(config))
        .use((req, res, next) => {
          res.end(JSON.stringify(req.locale));
        })
        .listen(4000, done);
    },
    end: done => {
      app.close(done);
    },
    send: (headers, callback) => {
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
  };
};

export default createServer;
