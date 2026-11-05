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
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
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
    return { from, to, status: parseInt(status, 10) || 301 };
  })
  // Host-qualified rules (the old storefront subdomain) never match locally.
  .filter((r) => r.from.startsWith('/'));

// Netlify matching, first rule wins: exact paths, and "/dir/*" as a prefix.
function matchRule(urlPath) {
  return rules.find((r) => (r.from.endsWith('/*')
    ? urlPath === r.from.slice(0, -2) || urlPath.startsWith(r.from.slice(0, -1))
    : r.from === urlPath));
}
const NOT_FOUND = path.join(ROOT, '404.html');

function send(res, status, file) {
  res.writeHead(status, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
}

http.createServer((req, res) => {
  let urlPath = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);

  const rule = matchRule(urlPath);
  if (rule && rule.status === 404) {
    send(res, 404, NOT_FOUND);
    console.log(`404 ${urlPath} (rule)`);
    return;
  }
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
    send(res, 404, NOT_FOUND);
    console.log(`404 ${urlPath}`);
  }
}).listen(PORT, () => {
  console.log(`Serving ${ROOT} at http://localhost:${PORT}/`);
});
