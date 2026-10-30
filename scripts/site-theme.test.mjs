import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";

const source = readFileSync(new URL("../assets/site-theme.js", import.meta.url), "utf8");

function loadTheme({ storage = new Map(), search = "", dark = false, blocked = false } = {}) {
  const listeners = {};
  const system = { matches: dark, addEventListener: (name, callback) => { listeners.system = callback; } };
  const document = { documentElement: { dataset: {} }, getElementById: () => null };
  const localStorage = {
    getItem(key) { if (blocked) throw new Error("Blocked"); return storage.get(key) ?? null; },
    setItem(key, value) { if (blocked) throw new Error("Blocked"); storage.set(key, value); },
    removeItem(key) { if (blocked) throw new Error("Blocked"); storage.delete(key); }
  };
  const window = {
    matchMedia: () => system,
    location: { search, href: `https://example.test/blog/${search}` },
    history: { replaceState: (state, title, url) => { window.location.href = String(url); } },
    addEventListener: (name, callback) => { listeners[name] = callback; }
  };
  vm.runInNewContext(source, { window, document, localStorage, URL, URLSearchParams });
  return { window, dataset: document.documentElement.dataset, system, listeners, storage };
}

test("theme preferences persist between pages under one key", () => {
  const page = loadTheme();
  page.window.siteTheme.setPreference("dark");
  assert.equal(page.storage.get("site-theme"), "dark");
  assert.equal(loadTheme({ storage: page.storage }).dataset.theme, "dark");
  page.window.siteTheme.setPreference("light");
  assert.equal(loadTheme({ storage: page.storage, dark: true }).dataset.theme, "light");
});

test("Auto follows system changes, but explicit choices do not", () => {
  const page = loadTheme();
  assert.equal(page.dataset.themePreference, "auto");
  assert.equal(page.dataset.theme, "light");
  page.system.matches = true;
  page.listeners.system();
  assert.equal(page.dataset.theme, "dark");
  page.window.siteTheme.setPreference("light");
  page.listeners.system();
  assert.equal(page.dataset.theme, "light");
  page.window.siteTheme.setPreference("auto");
  assert.equal(page.dataset.theme, "dark");
});

test("legacy keys and scoutTheme URLs migrate without losing explicit choices", () => {
  for (const key of ["scoutTheme", "theme", "themePreference"]) {
    const storage = new Map([[key, "dark"]]);
    assert.equal(loadTheme({ storage }).dataset.theme, "dark");
    assert.deepEqual([...storage], [["site-theme", "dark"]]);
  }
  const page = loadTheme({ search: "?scoutTheme=dark&view=external" });
  assert.equal(page.storage.get("site-theme"), "dark");
  page.window.siteTheme.setPreference("light");
  assert.equal(new URL(page.window.location.href).search, "?view=external");
  const storage = new Map([["site-theme", "light"], ["theme", "dark"]]);
  assert.equal(loadTheme({ storage }).dataset.theme, "light");
});

test("invalid values and unavailable storage safely fall back to Auto", () => {
  assert.equal(loadTheme({ search: "?scoutTheme=invalid", dark: true }).dataset.theme, "dark");
  const page = loadTheme({ blocked: true });
  assert.equal(page.dataset.themePreference, "auto");
  page.window.siteTheme.setPreference("dark");
  assert.equal(page.dataset.theme, "dark");
});

test("theme changes in another tab update the current page", () => {
  const page = loadTheme();
  page.listeners.storage({ key: "site-theme", newValue: "dark" });
  assert.equal(page.dataset.theme, "dark");
  page.listeners.storage({ key: "other", newValue: "light" });
  assert.equal(page.dataset.theme, "dark");
  page.listeners.storage({ key: null, newValue: null });
  assert.equal(page.dataset.themePreference, "auto");
});
