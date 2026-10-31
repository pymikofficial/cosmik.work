#!/usr/bin/env node
'use strict';

// Stamps partials/nav.html and partials/footer.html into each page between
// the <!-- NAV:START/END --> and <!-- FOOTER:START/END --> markers, and
// renders the data-driven sections from data/*.json between their own
// markers, so shared markup and content live in one place.
// Run after editing a partial, a page, or a data file: node scripts/build.js
// Output is plain static HTML committed to git: Netlify just serves the
// files as-is, and crawlers see every card without running any JS.
//
// Adding a tool = adding one entry to data/tools.json, then running this.
// Adding a metric card = adding one entry to data/metrics.json.
// An entry with "review": true is emitted with a <!-- REVIEW --> marker.

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SITE = 'https://cosmik.work';
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const NAV_PARTIAL = read('partials/nav.html');
const FOOTER_PARTIAL = read('partials/footer.html');
const TOOLS = JSON.parse(read('data/tools.json'));
const METRICS = JSON.parse(read('data/metrics.json'));
const LIBRARY = JSON.parse(read('data/library.json'));

const MAP_ATTRIB = '\n  <div class="fl-attrib">World map: Al MacDonald / Fritz Lekschas, <a href="https://creativecommons.org/licenses/by-sa/3.0/" target="_blank" rel="noopener">CC BY-SA 3.0</a></div>';

const PAGES = [
  { file: 'index.html', active: 'home' },
  { file: 'about.html', active: 'about' },
  { file: 'said.html', active: '' },
  { file: 'shipped.html', active: 'shipped' },
  { file: 'workflow-log.html', active: 'log' },
  { file: 'contact.html', active: 'contact' },
  { file: 'privacy-virtual-background.html', active: 'privacy' },
  { file: '404.html', active: 'none' },
];

// ---- validation: fail the build on a malformed data entry ----
const TOOL_FIELDS = ['name', 'problem', 'link'];
const METRIC_FIELDS = ['name', 'what', 'stage', 'lever', 'whereUsed'];
function validate(list, fields, file) {
  list.forEach((entry, i) => {
    for (const f of fields) {
      if (typeof entry[f] !== 'string' || !entry[f].trim()) {
        throw new Error(`${file} entry ${i} (${entry.name || '?'}) is missing "${f}"`);
      }
    }
  });
}
validate(TOOLS, TOOL_FIELDS, 'data/tools.json');
validate(METRICS, METRIC_FIELDS, 'data/metrics.json');
validate(LIBRARY, ['name', 'tag', 'desc', 'link', 'date'], 'data/library.json');
[...TOOLS, ...LIBRARY].forEach((t) => {
  if (t.date !== undefined && !/^\d{4}-\d{2}-\d{2}$/.test(t.date)) throw new Error(`data/tools.json: "${t.name}" date must be YYYY-MM-DD when present`);
});

// ---- helpers ----
function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
function fmtDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

const review = (entry, indent) => (entry.review ? `${indent}<!-- REVIEW -->\n` : '');

// Newest first; ties keep their order in the JSON file.
const toolsByDate = TOOLS.map((t, i) => ({ t, i }))
  .sort((a, b) => (b.t.date || '').localeCompare(a.t.date || '') || a.i - b.i)
  .map((x) => x.t);

// Flagship tools lead the Shipped grid, the rest follow newest first.
const toolsForGrid = [...toolsByDate].sort((a, b) => Number(!!b.flagship) - Number(!!a.flagship));

// ---- renderers ----
function renderToolCards() {
  return toolsForGrid.map((t) => {
    const i = '        ';
    return `${review(t, i)}${i}<a class="tool-card-link${t.flagship ? ' is-flagship' : ''}" href="${esc(t.link)}" target="_blank" rel="noopener" aria-label="${esc(t.name)} (opens in a new tab)">
${i}  <article class="ship-card tool-card">
${i}    <p class="ship-tag">${t.date ? esc(fmtDate(t.date)) : 'Live'}${t.flagship ? ' · Flagship' : ''}</p>
${i}    <h2 class="ship-name">${esc(t.name)}</h2>
${i}    <p class="ship-desc">${esc(t.problem)}</p>
${i}    <p class="tool-meta"><span>Free to try</span><span class="tool-open">Open <span aria-hidden="true">&#8599;</span></span></p>
${i}  </article>
${i}</a>`;
  }).join('\n');
}

function renderMetricCards() {
  return METRICS.map((m) => {
    const i = '        ';
    return `${review(m, i)}${i}<article class="metric-card">
${i}  <h3 class="metric-name">${esc(m.name)}</h3>
${i}  <dl class="metric-dl">
${i}    <div><dt>What it is</dt><dd>${esc(m.what)}</dd></div>
${i}    <div><dt>When it matters</dt><dd>${esc(m.stage)}</dd></div>
${i}    <div><dt>How I move it</dt><dd>${esc(m.lever)}</dd></div>
${i}    <div class="metric-used"><dt>In my work</dt><dd>${esc(m.whereUsed)}</dd></div>
${i}  </dl>
${i}</article>`;
  }).join('\n');
}

function renderBuildLog() {
  const entries = [
    ...TOOLS.map((t) => ({ name: t.name, link: t.link, date: t.date, text: t.problem, meta: t.buildTime ? 'Built in ' + t.buildTime : 'Free to try' })),
    ...LIBRARY.map((l) => ({ name: l.name, link: l.link, date: l.date, text: l.desc, meta: l.users ? l.tag + ' · ' + l.users : l.tag })),
  ].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  return entries.map((t) => {
    const i = '        ';
    return `${i}<li class="log-item">
${i}  ${t.date ? `<time class="log-date mono" datetime="${esc(t.date)}">${esc(fmtDate(t.date))}</time>` : '<span class="log-date mono">Live</span>'}
${i}  <div class="log-body">
${i}    <h3 class="log-name"><a href="${esc(t.link)}" target="_blank" rel="noopener">${esc(t.name)} <span aria-hidden="true">&#8599;</span><span class="visually-hidden"> (opens in a new tab)</span></a></h3>
${i}    <p class="log-problem">${esc(t.text)}</p>
${i}    <p class="log-meta mono">${esc(t.meta)}</p>
${i}  </div>
${i}</li>`;
  }).join('\n');
}

const isExtension = (l) => /chrome extension/i.test(l.tag || '');
function renderLibraryItems(items) {
  return items.map((l) => {
    const i = '        ';
    return `${i}<li><a href="${esc(l.link)}" target="_blank" rel="noopener"><span class="lib-name">${esc(l.name)}</span><span class="lib-tag">${esc(l.tag)}${l.users ? ' · ' + esc(l.users) : ''}</span><span class="lib-desc">${esc(l.desc)}</span><span class="visually-hidden"> (opens in a new tab)</span></a></li>`;
  }).join('\n');
}
function renderLibrary() { return renderLibraryItems(LIBRARY.filter((l) => !isExtension(l))); }
function renderExtensions() { return renderLibraryItems(LIBRARY.filter(isExtension)); }

function renderToolsLd() {
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    '@id': `${SITE}/shipped#tools`,
    name: 'Workflow tools built by Soumik Chatterjee',
    itemListElement: toolsForGrid.map((t, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      item: {
        '@type': 'SoftwareApplication',
        name: t.name,
        url: t.link,
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web',
        ...(t.date ? { datePublished: t.date } : {}),
        description: t.problem,
        creator: { '@id': `${SITE}/#person` },
      },
    })),
  };
  return `<script type="application/ld+json">\n${JSON.stringify(ld, null, 2)}\n</script>`;
}

const SECTIONS = {
  TOOLS: renderToolCards,
  METRICS: renderMetricCards,
  BUILDLOG: renderBuildLog,
  TOOLSLD: renderToolsLd,
  LIBRARY: renderLibrary,
  EXTENSIONS: renderExtensions,
};

// ---- stamping ----
function navTokens(active) {
  return {
    HOME_CLASS: active === 'home' ? 'active' : '',
    ABOUT_CLASS: active === 'about' ? 'active' : '',
    SHIPPED_CLASS: active === 'shipped' ? 'active' : '',
    LOG_CLASS: active === 'log' ? 'active' : '',
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

  // Data sections are optional per page: render only the markers present.
  for (const [name, render] of Object.entries(SECTIONS)) {
    if (html.includes(`<!-- ${name}:START -->`)) {
      html = replaceBetween(html, `<!-- ${name}:START -->`, `<!-- ${name}:END -->`, render());
    }
  }

  if (html !== before) {
    fs.writeFileSync(filePath, html);
    changed++;
    console.log(`updated ${page.file}`);
  } else {
    console.log(`unchanged ${page.file}`);
  }
}

console.log(`\n${changed} file(s) written from partials/ and data/`);
