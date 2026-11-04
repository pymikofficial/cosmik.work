# cosmik.work

Personal site of Soumik Chatterjee, AI Specialist. Community and member support, AI workflows, part-time AI training.

Static portfolio site. Netlify runs `npm run build` on every deploy and serves the repo root, and it auto-deploys every push to `main`. You do not need to build before committing: edit a page, a partial, or a data file, then push.

## Commands

- `npm run build`: stamps `partials/` into every page and renders `data/*.json` into Shipped and Workflow Log. Netlify runs this on deploy. Run it locally only to preview changes.
- `npm run check`: copy linter (no em dashes, no contractions, no retired terms, no public-code claims)
- `npm run serve`: local preview at http://localhost:8080 with extensionless URLs and `_redirects` rules. Run `npm run build` first so the preview matches what Netlify will publish.

## Adding a tool

Add one entry to `data/tools.json` (`name`, `date` as YYYY-MM-DD, `problem`, `link`, `buildTime`, optional `flagship`), run `npm run check`, and push. Netlify renders it on the next deploy.

The homepage shows every tool from `data/tools.json` and `data/library.json` as a chip under the era of work it replaces. Two more fields drive that: `era` (one of Engineering, Recruitment and operations, Classrooms, Founder's office, Process and SOPs, missing means Process and SOPs) and `line` (one sentence shown on hover, and on tap on a phone). An optional `homeTag` is a short note written once after the chips in that era that share it, used for the combined user count of the two Chrome extensions.

## TriageOps demo video

The featured TriageOps block on the homepage has a hidden video slot. Set `data-video` on the `figure.case-video` element in `index.html` to a self-hosted MP4 (and `data-poster` to a JPG if you have one) and it appears. A file on another host also needs a `media-src` directive naming that host added to the Content-Security-Policy in `_headers` (and `img-src` for a poster on another host).
