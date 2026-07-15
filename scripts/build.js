#!/usr/bin/env node
'use strict';

// Stamps partials/nav.html and partials/footer.html into each page between
// the <!-- NAV:START/END --> and <!-- FOOTER:START/END --> markers, so the
// shared markup lives in one place instead of being copy-pasted per page.
// Run after editing a partial or adding a page: node scripts/build.js
// Output is plain static HTML committed to git — Netlify's deploy is
// unchanged, it still just serves the files as-is.

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const NAV_PARTIAL = fs.readFileSync(path.join(ROOT, 'partials', 'nav.html'), 'utf8');
const FOOTER_PARTIAL = fs.readFileSync(path.join(ROOT, 'partials', 'footer.html'), 'utf8');

const MAP_ATTRIB = '\n  <div class="fl-attrib">World map: Al MacDonald / Fritz Lekschas, <a href="https://creativecommons.org/licenses/by-sa/3.0/" target="_blank" rel="noopener">CC BY-SA 3.0</a></div>';

const PAGES = [
  { file: 'index.html', active: 'home', mapAttrib: true },
  { file: 'shipped.html', active: 'shipped', mapAttrib: false },
  { file: 'systems.html', active: 'systems', mapAttrib: false },
  { file: 'contact.html', active: 'contact', mapAttrib: false },
  { file: 'privacy-virtual-background.html', active: 'privacy', mapAttrib: false },
];

function navTokens(active) {
  return {
    HOME_CLASS: active === 'home' ? 'active' : '',
    SHIPPED_CLASS: active === 'shipped' ? 'nav-featured active' : 'nav-featured',
    SYSTEMS_CLASS: active === 'systems' ? 'active' : '',
  };
}

function fill(template, tokens) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    if (!(key in tokens)) throw new Error(`Missing token ${key} in partial`);
    return tokens[key];
  });
}

function replaceBetween(source, startMarker, endMarker, replacement) {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker);
  if (start === -1 || end === -1) {
    throw new Error(`Markers ${startMarker} / ${endMarker} not found`);
  }
  const before = source.slice(0, start + startMarker.length);
  const after = source.slice(end);
  return `${before}\n${replacement}\n${after}`;
}

let changed = 0;
for (const page of PAGES) {
  const filePath = path.join(ROOT, page.file);
  const before = fs.readFileSync(filePath, 'utf8');

  const nav = fill(NAV_PARTIAL, navTokens(page.active)).trim();
  const footer = fill(FOOTER_PARTIAL, { MAP_ATTRIB: page.mapAttrib ? MAP_ATTRIB : '' }).trim();

  let html = replaceBetween(before, '<!-- NAV:START -->', '<!-- NAV:END -->', nav);
  html = replaceBetween(html, '<!-- FOOTER:START -->', '<!-- FOOTER:END -->', footer);

  if (html !== before) {
    fs.writeFileSync(filePath, html);
    changed++;
    console.log(`updated ${page.file}`);
  } else {
    console.log(`unchanged ${page.file}`);
  }
}

console.log(`\n${changed} file(s) written from partials/`);
