# Bill Whalen - The Atomic Collection

Static source for `https://billwhalenmsft.github.io/`.

## What is included

- A responsive, accessible personal profile.
- A searchable and filterable launcher for verified public projects.
- The approved White and Blue Atomic visual system, with a compatible dark preference.
- A keyboard quick launcher with `Ctrl+K` or `Cmd+K`.
- A public-safe solution journal with nine public releases and eight clearly separated information-only showcases.
- A metadata-ranked homepage gallery with exactly ten featured current-work entries.
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

For each future release:

1. Nominate one exact public project and add its canonical repository to `config/public-source-allowlist.json`.
2. Complete the private sanitization and rights review outside the repository.
3. Add a draft record using `docs/release-input.example.json`, generate, and preview.
4. Run `npm test`.
5. Have Bill review the exact pages, manifest, and commit; only then set the record to `approved`.
6. Open a pull request and have Bill manually merge it to publish.

The complete approval gate is in `docs/release-approval-checklist.md`. There is no scheduled publishing, recurring write automation, email subscriber collection, or live MCP endpoint.

## Publish with GitHub Pages

GitHub Pages deploys the repository root from `main`. Merge the exact reviewed commit; no server-side build or framework is required.
