import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { estimate, sizeFor, price } from "./calculate.js";

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

test("P3 uses the full commitment discount, not marginal tier slices", () => {
  for (const tier of data.rates.p3.value) {
    const result = price(tier.credits / 12, data.rates, 12);
    assert.equal(result.p3.credits, tier.credits);
    assert.ok(Math.abs(result.p3.cost - tier.credits * 0.01 * (1 - tier.discount) / 12) < 0.000001);
  }
});

test("P3 charges unused commitment and PAYG overflow, and packs round up", () => {
  const zero = price(0, data.rates, 12);
  assert.equal(zero.payg, 0);
  assert.equal(zero.packs, 0);
  assert.equal(zero.p3.cost, 300000 * 0.01 * 0.95 / 12);
  const result = price(25001, data.rates, 12);
  assert.equal(result.packs, 2);
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
