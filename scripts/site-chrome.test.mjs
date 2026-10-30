import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";

const source = readFileSync(new URL("../assets/site-chrome.js", import.meta.url), "utf8");

function render(pathname, hash = "") {
  const listeners = {};
  const menu = {
    attributes: { "aria-expanded": "false" },
    getAttribute(name) { return this.attributes[name]; },
    setAttribute(name, value) { this.attributes[name] = value; },
    addEventListener(name, callback) { listeners[`menu:${name}`] = callback; },
    focus() { this.focused = true; }
  };
  const select = {
    addEventListener(name, callback) { listeners[`select:${name}`] = callback; }
  };
  const header = {
    set innerHTML(html) {
      this.html = html;
      this.links = [...html.matchAll(/<a href="([^"]+)">([^<]+)<\/a>/g)].map(([, href, text]) => ({
        href, text, attributes: {},
        getAttribute(name) { return name === "href" ? href : this.attributes[name]; },
        setAttribute(name, value) { this.attributes[name] = value; },
        removeAttribute(name) { delete this.attributes[name]; },
        addEventListener(name, callback) { this[name] = callback; }
      }));
    },
    querySelector: () => menu,
    querySelectorAll() { return this.links; },
    addEventListener(name, callback) { listeners[`header:${name}`] = callback; },
    contains: (target) => target === menu
  };
  const footer = {};
  const document = {
    documentElement: { dataset: { themePreference: "auto" } },
    querySelector: (selector) => selector === "[data-site-header]" ? header : footer,
    getElementById: () => select,
    addEventListener(name, callback) { listeners[`document:${name}`] = callback; }
  };
  const window = {
    location: { pathname, hash },
    matchMedia: () => ({ addEventListener(name, callback) { listeners.breakpoint = callback; } }),
    addEventListener(name, callback) { listeners[`window:${name}`] = callback; },
    siteTheme: { setPreference(value) { this.preference = value; } }
  };
  vm.runInNewContext(source, { window, document });
  return { header, footer, menu, select, window, listeners };
}

test("one ordered nav and footer preserve all destinations", () => {
  const { header, footer } = render("/");
  assert.deepEqual(header.links.map(({ href, text }) => [href, text]), [
    ["/", "Home"], ["/#work", "Work"], ["/#capabilities", "Capabilities"],
    ["/#resume", "Resume"], ["/journal/", "Solution journal"], ["/blog/", "Blog"],
    ["/tools/", "Tools"], ["/#connect", "Connect"]
  ]);
  for (const href of ["/journal/", "/blog/", "/tools/", "/subscribe/", "/feeds/rss.xml",
    "https://github.com/billwhalenmsft", "https://www.linkedin.com/in/williamjaywhalen/"]) {
    assert.ok(footer.innerHTML.includes(`href="${href}"`));
  }
  assert.ok(header.html.includes('aria-label="RSS feed"'));
});

test("child pages and homepage sections highlight exactly one current link", () => {
  for (const [path, hash, expected] of [
    ["/", "", "/"], ["/index.html", "#work", "/#work"], ["/", "#resume", "/#resume"],
    ["/", "#about", "/#resume"], ["/", "#contact", "/#connect"],
    ["/journal/atomic-blueprint/", "", "/journal/"],
    ["/blog/software-factory-pattern/", "", "/blog/"],
    ["/tools/tokenomics/", "", "/tools/"]
  ]) {
    const { header } = render(path, hash);
    assert.deepEqual(header.links.filter((link) => link.attributes["aria-current"] === "page")
      .map((link) => link.href), [expected]);
  }
  const page = render("/");
  page.window.location.hash = "#capabilities";
  page.listeners["window:hashchange"]();
  assert.equal(page.header.links.find((link) => link.attributes["aria-current"])?.href, "/#capabilities");
  assert.equal(render("/404.html").header.links.some((link) => link.attributes["aria-current"]), false);
});

test("quick launch is homepage-only and every theme control uses shared preferences", () => {
  assert.ok(render("/").header.html.includes('id="commandButton"'));
  assert.ok(!render("/blog/").header.html.includes('id="commandButton"'));
  const page = render("/tools/");
  assert.equal(page.select.value, "auto");
  page.select.value = "dark";
  page.listeners["select:change"]();
  assert.equal(page.window.siteTheme.preference, "dark");
});

test("mobile menu toggles and closes on Escape, navigation, outside click, or resize", () => {
  const page = render("/blog/");
  const open = () => {
    page.listeners["menu:click"]();
    assert.equal(page.menu.attributes["aria-expanded"], "true");
  };
  open();
  page.listeners["header:keydown"]({ key: "Escape" });
  assert.equal(page.menu.attributes["aria-expanded"], "false");
  assert.equal(page.menu.focused, true);
  open();
  page.header.links[0].click();
  assert.equal(page.menu.attributes["aria-expanded"], "false");
  open();
  page.listeners["document:click"]({ target: {} });
  assert.equal(page.menu.attributes["aria-expanded"], "false");
  open();
  page.listeners.breakpoint();
  assert.equal(page.menu.attributes["aria-expanded"], "false");
});
