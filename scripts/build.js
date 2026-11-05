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
// The homepage groups every tool into an era chip row: set "era" (one of
// ERAS below, missing means Process and SOPs) and "line" (one sentence for
// the hover and tap description) on the entry. A library entry's "users"
// figure, the Chrome Web Store count, is shown as a small tag on its chip.
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
  // The homepage is one long page and the nav jumps between its sections.
  // On the other pages the nav links back to those sections, and "active"
  // names the homepage section the page belongs to.
  { file: 'index.html', active: 'home' },
  { file: 'about.html', active: 'about' },
  { file: 'said.html', active: 'said' },
  { file: 'shipped.html', active: 'tools' },
  { file: 'workflow-log.html', active: 'work' },
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

// Eras for the homepage chip rows, in display order. A tool whose "era" is
// missing lands in the last group, Process and SOPs.
const ERAS = [
  { name: 'Recruitment and operations', when: 'CampK12, 2020 to 2023' },
  { name: 'Classrooms', when: 'Teach For India, 2024 to 2026' },
  { name: 'Startup and EdTech clients', when: 'AI Specialist, since Feb 2026' },
  { name: 'Chrome extensions', when: 'For his own video calls, 2026' },
  { name: 'Process and SOPs', when: 'Every role' },
];
const ERA_NAMES = ERAS.map((e) => e.name);
const DEFAULT_ERA = ERA_NAMES[ERA_NAMES.length - 1];
[...TOOLS, ...LIBRARY].forEach((t) => {
  if (t.era !== undefined && !ERA_NAMES.includes(t.era)) throw new Error(`"${t.name}" era must be one of: ${ERA_NAMES.join(', ')}`);
  if (t.line !== undefined && (typeof t.line !== 'string' || !t.line.trim())) throw new Error(`"${t.name}" line must be a non-empty string when present`);
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
    return `${review(t, i)}${i}<a class="tool-card-link${t.flagship ? ' is-flagship' : ''}" href="${esc(t.link)}" target="_blank" rel="noopener">
${i}  <article class="ship-card tool-card">
${i}    <p class="ship-tag">${t.date ? esc(fmtDate(t.date)) : 'Live'}${t.flagship ? ' · Flagship' : ''}</p>
${i}    <h3 class="ship-name">${esc(t.name)}</h3>
${i}    <p class="ship-desc">${esc(t.problem)}</p>
${i}    <p class="tool-meta"><span>Free to try</span><span class="tool-open">Open <span aria-hidden="true">&#8599;</span><span class="visually-hidden"> (opens in a new tab)</span></span></p>
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
${i}    <div><dt>How he moves it</dt><dd>${esc(m.lever)}</dd></div>
${i}    <div class="metric-used"><dt>In his work</dt><dd>${esc(m.whereUsed)}</dd></div>
${i}  </dl>
${i}</article>`;
  }).join('\n');
}

function renderBuildLog() {
  const entries = [
    // One short line per tool and one kind of meta per row, the era of work it comes from.
    ...TOOLS.map((t) => ({ name: t.name, link: t.link, date: t.date, text: t.line || t.problem, meta: t.era || DEFAULT_ERA })),
    ...LIBRARY.map((l) => ({ name: l.name, link: l.link, date: l.date, text: l.line || l.desc, meta: (l.era || DEFAULT_ERA) + (l.users ? ' · ' + l.users : '') })),
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
    name: 'Tools built by Soumik Chatterjee',
    // All 14: the AI tools, then the library tools and the two Chrome extensions.
    itemListElement: [...toolsForGrid, ...LIBRARY.filter((l) => !isExtension(l)), ...LIBRARY.filter(isExtension)].map((t, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      item: {
        '@type': 'SoftwareApplication',
        name: t.name,
        url: t.link,
        applicationCategory: isExtension(t) ? 'BrowserApplication' : 'BusinessApplication',
        operatingSystem: isExtension(t) ? 'Chrome' : 'Web',
        ...(t.date ? { datePublished: t.date } : {}),
        description: t.problem || t.desc,
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'GBP' },
        creator: { '@id': `${SITE}/#person` },
      },
    })),
  };
  return `<script type="application/ld+json">\n${JSON.stringify(ld, null, 2)}\n</script>`;
}

// Every page carries the same Person and TriageOps graph, so name searches
// and job searches see one consistent entity wherever they land. sameAs takes
// the Chrome Web Store listings from data/library.json.
function renderPersonLd() {
  const ld = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Person',
        '@id': `${SITE}/#person`,
        name: 'Soumik Chatterjee',
        url: `${SITE}/`,
        image: `${SITE}/img/soumik-portrait.jpg`,
        jobTitle: 'AI Specialist',
        description: 'AI Specialist working remotely from Kolkata. Claude workflows, AI automation, community and member support, and part-time AI training. Ex-Accenture, CampK12, Teach For India.',
        email: ['mailto:soumik@cosmik.work', 'mailto:soumik2808@gmail.com'],
        address: {
          '@type': 'PostalAddress',
          addressLocality: 'Kolkata',
          addressRegion: 'West Bengal',
          addressCountry: 'IN',
        },
        homeLocation: { '@type': 'Place', name: 'Kolkata, West Bengal, India' },
        alumniOf: ['Accenture', 'CampK12', 'Teach For India'].map((name) => ({ '@type': 'Organization', name })),
        knowsAbout: ['Claude', 'Claude Code', 'AI agents', 'AI workflow automation', 'Community support', 'AI training'],
        sameAs: [
          'https://www.linkedin.com/in/soumikaispecialist/',
          'https://github.com/pymikofficial',
          ...LIBRARY.filter(isExtension).map((l) => l.link),
        ],
      },
      {
        '@type': 'SoftwareApplication',
        '@id': `${SITE}/#triageops`,
        name: 'TriageOps',
        url: 'https://triageops.vercel.app',
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web',
        datePublished: '2026-11-04',
        description: 'An AI service desk for IT managed service providers. Claude triages each ticket, sets its priority and team, and drafts the reply from the provider\'s own runbooks.',
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'GBP' },
        author: { '@id': `${SITE}/#person` },
        creator: { '@id': `${SITE}/#person` },
      },
    ],
  };
  return `<script type="application/ld+json">\n${JSON.stringify(ld, null, 2)}\n</script>`;
}

// Homepage: every tool as a chip under its era, newest first inside a group.
// The chip links to the tool. The sibling span is the hover and tap
// description, wired to the link with aria-describedby. A "users" figure is
// written inside the chip as a small tag.
function renderToolChips() {
  const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const all = [...TOOLS, ...LIBRARY].map((t, i) => ({ t, i }))
    .sort((a, b) => (b.t.date || '').localeCompare(a.t.date || '') || a.i - b.i)
    .map((x) => x.t);
  const i = '            ';
  return ERAS.map((era) => {
    const items = all.filter((t) => (t.era || DEFAULT_ERA) === era.name);
    if (!items.length) return '';
    const chip = (t) => {
      const id = `tip-${slug(t.name)}`;
      const tag = t.users ? `<span class="tchip-tag">${esc(t.users)}</span>` : '';
      return `${i}    <span class="tchip-wrap">
${i}      <a class="tchip" href="${esc(t.link)}" target="_blank" rel="noopener" aria-describedby="${id}">${esc(t.name)}${tag}<span class="visually-hidden"> (opens in a new tab)</span></a>
${i}      <span class="tchip-tip" id="${id}" role="tooltip">${esc(t.line || t.desc || t.problem)}<span class="tchip-go" aria-hidden="true">Tap again to open &#8599;</span></span>
${i}    </span>`;
    };
    const chips = items.map(chip).join('\n');
    return `${i}<div class="tool-era">
${i}  <dt class="tool-era-name">${esc(era.name)}<span class="tool-era-when">${esc(era.when)}</span></dt>
${i}  <dd class="tchip-row">
${chips}
${i}  </dd>
${i}</div>`;
  }).filter(Boolean).join('\n');
}

const SECTIONS = {
  TOOLS: renderToolCards,
  TOOLCHIPS: renderToolChips,
  METRICS: renderMetricCards,
  BUILDLOG: renderBuildLog,
  TOOLSLD: renderToolsLd,
  PERSONLD: renderPersonLd,
  LIBRARY: renderLibrary,
  EXTENSIONS: renderExtensions,
};

// ---- stamping ----
// On the homepage the links are plain #section jumps and js/nav.js marks the
// section in view. Elsewhere they point at /#section.
function navTokens(active) {
  const home = active === 'home';
  const cls = (name) => (active === name ? 'active' : '');
  return {
    BASE: home ? '' : '/',
    HOME_HREF: home ? '#hero' : '/',
    WORK_CLASS: cls('work'),
    BIP_CLASS: cls('build-in-public'),
    TOOLS_CLASS: cls('tools'),
    ABOUT_CLASS: cls('about'),
    SAID_CLASS: cls('said'),
    CONTACT_CLASS: cls('contact'),
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

  if (!before.includes('<!-- PERSONLD:START -->')) throw new Error(`${page.file} is missing the <!-- PERSONLD:START/END --> markers`);
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
