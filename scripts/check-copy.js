#!/usr/bin/env node
'use strict';

// Copy linter for the site's house rules. Run before committing:
//   node scripts/check-copy.js
// Fails on: em dashes, contractions, retired identity terms, and
// "code is public" style claims, in any page, data file, or SEO file.
// The privacy page body is exempt from the dash/contraction rules because
// it is a verbatim copy of the published extension policy.

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const FILES = [
  'index.html', 'about.html', 'workflows/index.html', 'shipped.html', 'workflow-log.html', 'contact.html',
  'privacy-virtual-background.html', '404.html', 'partials/nav.html', 'partials/footer.html',
  'data/tools.json', 'data/metrics.json', 'data/library.json', 'llms.txt', 'robots.txt', 'sitemap.xml',
];
const STYLE_EXEMPT = new Set(['privacy-virtual-background.html']);

const RETIRED = [
  /chief of staff/i, /executive assistant/i, /\btrainer\b/i, /cosmik\s*work/i,
  /\bcos\s*\/\s*mik\b/i, /\bcos\b\s*[:=]/i,
];
const PUBLIC_CODE = [/code is public/i, /open[- ]source/i, /view (the )?source/i, /github\.com/i];
const CONTRACTION = /\b[A-Za-z]+['’](t|re|ve|ll|d|m)\b|\b(it|that|there|here|what|who|he|she|let)['’]s\b/i;
const EM_DASH = /—|&mdash;|&#8212;|&#x2014;/i;

// Strip markup that is not visible copy: tags, comments, JSON-LD is kept
// on purpose since search engines surface it.
function visibleText(src, file) {
  if (!file.endsWith('.html')) return src;
  return src
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script(?![^>]*ld\+json)[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ');
}

let problems = 0;
for (const rel of FILES) {
  const full = path.join(ROOT, rel);
  if (!fs.existsSync(full)) continue;
  const raw = fs.readFileSync(full, 'utf8');
  const lines = visibleText(raw, rel).split('\n');
  lines.forEach((line, i) => {
    const hits = [];
    // LinkedIn handle is the one approved exception for "cosmikwork".
    const scrubbed = line.replace(/linkedin\.com\/in\/cosmikwork\/?/gi, '');
    RETIRED.forEach((re) => re.test(scrubbed) && hits.push(`retired term ${re}`));
    PUBLIC_CODE.forEach((re) => re.test(line) && hits.push(`public-code claim ${re}`));
    if (!STYLE_EXEMPT.has(rel)) {
      if (EM_DASH.test(line)) hits.push('em dash');
      const m = line.match(CONTRACTION);
      if (m) hits.push(`contraction "${m[0]}"`);
    }
    for (const h of hits) {
      problems++;
      console.log(`${rel}:${i + 1}  ${h}\n    ${line.trim().slice(0, 140)}`);
    }
  });
}

if (problems) {
  console.log(`\n${problems} copy problem(s) found.`);
  process.exit(1);
}
console.log('Copy check passed.');
