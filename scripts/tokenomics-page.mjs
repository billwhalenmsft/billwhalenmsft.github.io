export const tokenomicsStyles = `
:root { --cp-accent: #0057b8; --cp-accent-hover: #004494; --cp-accent-soft: #e8f2ff; }
html[data-theme="dark"] { --cp-accent: #75baff; --cp-accent-hover: #a4d2ff; --cp-accent-soft: #20364d; }
html[data-brand="atomic"] { --cp-accent: var(--cp-link); font-family: "Segoe UI", sans-serif; }
.planner { padding-top: 2rem; padding-bottom: 2rem; }
.planner h1 { font-size: clamp(2rem, 5vw, 3.5rem); }
.planner h2 { margin-top: 1.5rem; }
.planner label, .theme-control { display: grid; gap: .35rem; font-weight: 600; }
.planner input, .planner select, .theme-select { width: 100%; min-width: 0; padding: .65rem; border: 1px solid var(--cp-border-strong); border-radius: .5rem; background: var(--cp-surface); color: var(--cp-text); font: inherit; }
.planner input:focus-visible, .planner select:focus-visible, .theme-select:focus-visible, .tabs button:focus-visible { outline: 3px solid var(--cp-accent); outline-offset: 2px; }
.planner-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 15rem), 1fr)); gap: 1rem; margin: 1rem 0; }
.planner-card, .planner details { padding: 1rem; margin: 1rem 0; border: 1px solid var(--cp-border); border-radius: .75rem; background: var(--cp-surface); }
.planner summary { cursor: pointer; font-weight: 700; }
.planner a { color: var(--cp-link); overflow-wrap: anywhere; }
.tabs { display: flex; flex-wrap: wrap; gap: .5rem; margin: 1.5rem 0; }
.tabs button { padding: .7rem; border: 1px solid var(--cp-border-strong); border-radius: .5rem; color: var(--cp-text); background: var(--cp-surface); font: inherit; cursor: pointer; }
.tabs button[aria-selected="true"] { border-color: var(--cp-accent); background: var(--cp-accent-soft); }
[hidden] { display: none !important; }
.band-track { height: 2rem; position: relative; margin: 1rem 0 3rem; background: var(--cp-surface-soft); border: 1px solid var(--cp-border-strong); }
.band-fill { position: absolute; top: .4rem; height: 1rem; min-width: 3px; background: var(--cp-accent); }
.band-mark { position: absolute; top: 0; height: 2rem; border-left: 2px solid var(--cp-text); }
.band-mark span { display: block; position: absolute; top: 2.2rem; transform: translateX(-50%); white-space: nowrap; font-size: .75rem; }
.planner table { width: 100%; border-collapse: collapse; }
.planner th, .planner td { text-align: left; padding: .65rem; border-bottom: 1px solid var(--cp-border); }
.table-scroll { overflow-x: auto; }
.boundary { position: fixed; bottom: 0; left: 0; right: 0; z-index: 20; border-top: 2px solid var(--cp-accent); padding: .75rem 1rem; margin: 0; background: var(--cp-surface); color: var(--cp-text); font-size: .85rem; line-height: 1.4; }
.formula { overflow-wrap: anywhere; }
.number { font-size: 1.35rem; font-weight: 700; }
.badge { font-weight: 700; }
@media (max-width: 600px) { .planner { width: calc(100% - 2rem); } .nav { flex-wrap: wrap; } .nav-links { display: flex; flex-wrap: wrap; } }
`;

export const tokenomicsBody = `
    <div class="shell planner">
      <h1>Tokenomics planner</h1>
      <p>Size the monthly cost. Understand the why. Ranges are a feature, not a gap.</p>
      <p id="load-status" role="status">Loading local planning data…</p>
      <noscript>This interactive planner needs JavaScript. No inputs leave your browser.</noscript>
      <div class="tabs" role="tablist" aria-label="Planner screens">
        <button type="button" role="tab" id="tab-estimate" aria-controls="estimate" aria-selected="true">Estimate</button>
        <button type="button" role="tab" id="tab-why" aria-controls="why" aria-selected="false" tabindex="-1">Why these numbers</button>
        <button type="button" role="tab" id="tab-harness" aria-controls="harness" aria-selected="false" tabindex="-1">Harness picker</button>
        <button type="button" role="tab" id="tab-value" aria-controls="value" aria-selected="false" tabindex="-1">Value</button>
        <button type="button" role="tab" id="tab-sources" aria-controls="sources" aria-selected="false" tabindex="-1">Sources &amp; how this changes</button>
      </div>
      <section id="estimate" role="tabpanel" aria-labelledby="tab-estimate">
        <h2>Estimate</h2>
        <form id="workload" novalidate>
          <div class="planner-grid">
            <label>Use-case preset<select id="preset"></select></label>
            <label>Users<input id="users" type="number" min="0" max="1000000000" step="1"></label>
            <label><span id="runs-label">Runs per user per month</span><input id="runs" type="number" min="0" max="1000000000" step="any"></label>
            <label>Harness<select id="harness-choice"></select></label>
          </div>
          <fieldset><legend>Editable illustrative credits per run (per minute for voice)</legend>
            <div class="planner-grid">
              <label>Low<input id="low" type="number" min="0" max="1000000000" step="any"></label>
              <label>Likely<input id="likely" type="number" min="0" max="1000000000" step="any"></label>
              <label>High<input id="high" type="number" min="0" max="1000000000" step="any"></label>
            </div>
          </fieldset>
          <label>I measured this: total credits per run (per minute for voice), including harness
            <input id="measured" type="number" min="0" max="1000000000" step="any" placeholder="Optional — replaces all defaults">
          </label>
          <p>Measured totals bypass harness factors and reasoning widening. Clear the field to restore estimates.</p>
        </form>
        <p class="formula">credits/month = users × runs/user/month × credits/run × harness factor</p>
        <p id="input-error" role="alert"></p>
        <div id="estimate-results" aria-live="polite"></div>
      </section>
      <section id="why" role="tabpanel" aria-labelledby="tab-why" hidden>
        <h2>Why these numbers</h2>
        <p>Published rates are not published workload totals. User edits and measurements are your assumptions, not verified evidence.</p>
        <div id="why-results"></div>
      </section>
      <section id="harness" role="tabpanel" aria-labelledby="tab-harness" hidden>
        <h2>Harness picker</h2>
        <p><strong>Bigger isn't better.</strong> A simple task on the most capable harness can cost more without a better result.</p>
        <div id="harness-results"></div>
      </section>
      <section id="value" role="tabpanel" aria-labelledby="tab-value" hidden>
        <h2>Business value, not token maxing.</h2>
        <div class="planner-grid">
          <label>Value method<select id="value-method"><option value="hours">Hours saved × loaded rate</option><option value="outcomes">Outcomes × unit value</option><option value="custom">Custom monthly USD value</option></select></label>
          <label><span id="quantity-label">Hours saved per month</span><input id="quantity" type="number" min="0" max="1000000000" step="any" value="0"></label>
          <label><span id="unit-label">Loaded USD per hour</span><input id="unit-value" type="number" min="0" max="1000000000" step="any" value="0"></label>
          <label>Successful outcomes per month<input id="outcomes" type="number" min="0" max="1000000000" step="any" value="0"></label>
        </div>
        <div id="value-results" aria-live="polite"></div>
        <h3>Portfolio across presets</h3>
        <p>Each row is an alternative at the current user/run volume and shared value assumptions, not a sum. Uses that preset's default harness and band; current edits and measurements apply only to the selected preset. Voice volume is minutes.</p>
        <div id="portfolio"></div>
      </section>
      <section id="sources" role="tabpanel" aria-labelledby="tab-sources" hidden>
        <h2>Sources &amp; how this changes</h2>
        <p>Last data refresh: <time id="last-refresh"></time>. As-of dates record the dataset snapshot, not a guarantee of current licensing.</p>
        <h3>How I expect this to change</h3>
        <p>My view: the frontier costs the most; today's premium becomes tomorrow's default; cheaper capability drives more usage. Measure, then re-size quarterly.</p>
        <div id="source-results"></div>
      </section>
    </div>
    <p class="boundary" role="note">Estimates, not quotes or licensing guidance. List prices in USD, subject to change; for actual pricing, talk to your Microsoft account team or partner. Personal project; not a Microsoft product or supported offering; views are my own.</p>
    <script type="module" src="./app.js"></script>`;
