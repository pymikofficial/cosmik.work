#!/usr/bin/env node
'use strict';

// Zero-dependency local preview server that mimics the Netlify setup:
// extensionless URLs resolve to .html files, and 301/200 rules in
// _redirects are honored so the retired cosmik.work paths can be tested.
// Usage: node scripts/serve.js [port]   (default 8080)

const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const PORT = Number(process.argv[2]) || 8080;

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.pdf': 'application/pdf',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
};

const rules = fs.readFileSync(path.join(ROOT, '_redirects'), 'utf8')
  .split('\n')
  .map((l) => l.trim())
  .filter((l) => l && !l.startsWith('#'))
  .map((l) => {
    const [from, to, status] = l.split(/\s+/);
    return { from, to, status: Number(status) || 301 };
  });

function send(res, status, file) {
  res.writeHead(status, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
}

http.createServer((req, res) => {
  let urlPath = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);

  const rule = rules.find((r) => r.from === urlPath);
  if (rule && rule.status >= 300 && rule.status < 400) {
    res.writeHead(rule.status, { Location: rule.to });
    res.end();
    console.log(`${rule.status} ${urlPath} -> ${rule.to}`);
    return;
  }
  if (rule) urlPath = rule.to;

  if (urlPath.endsWith('/')) urlPath += 'index.html';
  let file = path.join(ROOT, urlPath);
  if (!file.startsWith(ROOT)) {
    res.writeHead(403);
    res.end();
    return;
  }
  if (!path.extname(file) && fs.existsSync(`${file}.html`)) file = `${file}.html`;

  if (fs.existsSync(file) && fs.statSync(file).isFile()) {
    send(res, 200, file);
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('404 Not Found');
    console.log(`404 ${urlPath}`);
  }
}).listen(PORT, () => {
  console.log(`Serving ${ROOT} at http://localhost:${PORT}/`);
});
