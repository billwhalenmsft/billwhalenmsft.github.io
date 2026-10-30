# Bill Whalen - The Atomic Collection

Static source for `https://billwhalenmsft.github.io/`.

## What is included

- A responsive, accessible personal profile.
- A searchable and filterable launcher for verified public projects.
- The approved White and Blue Atomic visual system, with a compatible dark preference.
- A keyboard quick launcher with `Ctrl+K` or `Cmd+K`.
- A public-safe solution journal with ten public releases and eleven clearly separated information-only showcases.
- A metadata-ranked homepage gallery with exactly eleven featured current-work entries.
- A generated public release manifest, RSS 2.0 feed, Atom feed, sitemap, metadata, JSON-LD, and custom 404 page.
- A dependency-free Node.js generator and validation suite for future manually reviewed releases.

## Content boundary

The portfolio includes customer-neutral public releases and tightly bounded information-only descriptions. Customer-specific engagements, private source, operational data, screenshots, private architecture, and unsupported claims are excluded.

Community projects are shared as-is and are not Microsoft products or supported offerings.

`engagements/field-service-scheduling/**` is a protected, excluded route. Its bytes are pinned in `config/protected-routes.json`; it is not included in navigation, the catalog, sitemap, feeds, search, or the planned MCP surface.

## Operator flow

Requirements: Node.js 20 or later. The generator uses only the Node standard library.

```powershell
npm run generate
npm test
python -m http.server 4173
```

Open `http://localhost:4173/`, then review `/journal/`, one public release, one companion article, one info-only showcase, `/subscribe/`, `/feeds/rss.xml`, `/feeds/atom.xml`, and `/releases.json`.

Canonical journal data lives in `content/releases.json`. Public releases carry exact repository creation and last-push dates from GitHub's public API; those dates describe repository history, not adoption. Info-only showcases carry an owner-reviewed as-of date, contain no source URLs, and are excluded from RSS and Atom. Generated output is committed so GitHub Pages can publish directly from the repository root. `npm run generate:check` fails when committed output does not match the catalog.

Every deployed HTML page uses empty `<header data-site-header>` and `<footer data-site-footer>` placeholders rendered by `assets/site-chrome.js`, with `assets/site-chrome.css` loaded after page styles. Load `assets/site-theme.js` synchronously in the head to apply the shared `site-theme` preference before paint. It migrates legacy theme keys and `scoutTheme` URLs; Auto follows the system. Keep navigation markup in the shared renderer, not individual pages. Quick launch remains homepage-only because it searches that page's project cards. Validation checks all deployed HTML documents, including standalone pages.

For each future release:

1. Nominate one exact public project and add its canonical repository to `config/public-source-allowlist.json`.
2. Complete the private sanitization and rights review outside the repository.
3. Add a draft record using `docs/release-input.example.json`, generate, and preview.
4. Run `npm test`.
5. Have Bill review the exact pages, manifest, and commit; only then set the record to `approved`.
6. Open a pull request and have Bill manually merge it to publish.

The complete approval gate is in `docs/release-approval-checklist.md`. There is no scheduled publishing, recurring write automation, email subscriber collection, or live MCP endpoint.

## Publish with GitHub Pages

The `/tools/` directory is generated from `tools/tools.json`. Each card has a
name, status, description, links and tags. Add only usable live tools or
already-public releases, using the public links already approved in the journal
catalog. Run `npm run generate` and `npm test` after data edits; cards are
rendered into static HTML and do not require JavaScript.

All blog posts use one shared full-width title rule and a centered 72ch reading
column in `scripts/site.mjs`. Tables and harness cards may span the full shell;
wide tables scroll inside their own region on phones.

The harness guide at `/blog/copilot-studio-harnesses/` is a Builder's Log post,
dated October 29, 2026. Its article body lives in
`content/copilot-studio-harnesses.html`; the shared generator supplies the site
shell, theme controls, cards and scrollable table styling. Builder's Log posts
appear in the blog and sitemap, but not in RSS or Atom.

GitHub Pages deploys the repository root from `main`. Merge the exact reviewed commit; no server-side build or framework is required.

## D365 Administrator Suite preview

The generic administrator preview is at `/d365-administrator-suite/`, with overview, guide, installation/download, technical details and policy pages. It packages eight instruction workflows, not an automatic optimizer. The journal entry preserves package-validation versus actual-host limits. No customer incident, transcript or private diagnostic material is published.
