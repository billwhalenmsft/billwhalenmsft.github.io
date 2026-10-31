import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { buyGuidanceFor, estimate, sizeFor, price } from "./calculate.js";
import { harnessRatePresentation, syncHarnessHelp } from "./harness-ui.js";

const data = JSON.parse(await readFile(new URL("./data/rates.json", import.meta.url), "utf8"));
const band = { low: 100, likely: 180, high: 300 };
const factor = { low: 1, likely: 3, high: 6 };

test("monthly formula multiplies volume, band, and harness", () => {
  assert.deepEqual(estimate({ users: 10, runs: 20, band, factor }), {
    low: 20000, likely: 108000, high: 360000, measured: false
  });
});

test("size boundaries are inclusive at M, L, and XL", () => {
  for (const [credits, expected] of [[0, "S"], [24999, "S"], [25000, "M"], [249999, "M"],
    [250000, "L"], [2499999, "L"], [2500000, "XL"]]) {
    assert.equal(sizeFor(credits, data.planning.value).name, expected);
  }
});

test("buy guidance switches at the exact M and L boundaries", () => {
  const payg = "Pay-as-you-go with budget alerts. Set a monthly budget and alert at 80%.";
  const p3 = "P3 pre-purchase plan with pay-as-you-go overflow. Size the P3 tier from the likely monthly credits × 12, and let pay-as-you-go cover spikes above the pool.";
  const why = "Consumption-first: start on pay-as-you-go while usage is small or uncertain; once volume is predictable at L/XL, a P3 pool lowers the effective rate and pay-as-you-go absorbs overflow.";
  for (const [credits, expected, guidance] of [[25000, "M", payg], [250000, "L", p3]]) {
    const size = sizeFor(credits, data.planning.value);
    assert.equal(size.name, expected);
    assert.deepEqual(buyGuidanceFor(size), { text: guidance, why });
  }
});

test("P3 uses the full commitment discount, not marginal tier slices", () => {
  for (const tier of data.rates.p3.value) {
    const result = price(tier.credits / 12, data.rates, 12);
    assert.equal(result.p3.credits, tier.credits);
    assert.ok(Math.abs(result.p3.cost - tier.credits * 0.01 * (1 - tier.discount) / 12) < 0.000001);
  }
});

test("P3 charges unused commitment and pay-as-you-go overflow", () => {
  const zero = price(0, data.rates, 12);
  assert.equal(zero.payg, 0);
  assert.deepEqual(Object.keys(zero).sort(), ["p3", "payg"]);
  assert.equal(zero.p3.cost, 300000 * 0.01 * 0.95 / 12);
  const result = price(25001, data.rates, 12);
  assert.equal(result.p3.cost, (300000 * 0.01 * 0.95 + 12 * 0.01) / 12);
});

test("measured total overrides band, harness, and reasoning including measured zero", () => {
  for (const measured of [0, 7.5]) {
    const result = estimate({ users: 10, runs: 20, band, factor, measured, widening: 3 });
    assert.deepEqual(result, {
      low: measured * 200, likely: measured * 200, high: measured * 200, measured: true
    });
  }
});

test("reasoning widens extremes without changing likely", () => {
  assert.deepEqual(estimate({ users: 1, runs: 1, band, factor, widening: 3 }), {
    low: 100 / 3, likely: 540, high: 5400, measured: false
  });
});

test("Microsoft Copilot harness rename preserves IDs and planning arithmetic", () => {
  const harness = data.harnesses.find((entry) => entry.id === "github");
  assert.equal(harness.name, "Microsoft Copilot harness");
  assert.equal(harness.value, "github");
  assert.equal(data.rates.github.name, harness.name);
  const result = estimate({ users: 10, runs: 20, band, factor: data.rates[harness.value] });
  assert.deepEqual(result, { low: 20000, likely: 108000, high: 360000, measured: false });
});

test("the Microsoft Copilot harness picker uses its planning range, not its internal key", () => {
  const harness = data.harnesses.find((entry) => entry.id === "github");
  assert.deepEqual(harnessRatePresentation(harness, data.rates, String), {
    value: "1–6× (likely 3×)",
    unit: "times a comparable standard run"
  });
});

test("the rename helper is visible only for the Microsoft Copilot harness", () => {
  for (const [value, hidden] of [["standard", true], ["github", false], ["conversation", true]]) {
    const helper = { hidden: true };
    syncHarnessHelp({ value }, helper);
    assert.equal(helper.hidden, hidden);
  }
});

test("Dynamics 365 presets use Standard with the specified volume, ranges, and value samples", () => {
  const expected = [
    ["d365-customer-service", 25, 200, [40, 80, 150], [200000, 400000, 750000], "outcomes", 1, 6],
    ["d365-field-service", 20, 60, [30, 60, 120], [36000, 72000, 144000], "hours", 0.25, 70]
  ];
  for (const [id, users, runs, bandValues, totals, method, quantityPerRun, unitValue] of expected) {
    const preset = data.presets.find((entry) => entry.id === id);
    assert.ok(preset);
    assert.equal(preset.harness, "standard");
    assert.deepEqual(preset.defaults, { users, runs });
    assert.deepEqual([preset.low, preset.likely, preset.high], bandValues);
    assert.equal(preset.confidence, "range");
    assert.equal(preset.sampleLabel, "Illustrative sample, not measured");
    assert.equal(preset.why, "Illustrative sample values. They assume a few generative answers, one or two grounded lookups and an agent action per run on the standard harness. Replace with your pilot's measured credits per run.");
    assert.equal(preset.valueSample.method, method);
    assert.equal(preset.valueSample.quantityPerRun, quantityPerRun);
    assert.equal(preset.valueSample.unitValue, unitValue);
    const result = estimate({
      users, runs, band: preset, factor: { low: 1, likely: 1, high: 1 }
    });
    assert.deepEqual([result.low, result.likely, result.high], totals);
  }
  assert.equal(data.presets.find((entry) => entry.id === "d365-customer-service").valueSample.quantityLabel, "Cases resolved per month");
  assert.equal(data.presets.find((entry) => entry.id === "d365-customer-service").valueSample.unitLabel, "USD value per case");
  assert.equal(data.presets.find((entry) => entry.id === "d365-field-service").valueSample.quantityLabel, "Hours saved per month (0.25 h per work order)");
  assert.equal(data.presets.find((entry) => entry.id === "d365-field-service").valueSample.unitLabel, "Loaded USD per hour");
});

test("pricing data contains no capacity-pack key or copy", () => {
  assert.equal(Object.hasOwn(data.rates, "pack"), false);
  assert.doesNotMatch(JSON.stringify(data).toLowerCase(), /capacity\s*packs?/);
});

test("every rate, preset, harness, and policy has public provenance", () => {
  for (const entry of [...Object.values(data.rates), data.planning, ...data.presets, ...data.harnesses]) {
    assert.ok("value" in entry || ["low", "likely", "high"].every((key) => Number.isFinite(entry[key])));
    assert.ok(entry.unit && entry.why);
    assert.ok(["published", "range", "early"].includes(entry.confidence));
    assert.match(entry.asOf, /^\d{4}-\d{2}-\d{2}$/);
    const url = new URL(entry.source);
    assert.equal(url.protocol, "https:");
    assert.ok(["learn.microsoft.com", "www.microsoft.com", "cdn-dynmedia-1.microsoft.com"].includes(url.hostname));
  }
});
