// metro.config.js
const { getDefaultConfig } = require("expo/metro-config");
const path = require('path');
const { FileStore } = require('metro-cache');
const http = require('http');

const config = getDefaultConfig(__dirname);

// Use a stable on-disk store (shared across web/android)
const root = process.env.METRO_CACHE_ROOT || path.join(__dirname, '.metro-cache');
config.cacheStores = [
  new FileStore({ root: path.join(root, 'cache') }),
];

// Bind to all interfaces so Replit's proxy can reach the server
config.server = {
  ...config.server,
  host: '0.0.0.0',
};

// Proxy /download* and /api/* to backend port 8000
config.server.enhanceMiddleware = (middleware) => {
  return (req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');

    const isProxy = req.url.startsWith('/download') || req.url.startsWith('/api/');
    if (isProxy) {
      const options = {
        hostname: 'localhost',
        port: 8000,
        path: req.url,
        method: req.method,
        headers: req.headers,
      };
      const proxy = http.request(options, (backendRes) => {
        res.writeHead(backendRes.statusCode, backendRes.headers);
        backendRes.pipe(res, { end: true });
      });
      proxy.on('error', () => {
        res.writeHead(502);
        res.end('Backend unavailable');
      });
      req.pipe(proxy, { end: true });
      return;
    }

    return middleware(req, res, next);
  };
};

// Reduce the number of workers to decrease resource usage
config.maxWorkers = 2;

module.exports = config;
