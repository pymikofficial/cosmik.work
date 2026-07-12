# cosmik.work
Personal brand site for Soumik Chatterjee (Chief of Staff &amp; AI-driven Business Systems Architect) (Universal social media handle and website: cosmikwork)

## Shared nav/footer

The nav and footer live once in `partials/nav.html` and `partials/footer.html`. Each page (`index.html`, `shipped.html`, `systems.html`, `contact.html`) has `<!-- NAV:START/END -->` and `<!-- FOOTER:START/END -->` markers where that content is stamped in.

After editing a partial, or adding a new page, run:

```
node scripts/build.js
```

and commit the regenerated HTML files. This is a local step only: Netlify's deploy is unchanged, it still just serves the static HTML as-is.
