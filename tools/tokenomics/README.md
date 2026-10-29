# Tokenomics planner

Static HTML, CSS, and vanilla ES modules, served as-is at `/tools/tokenomics/`.
No runtime build, external requests, analytics, dependencies, or sign-in. Inputs
are kept in page memory, not transmitted or persisted. An HTTPS service worker
caches only this tool's local assets for offline reload after “Ready offline.”
Source links need connectivity; calculations do not.

## Data-only updates

`data/rates.json` is the only home for rates, presets, harness definitions, and
planning policy. Update `lastRefresh` when reviewing data. Every entry requires:

- `value`, or numeric `low`, `likely`, and `high`;
- `unit`, an allowed public HTTPS `source`, and `asOf` (`YYYY-MM-DD`);
- `confidence`: `published`, `range`, or `early`;
- `why`: plain-English explanation distinguishing published prices from
  illustrative workload assumptions.

To add a source or rate, add an entry to `rates` with this metadata. It appears
automatically under Sources. To use it as a harness factor, reference its key
from a harness's `value`; a numeric harness value is a constant factor.
New calculation types still require code and tests, not just a data entry.
Use only the public Microsoft sources already listed in the dataset.

To add a preset, append an object to `presets` with a unique `id`, `name`,
`harness` ID, editable `low`/`likely`/`high`, and the same provenance metadata.
Optional `voice`, `reasoningHeavy`, and `aiBuilder` flags select existing behavior.
Presets appear automatically in the selector, sources, and value portfolio.
For voice, a run is a minute and the initial band comes from `voiceStandard`
or `voiceNew` according to harness. This per-minute band already includes the
harness; it is not multiplied again.

`planning.value` holds default volume, size boundaries, governance suggestions,
value thresholds, and the P3 comparison horizon. These are author heuristics,
not licensing guidance. Keep size thresholds ordered with a final `below: null`.

## Calculation conventions

The Microsoft Copilot harness retains the internal `github` ID and rate
reference for compatibility. Its current name is data-driven across the picker,
explanations and source cards; the form notes the October 28, 2026 rename.

At widths of 1024px and up, inputs and results use two columns. Results stay
sticky below navigation, with their own scroll region for expanded evidence.
On smaller screens results follow the inputs. Low/high dashed markers and a
thicker contrasting likely marker supplement the numeric range labels.
The disclaimer remains in normal document flow.

- Credits/month = users × runs/user/month × credits/run × harness factor.
- Reasoning-heavy estimates divide low and multiply high by the widening
  factor; likely is unchanged. The factor is illustrative, not a research rate.
- A measured total includes all harness/reasoning consumption and replaces
  the entire band, even when it is zero.
- Packs round up to monthly capacity. No actual pack price was supplied:
  the dollar figure is explicitly only PAYG-equivalent capacity value.
- P3 compares each whole listed commitment over the configured illustrative
  annual horizon, including unused paid capacity and PAYG overflow. It does
  not apply a discount to arbitrary monthly volume or assume marginal tiers.
  Confirm actual term, eligibility, and commercial terms before purchase.
- Value decisions use likely PAYG credit cost only, excluding implementation,
  labor, and non-credit costs. Zero denominators show N/A. Portfolio rows are
  alternatives at a shared workload and value assumption, not additive totals.

## Maintenance and checks

The site generator reuses the shared layout with `scripts/tokenomics-page.mjs`.
`index.html` is checked in; GitHub Pages serves it without generation.
For markup changes run `npm run generate`, then `npm test`.
For data changes, edit JSON only; there is no need to regenerate the page.

Run focused tests with `node --test tools/tokenomics/calculate.test.js`.
For local browser checks serve the repository root with an existing static
server, such as `python3 -m http.server 8000`. Check 390px and desktop widths,
all theme modes, zero and measured inputs, invalid/reversed bands, tabs and
keyboard navigation. Wait for “Ready offline,” then test an offline reload.

The worker uses network-first caching so an online visit refreshes data.
If changing the offline asset list or incompatible cache contents, increment
the tool-scoped cache version in `sw.js`. It never intercepts other site routes.
