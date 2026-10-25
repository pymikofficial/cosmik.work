# cosmik.work

Static portfolio site. Netlify runs `npm run build` on every deploy and serves the repo root, and it auto-deploys every push to `main`. You do not need to build before committing: edit a page, a partial, or a data file, then push.

## Commands

- `npm run build`: stamps `partials/` into every page and renders `data/*.json` into Shipped and Growth Log. Netlify runs this on deploy. Run it locally only to preview changes.
- `npm run check`: copy linter (no em dashes, no contractions, no retired terms, no public-code claims)
- `npm run serve`: local preview at http://localhost:8080 with extensionless URLs and `_redirects` rules. Run `npm run build` first so the preview matches what Netlify will publish.

## Adding a tool

Add one entry to `data/tools.json` (`name`, `date` as YYYY-MM-DD, `problem`, `link`, `buildTime`, optional `flagship`), run `npm run check`, and push. Netlify renders it on the next deploy.
