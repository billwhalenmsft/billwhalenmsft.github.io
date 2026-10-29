import { estimate, price, sizeFor } from "./calculate.js";

const $ = (id) => document.getElementById(id);
const escape = (value) => String(value).replace(/[&<>"']/g, (char) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
})[char]);
const number = (value) => new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(value);
const money = (value) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
const badges = { published: "✅ published", range: "↔ range", early: "⚠ early" };

function evidenceValue(value) {
  if (Array.isArray(value)) {
    return `<ul>${value.map((item) => `<li>${evidenceValue(item)}</li>`).join("")}</ul>`;
  }
  if (value !== null && typeof value === "object") {
    return `<ul>${Object.entries(value).map(([key, item]) => `<li><strong>${escape(key.replace(/([a-z])([A-Z])/g, "$1 $2"))}:</strong>
      ${key === "discount" ? `${number(item * 100)}%` : evidenceValue(item)}</li>`).join("")}</ul>`;
  }
  return value === null ? "No upper limit" : escape(typeof value === "number" ? number(value) : value);
}

function evidence(label, entry) {
  const value = "value" in entry ? evidenceValue(entry.value)
    : escape(`${number(entry.low)} / ${number(entry.likely)} / ${number(entry.high)}`);
  return `<div class="planner-card"><h3>${escape(label)}</h3>
    <div>${value}</div><p>${escape(entry.unit)} · <span class="badge">${badges[entry.confidence]}</span></p>
    <p>${escape(entry.why)}</p><p><a href="${escape(entry.source)}" rel="noreferrer">Source</a>
    · as of <time>${escape(entry.asOf)}</time></p></div>`;
}

function explanation(content) {
  return `<details><summary>How we got this</summary>${content}</details>`;
}

function readNumber(id, optional = false) {
  const input = $(id);
  if (optional && input.value === "" && !input.validity.badInput) return null;
  const value = Number(input.value);
  if (input.value === "" || !input.validity.valid || !Number.isFinite(value) || value < 0) {
    throw new Error("Enter finite, non-negative numbers within the field limits. Users must be a whole number.");
  }
  return value;
}

async function start() {
  const response = await fetch("./data/rates.json");
  if (!response.ok) throw new Error("Planning data could not be loaded. Please reload while online.");
  const data = await response.json();
  const { rates, planning, presets, harnesses } = data;
  const policy = planning.value;
  let editedBand = false;
  $("preset").innerHTML = presets.map((preset) => `<option value="${escape(preset.id)}">${escape(preset.name)}</option>`).join("");
  $("harness-choice").innerHTML = harnesses.map((harness) => `<option value="${escape(harness.id)}">${escape(harness.name)}</option>`).join("");
  $("users").value = policy.users;
  $("runs").value = policy.runs;
  $("last-refresh").textContent = data.lastRefresh;
  $("last-refresh").dateTime = data.lastRefresh;
  $("harness-results").innerHTML = harnesses.map((harness) => evidence(harness.name, harness)).join("");
  $("source-results").innerHTML = [
    ...Object.entries(rates).map(([key, entry]) => evidence(key, entry)),
    evidence("Planner policy (illustrative)", planning),
    ...harnesses.map((entry) => evidence(entry.name, entry)),
    ...presets.map((entry) => evidence(entry.name, entry))
  ].join("");

  const selectedPreset = () => presets.find((preset) => preset.id === $("preset").value);
  const selectedHarness = () => harnesses.find((harness) => harness.id === $("harness-choice").value);
  const defaultBand = (preset, harness) => preset.voice
    ? (harness.id === "standard" ? rates.voiceStandard : rates.voiceNew) : preset;
  const factorFor = (preset, harness) => {
    if (preset.voice) return { low: 1, likely: 1, high: 1 };
    if (typeof harness.value === "string") return rates[harness.value];
    return { low: harness.value, likely: harness.value, high: harness.value };
  };
  function setBand() {
    const band = defaultBand(selectedPreset(), selectedHarness());
    for (const key of ["low", "likely", "high"]) $(key).value = band[key];
  }
  function loadPreset() {
    const preset = selectedPreset();
    $("harness-choice").value = preset.harness;
    $("measured").value = "";
    $("runs-label").textContent = preset.voice ? "Minutes per user per month" : "Runs per user per month";
    editedBand = false;
    setBand();
    render();
  }

  function render() {
    try {
      const users = readNumber("users");
      const runs = readNumber("runs");
      const measured = readNumber("measured", true);
      const band = measured !== null ? defaultBand(selectedPreset(), selectedHarness())
        : Object.fromEntries(["low", "likely", "high"].map((key) => [key, readNumber(key)]));
      if (measured === null && (band.low > band.likely || band.likely > band.high)) {
        throw new Error("The band must be ordered: low ≤ likely ≤ high.");
      }
      const preset = selectedPreset();
      const harness = selectedHarness();
      const factor = factorFor(preset, harness);
      const widening = preset.reasoningHeavy ? rates.reasoningWidening.value : 1;
      const result = estimate({ users, runs, band, factor, measured, widening });
      const costs = price(result.likely, rates, policy.months);
      const size = sizeFor(result.likely, policy);
      const base = defaultBand(preset, harness);
      const inputs = `<p>Inputs: ${number(users)} users × ${number(runs)} ${preset.voice ? "minutes" : "runs"}/user/month.
        These are user-entered assumptions (↔ range), not independently verified.
        <a href="#workload">Source: your workload inputs</a>.</p>
        <p>${measured !== null
    ? `Measured override: ${number(measured)} total credits/${preset.voice ? "minute" : "run"}.
        Source: your measurement input; marked measured, but not independently verified. All factors and widening are bypassed.`
    : `Credits/${preset.voice ? "minute" : "run"}: ${number(band.low)} / ${number(band.likely)} / ${number(band.high)}
        (${editedBand ? "user-edited assumptions" : "preset assumptions"}).
        Harness factor: ${number(factor.low)} / ${number(factor.likely)} / ${number(factor.high)}.
        Low ÷ ${number(widening)} and high × ${number(widening)}; likely unchanged.`}</p>`;
      const assumptions = inputs + evidence(preset.name, preset)
        + evidence(harness.name, harness)
        + (preset.voice ? evidence("Voice rate band (already includes harness; no extra multiplier)", base) : "")
        + (!preset.voice && typeof harness.value === "string" ? evidence("Harness planning factor", rates[harness.value]) : "")
        + (preset.reasoningHeavy ? evidence("Reasoning variability", rates.reasoningWidening) + evidence("Reasoning premium reference (not added again)", rates.reasoning) : "")
        + (preset.aiBuilder ? evidence("AI Builder transition", rates.aiBuilder) : "");
      const costWhy = `<p>PAYG = likely credits × ${money(rates.payg.value)}.
        Packs = round up (likely credits ÷ ${number(rates.pack.value)}); pack dollar value is only a PAYG-equivalent, not a quoted pack price.</p>
        <p>P3: compare every listed commitment over ${number(policy.months)} months.
        Monthly equivalent = (tier credits × PAYG rate × (1 − discount) + excess credits × PAYG rate) ÷ ${number(policy.months)}.
        Cheapest modeled tier: ${number(costs.p3.credits)} credits at ${number(costs.p3.discount * 100)}% off.
        Annual modeled demand: ${number(result.likely * policy.months)} credits.
        This pays for the entire commitment, including any unused capacity. It is not a marginal discount or a monthly cancellable offer.</p>`
        + evidence("PAYG", rates.payg) + evidence("Capacity pack", rates.pack) + evidence("P3 tiers", rates.p3) + evidence("Planning horizon", planning);
      const ticks = policy.sizes.filter((entry) => entry.below !== null);
      const maximum = Math.max(result.high, ticks.at(-1).below * 2);
      const position = (credits) => 100 * Math.log1p(credits) / Math.log1p(maximum);
      const bandGraphic = `<div class="band-track" role="img" aria-label="Logarithmic credit scale; low ${number(result.low)}, likely ${number(result.likely)}, high ${number(result.high)}">
        <span class="band-fill" style="left:${position(result.low)}%;width:${position(result.high) - position(result.low)}%"></span>
        ${ticks.map((tick) => `<span class="band-mark" style="left:${position(tick.below)}%"><span>${number(tick.below)}</span></span>`).join("")}
        <span class="band-mark" style="left:${position(result.likely)}%" title="Likely"></span></div>`;
      $("estimate-results").innerHTML = `
        <div class="planner-card"><h3>Size ${escape(size.name)} · ${result.measured ? "measured" : "estimated"}</h3>
          <p class="number">${number(result.likely)} likely credits/month</p>
          <p>Low ${number(result.low)} / likely ${number(result.likely)} / high ${number(result.high)}</p>
          ${bandGraphic}<p>Logarithmic scale; ticks mark size boundaries. The dark marker is likely.</p>
          <p>${policy.sizes.map((entry, index) => `${entry.name}: ${index ? `≥${number(policy.sizes[index - 1].below)}` : "≥0"}${entry.below === null ? "" : ` and <${number(entry.below)}`}`).map(escape).join(" · ")}</p>
          ${explanation(assumptions + evidence("Size thresholds", planning))}</div>
        <div class="planner-card"><h3>List-price comparison · likely scenario</h3>
          <p>PAYG: <strong>${money(costs.payg)}/month</strong> (low ${money(result.low * rates.payg.value)} / high ${money(result.high * rates.payg.value)}).</p>
          <p>Packs: <strong>${number(costs.packs)}</strong> for ${number(costs.packs * rates.pack.value)} credits/month.
          Pack price unavailable; PAYG-equivalent capacity value ${money(costs.packEquivalent)}/month — not a pack quote.</p>
          <p>P3: <strong>${money(costs.p3.cost)}/month equivalent</strong>, ${number(costs.p3.credits)}-credit commitment at ${number(costs.p3.discount * 100)}% off, including modeled PAYG overflow.</p>
          ${explanation(costWhy + inputs)}</div>
        <div class="planner-card"><h3>Suggested starting buy</h3>
          <p>${result.likely === 0 ? "No capacity needed at zero modeled usage." : `Start with a capped PAYG pilot around ${money(costs.payg)}/month; validate the high case of ${money(result.high * rates.payg.value)} before rollout. Consider ${number(costs.packs)} packs only after confirming their actual price.${costs.p3.cost < costs.payg ? " P3 may save at sustained volume, but validate term and utilization before committing." : " This P3 commitment is not cheaper than PAYG at this volume."}`}</p>
          ${explanation(costWhy + evidence("Recommendation is a planning heuristic", planning))}</div>
        <div class="planner-card"><h3>Default governance · ${escape(size.name)}</h3><p>${escape(size.controls)}</p>
          ${explanation(evidence("Governance and size policy", planning))}</div>
        ${preset.aiBuilder ? evidence("AI Builder transition notice", rates.aiBuilder) : ""}`;
      $("why-results").innerHTML = explanation(assumptions + evidence("Standard event rate card (reference, not preset arithmetic)", rates.standard) + costWhy);

      renderValue({ users, runs, preset, result, costs, assumptions, costWhy });
      $("input-error").textContent = "";
    } catch (error) {
      $("input-error").textContent = error.message;
      $("estimate-results").textContent = "Estimate unavailable until the inputs are valid.";
      $("why-results").textContent = error.message;
      $("value-results").textContent = "Value unavailable until the inputs are valid.";
      $("portfolio").textContent = "";
    }
  }

  function renderValue({ users, runs, preset, result, costs, assumptions, costWhy }) {
    try {
      const method = $("value-method").value;
      const quantity = readNumber("quantity");
      const unit = method === "custom" ? 1 : readNumber("unit-value");
      const outcomes = method === "outcomes" ? quantity : readNumber("outcomes");
      const value = quantity * unit;
      const decision = (cost) => cost === 0 ? "No cost basis — ratio unavailable"
        : value / cost >= policy.expandRatio ? `Expand ≥${policy.expandRatio}×`
          : value / cost < policy.holdRatio ? `Scale back <${policy.holdRatio}×` : "Hold";
      const ratio = (cost) => cost === 0 ? "N/A" : `${number(value / cost)}×`;
      const valueWhy = `<p>User-entered monthly value = ${number(quantity)} × ${money(unit)} = ${money(value)}.
        ${number(outcomes)} successful outcomes/month. Source: your value inputs (↔ range; not independently verified).
        Cost per outcome = monthly PAYG ÷ successful outcomes; ratio = monthly value ÷ monthly PAYG.
        Zero denominators show N/A. Value excludes implementation, labor, and other non-credit costs.</p>`
        + evidence("Decision thresholds are illustrative", planning);
      $("value-results").innerHTML = `<div class="planner-card"><h3>${escape(decision(costs.payg))}</h3>
        <p>Monthly value ${money(value)} · cost per outcome ${outcomes > 0 ? money(costs.payg / outcomes) : "N/A — enter successful outcomes"} · value-to-cost ${ratio(costs.payg)}.</p>
        <p>Value-to-cost at high cost ${ratio(result.high * rates.payg.value)}; at low cost ${ratio(result.low * rates.payg.value)}. Decision uses likely PAYG only.</p>
        ${explanation(valueWhy + assumptions + costWhy)}</div>`;
      const rows = presets.map((entry) => {
        const harness = harnesses.find((item) => item.id === entry.harness);
        const total = entry.id === preset.id ? result : estimate({
          users, runs, band: defaultBand(entry, harness), factor: factorFor(entry, harness),
          widening: entry.reasoningHeavy ? rates.reasoningWidening.value : 1
        });
        const cost = total.likely * rates.payg.value;
        return `<tr><th scope="row">${escape(entry.name)}${entry.id === preset.id ? " (current)" : ""}</th><td>${number(total.likely)}</td>
          <td>${money(cost)}</td><td>${ratio(cost)} · ${escape(decision(cost))}
          ${explanation((entry.id === preset.id ? assumptions : `<p>${number(users)} users × ${number(runs)} runs or minutes per user/month; default ${escape(harness.name)} harness. ${entry.reasoningHeavy ? `Low/high widening ${number(rates.reasoningWidening.value)}×.` : ""}</p>`
            + evidence(entry.name, entry) + evidence(harness.name, harness)
            + evidence("Effective base band", defaultBand(entry, harness))
            + (typeof harness.value === "string" && !entry.voice ? evidence("Harness factor", rates[harness.value]) : ""))
            + evidence("PAYG", rates.payg) + valueWhy)}</td></tr>`;
      }).join("");
      $("portfolio").innerHTML = `<div class="table-scroll"><table><caption>Monthly alternative scenarios</caption>
        <thead><tr><th>Preset</th><th>Likely credits</th><th>PAYG</th><th>Value-to-cost / decision</th></tr></thead><tbody>${rows}</tbody></table></div>`;
    } catch (error) {
      $("value-results").textContent = error.message;
      $("portfolio").textContent = "";
    }
  }

  $("workload").addEventListener("submit", (event) => event.preventDefault());
  $("workload").addEventListener("input", (event) => {
    if (event.target.id === "preset") return;
    if (["low", "likely", "high"].includes(event.target.id)) editedBand = true;
    if (event.target.id === "harness-choice" && selectedPreset().voice && !editedBand) setBand();
    render();
  });
  $("preset").addEventListener("change", loadPreset);
  $("value").addEventListener("input", (event) => {
    if (event.target.id === "value-method") {
      const method = $("value-method").value;
      $("quantity-label").textContent = method === "custom" ? "Custom monthly USD value" : method === "outcomes" ? "Outcomes per month" : "Hours saved per month";
      $("unit-label").textContent = method === "outcomes" ? "USD value per outcome" : "Loaded USD per hour";
      $("unit-value").disabled = method === "custom";
      $("outcomes").disabled = method === "outcomes";
    }
    render();
  });
  loadPreset();
  $("load-status").textContent = "All calculations stay in this browser. No analytics, sign-in, or external requests.";
  if ("serviceWorker" in navigator) {
    try {
      const registration = await navigator.serviceWorker.register("./sw.js", { scope: "./" });
      const worker = registration.installing || registration.waiting || registration.active;
      const ready = () => {
        if (worker.state === "activated") $("load-status").textContent = "Ready offline. All inputs stay in this browser; sources open only when you follow a link.";
      };
      worker.addEventListener("statechange", ready);
      ready();
    } catch {
      $("load-status").textContent = "Planner ready. Offline reload is unavailable in this browser; the open page still works offline.";
    }
  }
}

const tabs = [...document.querySelectorAll('[role="tab"]')];
const boundary = document.querySelector(".boundary");
function reserveBoundarySpace() {
  document.body.style.paddingBottom = `${boundary.getBoundingClientRect().height + 16}px`;
}
new ResizeObserver(reserveBoundarySpace).observe(boundary);
reserveBoundarySpace();
function selectTab(tab) {
  for (const item of tabs) {
    const active = item === tab;
    item.setAttribute("aria-selected", String(active));
    item.tabIndex = active ? 0 : -1;
    $(item.getAttribute("aria-controls")).hidden = !active;
  }
}
tabs.forEach((tab, index) => {
  tab.addEventListener("click", () => selectTab(tab));
  tab.addEventListener("keydown", (event) => {
    let next;
    if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
    if (event.key === "ArrowLeft") next = (index + tabs.length - 1) % tabs.length;
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = tabs.length - 1;
    if (next === undefined) return;
    event.preventDefault();
    selectTab(tabs[next]);
    tabs[next].focus();
  });
});
document.addEventListener("click", (event) => {
  if (event.target.closest('a[href="#workload"]')) selectTab($("tab-estimate"));
});

start().catch((error) => { $("load-status").textContent = error.message; });
