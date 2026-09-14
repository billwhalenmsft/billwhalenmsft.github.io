# Bill Whalen - The Atomic Collection

Static source for `https://billwhalenmsft.github.io/`.

## What is included

- A responsive, accessible personal profile.
- A searchable and filterable launcher for verified public projects.
- The approved White and Blue Atomic visual system, with a compatible dark preference.
- A keyboard quick launcher with `Ctrl+K` or `Cmd+K`.
- An explicitly non-live release architecture for future project pages, field notes, RSS/Atom, and read-only MCP discovery.
- GitHub Pages metadata, sitemap, robots file, and custom 404 page.

## Content boundary

The portfolio intentionally includes customer-neutral public work only. Customer-specific engagements, Microsoft-internal systems, private evidence, and unsupported claims are excluded.

Community projects are shared as-is and are not Microsoft products or supported offerings.

## Release architecture status

The homepage documents the approved future direction without claiming those surfaces are live:

- Project pages will use a reusable public-safe release-detail pattern.
- Field notes, RSS, and Atom will derive from one reviewed public release record.
- A read-only MCP service would require separate hosting because GitHub Pages is static.

No release catalog, feed endpoint, subscriber list, or MCP server is currently deployed by this repository.

## Local preview

```powershell
python -m http.server 4173
```

Then open `http://localhost:4173/`.

## Publish with GitHub Pages

1. Create a public repository named `billwhalenmsft.github.io`.
2. Push this directory to the repository's `main` branch.
3. In the repository settings, set Pages to deploy from the root of `main`.

No build step is required.
