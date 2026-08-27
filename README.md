# Bill Whalen - digital resume and project launchpad

Static source for `https://billwhalenmsft.github.io/`.

## What is included

- A responsive, accessible personal profile.
- A searchable and filterable launcher for verified public projects.
- Light and dark themes.
- A keyboard quick launcher with `Ctrl+K` or `Cmd+K`.
- GitHub Pages metadata, sitemap, robots file, and custom 404 page.

## Content boundary

The portfolio intentionally includes customer-neutral public work only. Customer-specific engagements, Microsoft-internal systems, private evidence, and unsupported claims are excluded.

Community projects are shared as-is and are not Microsoft products or supported offerings.

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
