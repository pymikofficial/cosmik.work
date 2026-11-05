#!/usr/bin/env node
'use strict';

// Copy linter for the site's house rules. Netlify runs it before every build
// (npm run build), so a failure stops the deploy. Run it locally with
//   node scripts/check-copy.js
//
// Checked on visible text, on meta, alt, aria-label and title attributes, and
// on the string literals in scripts/cv.py, which builds the CV:
//   em and en dashes, spaced hyphens used as dashes, semicolons, colons in
//   prose, contractions, exclamation marks, first and second person, US
//   spellings, phone and WhatsApp numbers, and CosmikWork named as a company.
// Quotes from other people inside <blockquote> keep their own wording and are
// skipped for person, spelling, colon and semicolon checks.
// The privacy page body is a copy of the published extension policy, so only
// its head is checked for style. The CV may carry the work phone number, the
// site may not.

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const FILES = [
  'index.html', 'about.html', 'said.html', 'shipped.html', 'workflow-log.html',
  'privacy-virtual-background.html', '404.html', 'partials/nav.html', 'partials/footer.html',
  'data/tools.json', 'data/metrics.json', 'data/library.json', 'llms.txt', 'robots.txt', 'sitemap.xml',
  'README.md', 'scripts/cv.py',
];
const POLICY_BODY_EXEMPT = new Set(['privacy-virtual-background.html']);
const PHONE_ALLOWED = new Set(['scripts/cv.py']);

const RETIRED = [/chief of staff/i, /executive assistant/i, /cosmik[\s_-]*work\b/i, /\bcos\s*\/\s*mik\b/i, /\bcos\b\s*[:=]/i];
const EM_DASH = /—|&mdash;|&#8212;|&#x2014;/i;
const EN_DASH = /–|&ndash;|&#8211;|&#x2013;|\s-\s/i;
const SEMICOLON = /;/;
const COLON_PROSE = /[A-Za-z]:\s+[A-Za-z]/;
const EXCLAIM = /!/;
const CONTRACTION = /\b[A-Za-z]+['’](t|re|ve|ll|d|m)\b|\b(it|that|there|here|what|who|he|she|let)['’]s\b/i;
const PERSON = /\b(I|me|my|mine|we|our|ours|you|your|yours|Me|My|Mine|We|Our|Ours|You|Your|Yours)\b/;
const US_SPELLING = /\b\w*(organiz|optimiz|prioritiz|standardiz|personaliz|summariz|recogniz|analyz|utiliz|behavior|favorite|labeled|catalog\b|center\b|program\b|programs\b)\w*/i;
// Product names and URLs that keep their published spelling.
// schema.org type names are a fixed vocabulary, so JSON-LD "@type" values are skipped too.
const SPELLING_OK = /Cold Outreach Personalizer|GitHub Profile Summarizer|cold-outreach-personalizer|github-profile-summarizer|"@type": "[A-Za-z]+"/g;
const PHONE = /(?:\+\d{1,3}[\s-]?)?(?:\d[\s-]?){9,}\d|wa\.me\/|\btel:/i;

const decode = (s) => s
  .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n))
  .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)));

// Visible text plus copy-bearing attributes, line by line so line numbers hold.
function htmlLines(src, file) {
  let s = src
    .replace(/<!--[\s\S]*?-->/g, (m) => m.replace(/[^\n]/g, ' '))
    .replace(/<style[\s\S]*?<\/style>/gi, (m) => m.replace(/[^\n]/g, ' '))
    .replace(/<script(?![^>]*ld\+json)[\s\S]*?<\/script>/gi, (m) => m.replace(/[^\n]/g, ' '));
  if (POLICY_BODY_EXEMPT.has(file)) s = s.replace(/<main[\s\S]*?<\/main>/i, (m) => m.replace(/[^\n]/g, ' '));
  // Mark quoted lines so the person and spelling checks can skip them.
  s = s.replace(/<blockquote[\s\S]*?<\/blockquote>/gi, (m) => m.replace(/^/gm, '\u0001'));
  return s.split('\n').map((line) => {
    const quoted = line.includes('\u0001');
    const attrs = [];
    line.replace(/\b(content|alt|aria-label|title|placeholder)="([^"]*)"/gi, (_, a, v) => { attrs.push(v); return ''; });
    const text = line.replace(/\u0001/g, '').replace(/<[^>]+>/g, ' ');
    return { text: decode([text, ...attrs].join(' ')), quoted };
  });
}

// String literals in the CV builder. Python escapes for quotes are undone.
function pyLines(src) {
  return src.split('\n').map((line) => {
    const parts = [];
    line.replace(/'((?:\\'|[^'])*)'|"((?:\\"|[^"])*)"/g, (_, a, b) => { parts.push((a ?? b).replace(/\\'/g, "'").replace(/\\"/g, '"')); return ''; });
    return { text: decode(parts.join(' ').replace(/<[^>]+>/g, ' ')), quoted: false };
  });
}

function textLines(src, file) {
  return src.split('\n').map((line) => ({
    // llms.txt and README list labels such as "- Email: x" are format, not prose.
    text: (file === 'llms.txt' || file === 'README.md') ? line.replace(/^\s*-\s+[A-Z][\w ]*:\s/, '- ') : line,
    quoted: false,
  }));
}

let problems = 0;
for (const rel of FILES) {
  const full = path.join(ROOT, rel);
  if (!fs.existsSync(full)) continue;
  const raw = fs.readFileSync(full, 'utf8');
  const lines = rel.endsWith('.html') ? htmlLines(raw, rel) : rel.endsWith('.py') ? pyLines(raw) : textLines(raw, rel);
  const isData = rel.endsWith('.json') || rel.endsWith('.xml') || rel === 'robots.txt';
  lines.forEach(({ text, quoted }, i) => {
    if (!text.trim()) return;
    const hits = [];
    RETIRED.forEach((re) => re.test(text) && hits.push(`retired term ${re}`));
    if (EM_DASH.test(text)) hits.push('em dash');
    const c = text.match(CONTRACTION);
    if (c) hits.push(`contraction "${c[0]}"`);
    if (!PHONE_ALLOWED.has(rel) && PHONE.test(text)) hits.push('phone or WhatsApp number');
    if (!quoted && !isData) {
      // README and the CV source are about code, so dashes in code spans are fine there.
      const prose = text.replace(/`[^`]*`/g, ' ').replace(/https?:\/\/\S+/g, ' ');
      if (EN_DASH.test(prose)) hits.push('en dash or spaced hyphen');
      if (SEMICOLON.test(prose)) hits.push('semicolon');
      if (COLON_PROSE.test(prose)) hits.push('colon in prose');
      if (EXCLAIM.test(prose)) hits.push('exclamation mark');
      const p = prose.match(PERSON);
      if (p) hits.push(`first or second person "${p[0]}"`);
      const u = prose.replace(SPELLING_OK, ' ').match(US_SPELLING);
      if (u) hits.push(`US spelling "${u[0]}"`);
    } else if (isData) {
      const prose = text.replace(/https?:\/\/\S+/g, ' ');
      if (EN_DASH.test(prose)) hits.push('en dash or spaced hyphen');
      if (SEMICOLON.test(prose)) hits.push('semicolon');
      if (EXCLAIM.test(prose)) hits.push('exclamation mark');
      const p = prose.match(PERSON);
      if (p) hits.push(`first or second person "${p[0]}"`);
      const u = prose.replace(SPELLING_OK, ' ').match(US_SPELLING);
      if (u) hits.push(`US spelling "${u[0]}"`);
    }
    for (const h of hits) {
      problems++;
      console.log(`${rel}:${i + 1}  ${h}\n    ${text.trim().slice(0, 140)}`);
    }
  });
}

if (problems) {
  console.log(`\n${problems} copy problem(s) found.`);
  process.exit(1);
}
console.log('Copy check passed.');
