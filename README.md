# cosmik.work

Personal site of Soumik Chatterjee, AI Specialist. End-to-end Claude workflows for business teams, community and member support, part-time AI training. Ex-Accenture, CampK12, Teach For India.

Static portfolio site. Netlify runs `npm run build` on every deploy, which runs the copy check first, and serves the repo root. Every push to `main` deploys. Building before committing is not needed. Edit a page, a partial or a data file, then push. Repo files that are not part of the site, such as `scripts/`, `data/`, `partials/`, this README and `package.json`, return 404 on the live site through rules at the top of `_redirects`.

## Homepage

The homepage is one page read top to bottom: Hero, Selected work (TriageOps first), the 14 tools, a short About, two quotes, then Contact with the Calendly button. The nav links jump to those sections (`#work`, `#tools`, `#about`, `#said`, `#contact`) and `js/nav.js` marks the one in view. Each section ends with a Read more link to its full page, the Workflow Log, Shipped, About and /said. The old /contact page now lives in the Contact section, and `_redirects` sends /contact, /contact.html and the retired workflows paths to `/#contact`. The privacy page keeps its address, the Chrome Web Store links to it.

## Commands

- `npm run build`: stamps `partials/` into every page and renders `data/*.json` into Shipped and Workflow Log. Netlify runs this on deploy. Run it locally only to preview changes.
- `npm run check`: copy linter for the house rules (no em or en dashes, semicolons, colons in prose, contractions, first or second person, US spellings, exclamation marks, phone numbers or retired terms). Netlify runs it before every build, so a failing check stops the deploy.
- `npm run serve`: local preview at http://localhost:8080 with extensionless URLs and `_redirects` rules. Run `npm run build` first so the preview matches what Netlify will publish.

## Adding a tool

Add one entry to `data/tools.json` (`name`, `date` as YYYY-MM-DD, `problem`, `line`, `link`, `era`, optional `flagship`), run `npm run check`, and push. Netlify renders it on the next deploy.

The homepage shows every tool from `data/tools.json` and `data/library.json` as a chip under the era of work it replaces. Two more fields drive that: `era` (one of Recruitment and operations, Classrooms, Startup and EdTech clients, Chrome extensions, Process and SOPs, missing means Process and SOPs) and `line` (one sentence shown on hover, on tap on a phone, and in the Workflow Log build log). A library entry's `users` figure, the public Chrome Web Store count, is shown as a small tag on its chip and on the Shipped page and Workflow Log, so update it in one place.

## CV

`scripts/cv.py` builds `assets/docs/soumik-chatterjee-cv.pdf` with ReportLab (`python3 scripts/cv.py`). After a rebuild, bump the `?v=` key on every CV link (`partials/nav.html` and the CV buttons on Home and About) so browsers fetch the new file.

## TriageOps demo video

The featured TriageOps block on the homepage has a hidden video slot. Set `data-video` on the `figure.case-video` element in `index.html` to a self-hosted MP4 (and `data-poster` to a JPG if there is one) and it appears. A file on another host also needs a `media-src` directive naming that host added to the Content-Security-Policy in `_headers` (and `img-src` for a poster on another host).
