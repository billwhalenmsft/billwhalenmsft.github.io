# Public release approval checklist

Use this checklist for an exact, nominated public project. Keep private review notes, customer evidence, screenshots, exports, and filled intake drafts outside this repository in a `private-review/` workspace. The repository ignores that directory and `*.private.*` files.

## Required workflow

1. **Nominate one exact public project.** Confirm its canonical repository URL is present in `config/public-source-allowlist.json`.
2. **Run a private sanitization and rights review.** Remove customer names, tenant or environment identifiers, people, email addresses, secrets, internal-only links, private screenshots, telemetry, and unsupported performance claims. Confirm every asset can be redistributed publicly.
3. **Create the candidate record.** Copy `docs/release-input.example.json` into `content/releases.json`, fill every field from public evidence, use `designed` or an explicit value hypothesis when results are not measured, and leave `status` as `draft`.
4. **Generate and preview.** Run `npm run generate`, then preview the homepage, journal, solution page, article, subscription page, feeds, and manifest locally.
5. **Validate the package.** Run `npm test`. Resolve schema, source allowlist, deny-pattern, link, fragment, feed, sitemap, accessibility-smoke, determinism, and protected-route failures.
6. **Approve the exact release.** Bill reviews the record, rendered pages, synthetic visual, manifest, and commit diff. Only after that review may `status` change from `draft` to `approved`.
7. **Publish through review.** Commit the exact reviewed output, open a pull request, and have Bill manually merge it. GitHub Pages then publishes from `main`.

## Approval gates

- [ ] One exact public repository is nominated and allowlisted.
- [ ] All statements are supported by the listed public provenance URLs.
- [ ] Repository-created and last-public-push dates match the exact public GitHub API record and are not described as adoption, activity, or customer use.
- [ ] Any fork, derivative, or upstream framework has explicit ownership, relationship, and license attribution.
- [ ] Original state, delivered solution, and outcome are customer-neutral.
- [ ] Value evidence is labeled `measured`, `observed`, or `designed`; intended value is not phrased as a measured result.
- [ ] No adoption, time-saved, ROI, production-use, or customer-result claim is inferred.
- [ ] No customer, person, tenant, environment, internal program, private endpoint, or secret appears.
- [ ] Images are synthetic/public-safe, include useful alternative text, and have redistribution rights.
- [ ] Human decision points, consequential action gates, prerequisites, and limitations are explicit.
- [ ] The solution page, companion article, RSS, Atom, public manifest, and sitemap agree with the canonical record.
- [ ] `engagements/field-service-scheduling/**` hashes match `config/protected-routes.json` and the route is absent from navigation, catalog, sitemap, feeds, search, and MCP plans.
- [ ] `npm test` passes from a clean checkout after generation.
- [ ] Bill reviewed the exact manifest and commit and manually merged the pull request.

## Deliberately not automated

There is no scheduled publishing, auto-merge, email subscriber collection, or live MCP service. A future MCP surface must be separately hosted, read-only, and limited to approved manifest records.
