import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export const SITE_URL = "https://billwhalenmsft.github.io";
export const RELEASE_DATE = "2026-09-14";

const themeScript = `<script>
  (() => {
    const param = new URLSearchParams(window.location.search).get("scoutTheme");
    const theme =
      param || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    document.documentElement.setAttribute("data-theme", theme);
  })();
</script>`;

const themeVariables = `:root {
  color-scheme: light;
  --cp-bg: #f7f4ef;
  --cp-bg-elevated: #fcfbf8;
  --cp-surface: #ffffff;
  --cp-surface-soft: #f5f5f5;
  --cp-border: #dedede;
  --cp-border-strong: #919191;
  --cp-text: #242424;
  --cp-text-muted: #5c5c5c;
  --cp-text-soft: #6f6f6f;
  --cp-accent: #b11f4b;
  --cp-accent-hover: #9a1a41;
  --cp-accent-soft: rgba(177, 31, 75, 0.08);
  --cp-accent-fg: #ffffff;
  --cp-success: #16a34a;
  --cp-danger: #dc2626;
  --cp-warning: #f59e0b;
  --cp-link: #0078d4;
  --cp-shadow: 0 18px 48px rgba(0, 0, 0, 0.12);
  --cp-overlay: rgba(255, 255, 255, 0.8);
  --cp-panel: rgba(255, 255, 255, 0.86);
  --cp-panel-strong: rgba(255, 255, 255, 0.96);
  --cp-sheen: rgba(255, 255, 255, 0.55);
  --cp-highlight: rgba(177, 31, 75, 0.12);
}
html[data-theme="dark"] {
  color-scheme: dark;
  --cp-bg: #3d3b3a;
  --cp-bg-elevated: #343231;
  --cp-surface: #292929;
  --cp-surface-soft: #2e2e2e;
  --cp-border: #474747;
  --cp-border-strong: #5f5f5f;
  --cp-text: #dedede;
  --cp-text-muted: #919191;
  --cp-text-soft: #b0b0b0;
  --cp-accent: #fd8ea1;
  --cp-accent-hover: #fb7b91;
  --cp-accent-soft: rgba(253, 142, 161, 0.14);
  --cp-accent-fg: #1a1a1a;
  --cp-success: #4ade80;
  --cp-danger: #f87171;
  --cp-warning: #fbbf24;
  --cp-link: #4da6ff;
  --cp-shadow: 0 18px 48px rgba(0, 0, 0, 0.32);
  --cp-overlay: rgba(41, 41, 41, 0.88);
  --cp-panel: rgba(41, 41, 41, 0.72);
  --cp-panel-strong: rgba(41, 41, 41, 0.96);
  --cp-sheen: rgba(255, 255, 255, 0.04);
  --cp-highlight: rgba(253, 142, 161, 0.12);
}`;

const siteCss = `${themeVariables}
html[data-brand="atomic"] {
  color-scheme: light;
  --cp-bg: #FFFFFF;
  --cp-bg-elevated: #FFFFFF;
  --cp-surface: #FFFFFF;
  --cp-surface-soft: #EAF3FF;
  --cp-border: #B9CAE0;
  --cp-border-strong: #0057B8;
  --cp-text: #142D4E;
  --cp-text-muted: #003B7A;
  --cp-text-soft: #142D4E;
  --cp-accent: #0057B8;
  --cp-accent-hover: #003B7A;
  --cp-accent-soft: #EAF3FF;
  --cp-accent-fg: #FFFFFF;
  --cp-link: #003B7A;
  --cp-shadow: 0 0 2px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.14);
  --cp-overlay: rgba(20, 45, 78, 0.48);
  --cp-panel: #FFFFFF;
  --cp-panel-strong: #FFFFFF;
  --cp-sheen: #FFFFFF;
  --cp-highlight: #EAF3FF;
  --cp-grid: rgba(185, 202, 224, 0.42);
}
html[data-brand="atomic"][data-theme="dark"] {
  color-scheme: dark;
  --cp-bg: #07182C;
  --cp-bg-elevated: #0A1E36;
  --cp-surface: #0D2745;
  --cp-surface-soft: #122F52;
  --cp-border: #365D85;
  --cp-border-strong: #78B4F8;
  --cp-text: #F5F9FF;
  --cp-text-muted: #B9D8FA;
  --cp-text-soft: #DFEEFF;
  --cp-accent: #78B4F8;
  --cp-accent-hover: #A8D2FF;
  --cp-accent-soft: #122F52;
  --cp-accent-fg: #07182C;
  --cp-link: #A8D2FF;
  --cp-shadow: 0 0 2px rgba(120, 180, 248, 0.24), 0 1px 2px rgba(0, 0, 0, 0.3);
  --cp-overlay: rgba(2, 12, 24, 0.78);
  --cp-panel: #0D2745;
  --cp-panel-strong: #0D2745;
  --cp-sheen: #0D2745;
  --cp-highlight: #173B64;
  --cp-grid: rgba(54, 93, 133, 0.24);
}
* { box-sizing: border-box; }
html { scroll-behavior: smooth; scroll-padding-top: 6rem; }
body {
  min-width: 20rem;
  margin: 0;
  overflow-x: hidden;
  background: var(--cp-bg);
  color: var(--cp-text);
  font-family: "Segoe UI", Aptos, Calibri, -apple-system, BlinkMacSystemFont, sans-serif;
  line-height: 1.6;
  text-rendering: optimizeLegibility;
}
body::before {
  position: fixed;
  inset: 0;
  z-index: -1;
  background-image:
    linear-gradient(to right, var(--cp-grid) 1px, transparent 1px),
    linear-gradient(to bottom, var(--cp-grid) 1px, transparent 1px);
  background-size: 5rem 5rem;
  content: "";
  opacity: 0.3;
  pointer-events: none;
}
a { color: var(--cp-link); }
button, input { font: inherit; }
button, a { -webkit-tap-highlight-color: var(--cp-accent-soft); }
button { color: inherit; }
svg { display: block; max-width: 100%; }
h1, h2, h3, p { margin-top: 0; }
h1, h2, h3 { line-height: 1.08; letter-spacing: -0.035em; }
h1 { max-width: 15ch; font-size: clamp(2.75rem, 8vw, 5.5rem); }
h2 { font-size: clamp(1.85rem, 4vw, 3rem); }
h3 { font-size: 1.15rem; }
.shell { width: min(100% - 2rem, 77.5rem); margin-inline: auto; }
.skip-link {
  position: fixed;
  top: 0.75rem;
  left: 0.75rem;
  z-index: 50;
  padding: 0.65rem 0.85rem;
  border-radius: 0.625rem;
  background: var(--cp-accent);
  color: var(--cp-accent-fg);
  font-weight: 800;
  transform: translateY(-160%);
}
.skip-link:focus { transform: translateY(0); }
:focus-visible { outline: 3px solid var(--cp-accent); outline-offset: 3px; }
.site-header {
  position: sticky;
  top: 0;
  z-index: 20;
  border-bottom: 1px solid var(--cp-border);
  background: var(--cp-panel-strong);
}
.nav {
  display: flex;
  min-height: 5.5rem;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}
.brand {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  color: var(--cp-text);
  text-decoration: none;
}
.brand-mark {
  display: grid;
  width: 2.55rem;
  height: 2.55rem;
  place-items: center;
  border: 1px solid var(--cp-border-strong);
  border-radius: 0.625rem;
  background: var(--cp-surface);
  color: var(--cp-accent);
  font-family: Consolas, "Courier New", Courier, monospace;
  font-size: 0.78rem;
  font-weight: 800;
}
.brand-copy { display: grid; color: var(--cp-text); line-height: 1.1; }
.brand-copy small {
  margin-top: 0.28rem;
  color: var(--cp-text-muted);
  font-size: 0.61rem;
  font-weight: 700;
  letter-spacing: 0.17em;
}
.nav-links, .footer-links, .hero-actions, .card-actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.85rem;
}
.nav-links a, .footer-links a {
  color: var(--cp-text-muted);
  font-size: 0.86rem;
  font-weight: 700;
  text-decoration: none;
}
.nav-links a:hover, .footer-links a:hover { color: var(--cp-accent); }
.icon-button {
  display: grid;
  width: 2.75rem;
  height: 2.75rem;
  place-items: center;
  border: 1px solid var(--cp-border);
  border-radius: 0.625rem;
  background: var(--cp-surface);
  cursor: pointer;
}
.icon-button:hover { border-color: var(--cp-border-strong); color: var(--cp-accent); }
.hero {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(18rem, 0.9fr);
  align-items: center;
  gap: clamp(2rem, 6vw, 5rem);
  padding-block: clamp(4.5rem, 9vw, 7rem);
}
.hero-copy { max-width: 46rem; color: var(--cp-text-muted); font-size: clamp(1rem, 2.4vw, 1.22rem); }
.eyebrow, .section-kicker, .label {
  color: var(--cp-accent);
  font-family: Consolas, "Courier New", Courier, monospace;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.11em;
  text-transform: uppercase;
}
.button {
  display: inline-flex;
  min-height: 2.75rem;
  align-items: center;
  justify-content: center;
  padding: 0.65rem 0.95rem;
  border: 1px solid var(--cp-border);
  border-radius: 0.625rem;
  background: var(--cp-surface);
  color: var(--cp-text);
  font-weight: 750;
  text-decoration: none;
}
.button:hover { border-color: var(--cp-border-strong); }
.button-primary { border-color: var(--cp-accent); background: var(--cp-accent); color: var(--cp-accent-fg); }
.button-primary:hover { background: var(--cp-accent-hover); }
.button-small { min-height: 2.75rem; padding: 0.48rem 0.72rem; font-size: 0.82rem; }
.evidence-card, .panel, .release-card {
  border: 1px solid var(--cp-border);
  border-radius: 16px;
  background: var(--cp-surface);
  box-shadow: var(--cp-shadow);
}
.evidence-card { padding: 1.5rem; }
.evidence-card strong { display: block; margin: 0.5rem 0; font-size: 1.25rem; }
.evidence-card p { margin-bottom: 0; color: var(--cp-text-muted); }
.status {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  color: var(--cp-text-muted);
  font-family: Consolas, "Courier New", Courier, monospace;
  font-size: 0.7rem;
  font-weight: 750;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
.status::before {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
  background: var(--cp-success);
  content: "";
}
.status-info::before { background: var(--cp-warning); }
.section { padding-block: clamp(4rem, 8vw, 6.5rem); border-top: 1px solid var(--cp-border); }
.section-heading {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(16rem, 0.65fr);
  align-items: end;
  gap: 2rem;
  margin-bottom: 2rem;
}
.section-heading p { margin-bottom: 0; color: var(--cp-text-muted); }
.filter-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.5rem;
}
.filters { display: flex; flex-wrap: wrap; gap: 0.5rem; }
.filter-chip {
  min-height: 2.75rem;
  padding: 0.5rem 0.8rem;
  border: 1px solid var(--cp-border);
  border-radius: 999px;
  background: var(--cp-surface);
  cursor: pointer;
  font-size: 0.82rem;
  font-weight: 700;
}
.filter-chip[aria-pressed="true"] { border-color: var(--cp-accent); background: var(--cp-accent); color: var(--cp-accent-fg); }
.search {
  width: min(20rem, 100%);
  min-height: 2.75rem;
  padding: 0.55rem 0.75rem;
  border: 1px solid var(--cp-border);
  border-radius: 0.625rem;
  background: var(--cp-surface);
  color: var(--cp-text);
}
.release-grid, .detail-grid, .flow-grid, .split-grid {
  display: grid;
  gap: 1rem;
}
.release-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
.release-card {
  display: flex;
  min-height: 24rem;
  flex-direction: column;
  padding: 1.3rem;
}
.release-card p { color: var(--cp-text-muted); }
.release-card .card-actions { margin-top: auto; padding-top: 1rem; }
.tag-list, .plain-list, .source-list {
  margin: 0;
  padding: 0;
  list-style: none;
}
.tag-list { display: flex; flex-wrap: wrap; gap: 0.45rem; margin-bottom: 1rem; }
.tag-list li {
  padding: 0.3rem 0.55rem;
  border: 1px solid var(--cp-border);
  border-radius: 999px;
  background: var(--cp-surface-soft);
  color: var(--cp-text-muted);
  font-size: 0.72rem;
  font-weight: 700;
}
.flow-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
.panel { padding: clamp(1.25rem, 3vw, 2rem); }
.panel p:last-child, .panel ul:last-child { margin-bottom: 0; }
.panel p, .plain-list, .source-list { color: var(--cp-text-muted); }
.plain-list li, .source-list li { position: relative; padding: 0.65rem 0 0.65rem 1.1rem; border-bottom: 1px solid var(--cp-border); }
.plain-list li:last-child, .source-list li:last-child { border-bottom: 0; }
.plain-list li::before, .source-list li::before {
  position: absolute;
  top: 1.28rem;
  left: 0;
  width: 0.4rem;
  height: 0.4rem;
  border-radius: 50%;
  background: var(--cp-accent);
  content: "";
}
.source-list small { display: block; margin-top: 0.25rem; color: var(--cp-text-muted); }
.detail-grid { grid-template-columns: minmax(0, 1fr) minmax(18rem, 0.65fr); }
.split-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.architecture {
  padding: clamp(1rem, 3vw, 2rem);
  overflow: hidden;
  border: 1px solid var(--cp-border);
  border-radius: 16px;
  background: var(--cp-surface-soft);
}
.architecture svg { width: 100%; height: auto; color: var(--cp-text); }
.architecture .node { fill: var(--cp-surface); stroke: var(--cp-border-strong); }
.architecture .arrow { stroke: var(--cp-accent); }
.architecture text { fill: var(--cp-text); font-family: "Segoe UI", Aptos, Calibri, -apple-system, BlinkMacSystemFont, sans-serif; }
.architecture .node-index { fill: var(--cp-accent); font-family: Consolas, "Courier New", Courier, monospace; font-weight: 800; }
.architecture-notes { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.75rem; margin-top: 1rem; }
.architecture-note { padding: 1rem; border: 1px solid var(--cp-border); border-radius: 0.625rem; background: var(--cp-surface); }
.architecture-note p { margin: 0.35rem 0 0; color: var(--cp-text-muted); font-size: 0.88rem; }
.callout {
  margin: 1.5rem 0;
  padding: 1rem 1.2rem;
  border-left: 3px solid var(--cp-accent);
  background: var(--cp-accent-soft);
}
.callout p:last-child { margin-bottom: 0; }
.article-body { width: min(100%, 52rem); }
.article-body > p { color: var(--cp-text-muted); font-size: 1.05rem; }
.article-body h2 { margin-top: 3rem; }
.meta-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem 1rem;
  margin: 1rem 0 1.5rem;
  color: var(--cp-text-muted);
  font-family: Consolas, "Courier New", Courier, monospace;
  font-size: 0.76rem;
}
.activity-line {
  margin: 0 0 1rem;
  color: var(--cp-text-muted);
  font-family: Consolas, "Courier New", Courier, monospace;
  font-size: 0.76rem;
}
.result-count { margin: -0.5rem 0 1rem; color: var(--cp-text-muted); font-size: 0.82rem; }
.journal-lane + .journal-lane { margin-top: 3rem; }
.lane-heading {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
}
.lane-heading h3 { margin: 0; font-size: clamp(1.4rem, 3vw, 2rem); }
.lane-heading p { max-width: 40rem; margin: 0; color: var(--cp-text-muted); font-size: 0.88rem; }
.info-boundary {
  margin: 0 0 1rem;
  padding: 1rem 1.15rem;
  border-left: 3px solid var(--cp-warning);
  background: var(--cp-surface);
  color: var(--cp-text-muted);
}
.no-results { padding: 2rem; border: 1px dashed var(--cp-border-strong); border-radius: 16px; text-align: center; }
.site-footer { padding-block: 2rem; border-top: 1px solid var(--cp-border); }
.footer-inner { display: flex; align-items: center; justify-content: space-between; gap: 1.5rem; }
.footer-inner p { max-width: 48rem; margin: 0; color: var(--cp-text-muted); font-size: 0.8rem; }
@media (max-width: 62rem) {
  .release-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .hero, .detail-grid { grid-template-columns: 1fr; }
}
@media (max-width: 46rem) {
  html { scroll-padding-top: 5rem; }
  .shell { width: min(100% - 1.25rem, 77.5rem); }
  .nav { min-height: 4.5rem; flex-wrap: wrap; padding-block: 0.5rem; }
  .nav-links { order: 3; width: 100%; justify-content: space-between; padding-bottom: 0.5rem; }
  .section-heading, .flow-grid, .release-grid, .split-grid, .architecture-notes { grid-template-columns: 1fr; }
  .filter-bar { align-items: stretch; flex-direction: column; }
  .lane-heading { align-items: flex-start; flex-direction: column; }
  .search { width: 100%; }
  .release-card { min-height: auto; }
  .footer-inner { align-items: flex-start; flex-direction: column; }
}
@media (max-width: 23rem) {
  .brand-copy small { display: none; }
}
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    scroll-behavior: auto !important;
    transition-duration: 0.01ms !important;
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
  }
}`;

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function escapeXml(value) {
  return escapeHtml(value);
}

function safeJson(value) {
  return JSON.stringify(value, null, 2).replaceAll("<", "\\u003c");
}

function evidenceLabel(level) {
  return `${level[0].toUpperCase()}${level.slice(1)} value`;
}

export function orderedReleases(catalog) {
  return catalog.releases
    .filter((release) => release.publicationMode === "public-release")
    .sort((left, right) =>
    right.publicActivity.lastPublicPush.localeCompare(left.publicActivity.lastPublicPush)
      || left.title.localeCompare(right.title)
  );
}

export function orderedInfoOnly(catalog) {
  return catalog.releases
    .filter((release) => release.publicationMode === "info-only")
    .sort((left, right) =>
      right.ownerReviewedAsOf.localeCompare(left.ownerReviewedAsOf)
    );
}

function evidenceUrls(release) {
  return [
    ...release.sourceUrls,
    ...(release.publicLinks || []).map((link) => link.url)
  ];
}

function nav() {
  return `<header class="site-header">
  <nav class="nav shell" aria-label="Primary navigation">
    <a class="brand" href="/">
      <span class="brand-mark" aria-hidden="true">BW</span>
      <span class="brand-copy"><strong>Bill Whalen</strong><small>THE ATOMIC COLLECTION</small></span>
    </a>
    <div class="nav-links">
      <a href="/">Home</a>
      <a href="/journal/">Solution journal</a>
      <a href="/subscribe/">Subscribe</a>
      <a href="/feeds/rss.xml">RSS</a>
    </div>
    <button class="icon-button" id="themeButton" type="button" aria-label="Switch theme">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M12 3v2m0 14v2M3 12h2m14 0h2M5.64 5.64l1.42 1.42m9.88 9.88 1.42 1.42m0-12.72-1.42 1.42M7.06 16.94l-1.42 1.42M16.5 12a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Z" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>
      </svg>
    </button>
  </nav>
</header>`;
}

function footer() {
  return `<footer class="site-footer">
  <div class="footer-inner shell">
    <p>&copy; 2026 Bill Whalen. Personal portfolio; views are my own. Community projects are provided as-is and are not Microsoft products or supported offerings.</p>
    <div class="footer-links">
      <a href="/journal/">Journal</a>
      <a href="/subscribe/">Feeds</a>
      <a href="https://github.com/billwhalenmsft" rel="noreferrer">GitHub</a>
    </div>
  </div>
</footer>`;
}

function behaviorScript(extra = "") {
  return `<script>
  const themeButton = document.getElementById("themeButton");
  themeButton.addEventListener("click", () => {
    const nextTheme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = nextTheme;
    const url = new URL(window.location.href);
    url.searchParams.set("scoutTheme", nextTheme);
    window.history.replaceState({}, "", url);
    themeButton.setAttribute("aria-label", \`Switch to \${nextTheme === "dark" ? "light" : "dark"} theme\`);
  });
  themeButton.setAttribute(
    "aria-label",
    \`Switch to \${document.documentElement.dataset.theme === "dark" ? "light" : "dark"} theme\`
  );
  ${extra}
</script>`;
}

function page({ title, description, canonical, type = "website", jsonLd, body, script = "" }) {
  return `<!DOCTYPE html>
<html lang="en" data-brand="atomic">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="${escapeHtml(description)}">
  <meta name="author" content="Bill Whalen">
  <meta name="theme-color" content="#0057B8">
  <link rel="canonical" href="${canonical}">
  <link rel="alternate" type="application/rss+xml" title="Bill Whalen solution journal RSS" href="${SITE_URL}/feeds/rss.xml">
  <link rel="alternate" type="application/atom+xml" title="Bill Whalen solution journal Atom" href="${SITE_URL}/feeds/atom.xml">
  <meta property="og:type" content="${type}">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:url" content="${canonical}">
  <meta name="twitter:card" content="summary">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Cpath d='M10 12h18c9 0 14 4 14 11 0 5-3 8-7 10 6 1 10 5 10 11 0 8-6 12-16 12H10V12Zm10 9v8h8c3 0 5-1 5-4s-2-4-5-4h-8Zm0 17v9h9c4 0 6-1 6-4 0-4-2-5-6-5h-9Z' fill='currentColor'/%3E%3C/svg%3E">
  <title>${escapeHtml(title)}</title>
  ${themeScript}
  <script type="application/ld+json">
${safeJson(jsonLd).split("\n").map((line) => `    ${line}`).join("\n")}
  </script>
  <style>
${siteCss.split("\n").map((line) => `    ${line}`).join("\n")}
  </style>
</head>
<body>
  <a class="skip-link" href="#main">Skip to content</a>
  ${nav()}
  <main id="main">
${body}
  </main>
  ${footer()}
  ${behaviorScript(script)}
</body>
</html>
`;
}

function architectureSvg(release, prefix) {
  const nodes = release.visual.nodes.slice(0, 4);
  const width = 210;
  const gap = 30;
  const start = 20;
  const nodeMarkup = nodes.map((node, index) => {
    const x = start + index * (width + gap);
    const arrow = index < nodes.length - 1
      ? `<path class="arrow" d="M${x + width} 145H${x + width + gap - 8}" fill="none" stroke-width="4" marker-end="url(#${prefix}-arrow)"/>`
      : "";
    return `<g>
      <rect class="node" x="${x}" y="70" width="${width}" height="150" rx="16"/>
      <text class="node-index" x="${x + 18}" y="102" font-size="16">0${index + 1}</text>
      <text x="${x + width / 2}" y="148" font-size="18" font-weight="700" text-anchor="middle">${escapeHtml(node)}</text>
      ${arrow}
    </g>`;
  }).join("\n");

  return `<div class="architecture">
  <svg viewBox="0 0 960 290" role="img" aria-labelledby="${prefix}-title ${prefix}-desc">
    <title id="${prefix}-title">${escapeHtml(release.title)} architecture</title>
    <desc id="${prefix}-desc">${escapeHtml(release.visual.alt)}</desc>
    <defs>
      <marker id="${prefix}-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
        <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--cp-accent)"/>
      </marker>
    </defs>
    ${nodeMarkup}
  </svg>
</div>`;
}

function releaseCard(release) {
  const infoOnly = release.publicationMode === "info-only";
  const searchable = [
    release.title,
    release.summary,
    release.category,
    release.maturity,
    release.publicationMode,
    release.valueEvidence.level,
    ...release.tags
  ].join(" ").toLowerCase();
  const activity = infoOnly
    ? `Owner-reviewed as of <time datetime="${release.ownerReviewedAsOf}">${release.ownerReviewedAsOf}</time> &middot; not a code, adoption, or activity signal`
    : `Last public push <time datetime="${release.publicActivity.lastPublicPush}">${release.publicActivity.lastPublicPush}</time>`;
  const actions = infoOnly
    ? `<a class="button button-primary button-small" href="/journal/${release.slug}/">Info-only showcase</a>`
    : `<a class="button button-primary button-small" href="/journal/${release.slug}/">Solution entry</a>
    <a class="button button-small" href="/blog/${release.article.slug}/">Read the article</a>`;

  return `<article class="release-card" data-release="${escapeHtml(release.slug)}" data-mode="${release.publicationMode}" data-category="${escapeHtml(release.category)}" data-search="${escapeHtml(searchable)}">
  <span class="status${infoOnly ? " status-info" : ""}">${escapeHtml(release.maturity)}</span>
  <p class="eyebrow">${escapeHtml(release.category)}</p>
  <h2>${escapeHtml(release.title)}</h2>
  <p>${escapeHtml(release.summary)}</p>
  <p class="activity-line">${activity}</p>
  <ul class="tag-list">${release.tags.map((tag) => `<li>${escapeHtml(tag)}</li>`).join("")}</ul>
  <p><strong>Evidence:</strong> ${escapeHtml(release.valueEvidence.statement)}</p>
${infoOnly ? `<p><strong>Public boundary:</strong> ${escapeHtml(release.publicBoundary)}</p>` : ""}
  <div class="card-actions">
    ${actions}
  </div>
</article>`;
}

function journalIndex(catalog) {
  const releases = orderedReleases(catalog);
  const infoOnly = orderedInfoOnly(catalog);
  const entries = [...releases, ...infoOnly];
  const categories = [...new Set(entries.map((release) => release.category))].sort();
  const filters = [
    `<button class="filter-chip" type="button" data-filter="all" aria-pressed="true">All</button>`,
    `<button class="filter-chip" type="button" data-filter="public-release" aria-pressed="false">Public releases</button>`,
    `<button class="filter-chip" type="button" data-filter="info-only" aria-pressed="false">Info-only active work</button>`,
    ...categories.map((category) => `<button class="filter-chip" type="button" data-filter="${escapeHtml(category)}" aria-pressed="false">${escapeHtml(category)}</button>`)
  ].join("\n");
  const body = `    <section class="hero shell" aria-labelledby="journal-title">
      <div>
        <p class="eyebrow">Public-safe solution journal</p>
        <h1 id="journal-title">Build notes with the evidence attached.</h1>
        <p class="hero-copy">${releases.length} sourced public releases and ${infoOnly.length} information-only showcases explain the original state, what is being built, designed value, human controls, and the boundary around what is not published.</p>
        <div class="hero-actions">
          <a class="button button-primary" href="#releases">Explore the journal</a>
          <a class="button" href="/subscribe/">Follow the journal</a>
        </div>
      </div>
      <aside class="evidence-card" aria-label="Journal evidence policy">
        <span class="label">Evidence policy</span>
        <strong>Two clearly separated lanes.</strong>
        <p>Public releases cite public proof. Info-only active work has no source or download links and discloses that source and operational materials are not published.</p>
      </aside>
    </section>
    <section class="section" id="releases" aria-labelledby="releases-title">
      <div class="shell">
        <div class="section-heading">
          <div><span class="section-kicker">Journal catalog</span><h2 id="releases-title">Current entries.</h2></div>
          <p>Public releases use exact repository push facts. Info-only work uses an owner-reviewed as-of date that is not a code, adoption, or activity signal.</p>
        </div>
        <div class="filter-bar">
          <div class="filters" role="group" aria-label="Filter journal entries">${filters}</div>
          <label><span class="label">Search</span><input class="search" id="releaseSearch" type="search" autocomplete="off" placeholder="Search journal"></label>
        </div>
        <p class="result-count" id="releaseCount" aria-live="polite">${entries.length} entries &middot; ${releases.length} public releases &middot; ${infoOnly.length} info-only showcases</p>
        <section class="journal-lane" id="publicLane" aria-labelledby="public-lane-title">
          <div class="lane-heading">
            <h3 id="public-lane-title">Public releases</h3>
            <p>Source-backed entries ordered by exact last public repository push.</p>
          </div>
          <div class="release-grid">${releases.map(releaseCard).join("\n")}</div>
        </section>
        <section class="journal-lane" id="infoLane" aria-labelledby="info-lane-title">
          <div class="lane-heading">
            <h3 id="info-lane-title">Info-only active work</h3>
            <p>Owner-reviewed descriptions ordered by the disclosed as-of date, not by code, deployment, adoption, or results.</p>
          </div>
          <p class="info-boundary"><strong>Information-only.</strong> Source and operational materials are not published. These private active builds are not Microsoft products or officially supported offerings.</p>
          <div class="release-grid">${infoOnly.map(releaseCard).join("\n")}</div>
        </section>
        <div class="no-results" id="noResults" hidden>No journal entries match that filter. Try another category or clear the search.</div>
      </div>
    </section>`;

  const script = `
  const cards = [...document.querySelectorAll(".release-card")];
  const filters = [...document.querySelectorAll(".filter-chip")];
  const search = document.getElementById("releaseSearch");
  const count = document.getElementById("releaseCount");
  const noResults = document.getElementById("noResults");
  const publicLane = document.getElementById("publicLane");
  const infoLane = document.getElementById("infoLane");
  let activeFilter = "all";
  function applyFilters() {
    const query = search.value.trim().toLowerCase();
    let visible = 0;
    cards.forEach((card) => {
      const show = (activeFilter === "all" || card.dataset.mode === activeFilter || card.dataset.category === activeFilter)
        && (!query || card.dataset.search.includes(query));
      card.hidden = !show;
      if (show) visible += 1;
    });
    publicLane.hidden = ![...publicLane.querySelectorAll(".release-card")].some((card) => !card.hidden);
    infoLane.hidden = ![...infoLane.querySelectorAll(".release-card")].some((card) => !card.hidden);
    count.textContent = \`\${visible} \${visible === 1 ? "entry" : "entries"}\`;
    noResults.hidden = visible !== 0;
  }
  filters.forEach((filter) => filter.addEventListener("click", () => {
    activeFilter = filter.dataset.filter;
    filters.forEach((item) => item.setAttribute("aria-pressed", String(item === filter)));
    applyFilters();
  }));
  search.addEventListener("input", applyFilters);`;

  return page({
    title: "Solution journal | Bill Whalen",
    description: "Public-safe solution entries and illustrated build notes from Bill Whalen's Atomic Collection.",
    canonical: `${SITE_URL}/journal/`,
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "Bill Whalen solution journal",
      url: `${SITE_URL}/journal/`,
      description: "Customer-neutral public releases and clearly separated information-only active-work showcases.",
      numberOfItems: entries.length,
      hasPart: entries.map((release) => ({
        "@type": "CreativeWork",
        name: release.title,
        url: `${SITE_URL}/journal/${release.slug}/`
      }))
    },
    body,
    script
  });
}

function architectureNotes(release) {
  return `<div class="architecture-notes">${release.architecture.map((step, index) => `<article class="architecture-note">
  <span class="label">0${index + 1} / ${escapeHtml(step.label)}</span>
  <p>${escapeHtml(step.detail)}</p>
</article>`).join("\n")}</div>`;
}

function sourceList(release) {
  const sources = [
    ...release.provenance,
    {
      label: "GitHub public repository metadata",
      url: release.publicActivity.source,
      note: `Repository created ${release.publicActivity.repositoryCreated}; last public push ${release.publicActivity.lastPublicPush}. These are repository facts, not adoption evidence.`
    },
    ...(release.publicLinks || []).map((link) => ({
      label: link.label,
      url: link.url,
      note: `Public ${link.type} link declared by the project.`
    })),
    ...(release.attribution || []).map((item) => ({
      label: `Attribution: ${item.name}`,
      url: item.url,
      note: `${item.relationship} License: ${item.license}.`
    }))
  ];
  return `<ul class="source-list">${sources.map((source) => `<li>
  <a href="${escapeHtml(source.url)}" rel="noreferrer">${escapeHtml(source.label)}</a>
  <small>${escapeHtml(source.note)}</small>
</li>`).join("\n")}</ul>`;
}

function solutionPage(release) {
  const canonical = `${SITE_URL}/journal/${release.slug}/`;
  const body = `    <article>
      <header class="hero shell">
        <div>
          <p class="eyebrow">Solution entry &middot; ${escapeHtml(release.category)}</p>
          <h1>${escapeHtml(release.title)}</h1>
          <p class="hero-copy">${escapeHtml(release.summary)}</p>
          <div class="meta-row">
            <span>Published ${release.published}</span>
            <span>Updated ${release.updated}</span>
            <span>Repository created ${release.publicActivity.repositoryCreated}</span>
            <span>Last public push ${release.publicActivity.lastPublicPush}</span>
            <span>${escapeHtml(release.maturity)}</span>
          </div>
          <div class="hero-actions">
            <a class="button button-primary" href="${escapeHtml(release.sourceUrls[0])}" rel="noreferrer">Explore public proof</a>
${(release.publicLinks || []).map((link) => `<a class="button" href="${escapeHtml(link.url)}" rel="noreferrer">${escapeHtml(link.label)}</a>`).join("\n")}
            <a class="button" href="/blog/${release.article.slug}/">Read the field note</a>
          </div>
        </div>
        <aside class="evidence-card">
          <span class="label">Evidence label</span>
          <strong>${escapeHtml(release.valueEvidence.statement)}</strong>
          <p>This label is part of the release record. It distinguishes intended or observed value from a measured result.</p>
        </aside>
      </header>
      <section class="section" aria-labelledby="${release.slug}-flow">
        <div class="shell">
          <div class="section-heading">
            <div><span class="section-kicker">Original state to outcome</span><h2 id="${release.slug}-flow">What changed in the design.</h2></div>
            <p>Customer-neutral framing keeps the pattern reusable without claiming private results.</p>
          </div>
          <div class="flow-grid">
            <article class="panel"><span class="label">01 / Original state</span><h3>Before the solution</h3><p>${escapeHtml(release.originalState)}</p></article>
            <article class="panel"><span class="label">02 / Delivered</span><h3>What was built</h3><p>${escapeHtml(release.delivered)}</p></article>
            <article class="panel"><span class="label">03 / Outcome</span><h3>Value enabled</h3><p>${escapeHtml(release.outcome)}</p></article>
          </div>
        </div>
      </section>
      <section class="section" aria-labelledby="${release.slug}-architecture">
        <div class="shell">
          <div class="section-heading">
            <div><span class="section-kicker">Architecture</span><h2 id="${release.slug}-architecture">How the public pattern fits together.</h2></div>
            <p>${escapeHtml(release.visual.alt)}</p>
          </div>
          ${architectureSvg(release, `solution-${release.slug}`)}
          ${architectureNotes(release)}
        </div>
      </section>
      <section class="section" aria-labelledby="${release.slug}-boundaries">
        <div class="shell detail-grid">
          <div>
            <span class="section-kicker">Capabilities</span>
            <h2>What the project demonstrates.</h2>
            <ul class="plain-list">${release.capabilities.map((capability) => `<li>${escapeHtml(capability)}</li>`).join("")}</ul>
          </div>
          <div>
            <article class="panel">
              <span class="label">Human control and guardrails</span>
              <ul class="plain-list">${release.guardrails.map((guardrail) => `<li>${escapeHtml(guardrail)}</li>`).join("")}</ul>
            </article>
            <article class="panel" style="margin-top: 1rem;">
              <span class="label">Limitations</span>
              <ul class="plain-list">${release.limitations.map((limitation) => `<li>${escapeHtml(limitation)}</li>`).join("")}</ul>
            </article>
          </div>
        </div>
      </section>
      <section class="section" aria-labelledby="${release.slug}-sources">
        <div class="shell split-grid">
          <div><span class="section-kicker">Public provenance</span><h2 id="${release.slug}-sources">Follow the evidence.</h2><p>These public sources support the entry. No private customer material or internal evidence was used.</p></div>
          <div>${sourceList(release)}</div>
        </div>
      </section>
    </article>`;

  return page({
    title: `${release.title} | Solution journal`,
    description: release.summary,
    canonical,
    type: "article",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "CreativeWork",
      headline: release.title,
      description: release.summary,
      datePublished: release.published,
      dateModified: release.updated,
      author: { "@type": "Person", name: "Bill Whalen", url: SITE_URL },
      url: canonical,
      isBasedOn: evidenceUrls(release),
      dateCreated: release.publicActivity.repositoryCreated
    },
    body
  });
}

function infoOnlyPage(release) {
  const canonical = `${SITE_URL}/journal/${release.slug}/`;
  const body = `    <article>
      <header class="hero shell">
        <div>
          <p class="eyebrow">Info-only active work &middot; ${escapeHtml(release.category)}</p>
          <h1>${escapeHtml(release.title)}</h1>
          <p class="hero-copy">${escapeHtml(release.summary)}</p>
          <div class="meta-row">
            <span>Information-only</span>
            <span>Private active build</span>
            <span>Owner-reviewed as of ${release.ownerReviewedAsOf}</span>
            <span>Not a code, adoption, or activity signal</span>
          </div>
          <div class="hero-actions">
            <a class="button button-primary" href="/journal/#infoLane">Browse info-only work</a>
          </div>
        </div>
        <aside class="evidence-card">
          <span class="label">Public boundary</span>
          <strong>${escapeHtml(release.publicBoundary)}</strong>
          <p>No source, download, repository, operational-data, or private architecture links are provided for this showcase.</p>
        </aside>
      </header>
      <section class="section" aria-labelledby="${release.slug}-flow">
        <div class="shell">
          <div class="section-heading">
            <div><span class="section-kicker">Original state to designed value</span><h2 id="${release.slug}-flow">What the private build is exploring.</h2></div>
            <p>Customer-neutral framing only. This description does not establish deployment, adoption, or results.</p>
          </div>
          <div class="flow-grid">
            <article class="panel"><span class="label">01 / Original state</span><h3>Before the pattern</h3><p>${escapeHtml(release.originalState)}</p></article>
            <article class="panel"><span class="label">02 / Being built</span><h3>What is being delivered</h3><p>${escapeHtml(release.delivered)}</p></article>
            <article class="panel"><span class="label">03 / Designed value</span><h3>Value hypothesis</h3><p>${escapeHtml(release.outcome)}</p></article>
          </div>
          <div class="callout"><p><strong>Evidence label:</strong> ${escapeHtml(release.valueEvidence.statement)}</p></div>
        </div>
      </section>
      <section class="section" aria-labelledby="${release.slug}-architecture">
        <div class="shell">
          <div class="section-heading">
            <div><span class="section-kicker">Synthetic overview</span><h2 id="${release.slug}-architecture">A high-level public-safe pattern.</h2></div>
            <p>${escapeHtml(release.visual.alt)}</p>
          </div>
          ${architectureSvg(release, `info-${release.slug}`)}
          ${architectureNotes(release)}
        </div>
      </section>
      <section class="section" aria-labelledby="${release.slug}-controls">
        <div class="shell detail-grid">
          <div>
            <span class="section-kicker">Capabilities</span>
            <h2 id="${release.slug}-controls">What the concept is designed to support.</h2>
            <ul class="plain-list">${release.capabilities.map((capability) => `<li>${escapeHtml(capability)}</li>`).join("")}</ul>
          </div>
          <div>
            <article class="panel">
              <span class="label">Human control and guardrails</span>
              <ul class="plain-list">${release.guardrails.map((guardrail) => `<li>${escapeHtml(guardrail)}</li>`).join("")}</ul>
            </article>
            <article class="panel" style="margin-top: 1rem;">
              <span class="label">Limitations and disclosure</span>
              <ul class="plain-list">${release.limitations.map((limitation) => `<li>${escapeHtml(limitation)}</li>`).join("")}</ul>
            </article>
          </div>
        </div>
      </section>
    </article>`;

  return page({
    title: `${release.title} | Info-only active work`,
    description: release.summary,
    canonical,
    type: "article",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "CreativeWork",
      headline: release.title,
      description: release.summary,
      dateModified: release.ownerReviewedAsOf,
      author: { "@type": "Person", name: "Bill Whalen", url: SITE_URL },
      url: canonical,
      usageInfo: release.publicBoundary
    },
    body
  });
}

function articlePage(release) {
  const canonical = `${SITE_URL}/blog/${release.article.slug}/`;
  const body = `    <article>
      <header class="hero shell">
        <div>
          <p class="eyebrow">Field note &middot; ${escapeHtml(release.category)}</p>
          <h1>${escapeHtml(release.article.title)}</h1>
          <p class="hero-copy">${escapeHtml(release.article.dek)}</p>
          <div class="meta-row"><span>Bill Whalen</span><span>${release.published}</span><span>Last public push ${release.publicActivity.lastPublicPush}</span><span>${evidenceLabel(release.valueEvidence.level)}</span></div>
          <div class="hero-actions">
            <a class="button button-primary" href="/journal/${release.slug}/">Open solution entry</a>
            <a class="button" href="${escapeHtml(release.sourceUrls[0])}" rel="noreferrer">View public source</a>
${(release.publicLinks || []).map((link) => `<a class="button" href="${escapeHtml(link.url)}" rel="noreferrer">${escapeHtml(link.label)}</a>`).join("\n")}
          </div>
        </div>
        <aside class="evidence-card">
          <span class="label">Public-safe note</span>
          <strong>Pattern, not customer story.</strong>
          <p>This article describes a public project and a reusable workflow pattern. It does not report customer adoption or private business results.</p>
        </aside>
      </header>
      <section class="section">
        <div class="shell article-body">
          <p>${escapeHtml(release.summary)}</p>
          <h2>The workflow before the build</h2>
          <p>${escapeHtml(release.originalState)}</p>
          <h2>What the public project delivers</h2>
          <p>${escapeHtml(release.delivered)}</p>
          <ul class="plain-list">${release.capabilities.map((capability) => `<li>${escapeHtml(capability)}</li>`).join("")}</ul>
          <h2>The value case, stated honestly</h2>
          <p>${escapeHtml(release.outcome)}</p>
          <div class="callout"><p><strong>Evidence label:</strong> ${escapeHtml(release.valueEvidence.statement)}</p></div>
          <h2>Architecture in one view</h2>
          <p>${escapeHtml(release.visual.alt)}</p>
          ${architectureSvg(release, `article-${release.slug}`)}
          ${architectureNotes(release)}
          <h2>Human control and guardrails</h2>
          <ul class="plain-list">${release.guardrails.map((guardrail) => `<li>${escapeHtml(guardrail)}</li>`).join("")}</ul>
          <h2>Where the pattern stops</h2>
          <ul class="plain-list">${release.limitations.map((limitation) => `<li>${escapeHtml(limitation)}</li>`).join("")}</ul>
          <h2>Explore the public proof</h2>
          ${sourceList(release)}
        </div>
      </section>
    </article>`;

  return page({
    title: `${release.article.title} | Bill Whalen`,
    description: release.article.dek,
    canonical,
    type: "article",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: release.article.title,
      description: release.article.dek,
      datePublished: release.published,
      dateModified: release.updated,
      author: { "@type": "Person", name: "Bill Whalen", url: SITE_URL },
      mainEntityOfPage: canonical,
      isBasedOn: evidenceUrls(release),
      dateCreated: release.publicActivity.repositoryCreated
    },
    body
  });
}

function subscribePage(catalog) {
  const releaseCount = orderedReleases(catalog).length;
  const body = `    <section class="hero shell" aria-labelledby="subscribe-title">
      <div>
        <p class="eyebrow">Follow the public journal</p>
        <h1 id="subscribe-title">Subscribe without a subscriber list.</h1>
        <p class="hero-copy">RSS and Atom carry all ${releaseCount} approved public releases. Info-only active work is deliberately excluded. Add either feed URL to the reader you already use; this site does not collect email addresses.</p>
        <div class="hero-actions">
          <a class="button button-primary" href="/feeds/rss.xml">Open RSS 2.0</a>
          <a class="button" href="/feeds/atom.xml">Open Atom</a>
        </div>
      </div>
      <aside class="evidence-card">
        <span class="label">What is live</span>
        <strong>RSS 2.0 and Atom for ${releaseCount} public releases.</strong>
        <p>No email newsletter, signup form, tracking pixel, or subscriber database is connected.</p>
      </aside>
    </section>
    <section class="section" aria-labelledby="feed-help">
      <div class="shell split-grid">
        <article class="panel">
          <span class="label">RSS 2.0</span>
          <h2 id="feed-help">Use the feed your reader expects.</h2>
          <p>Copy <code>${SITE_URL}/feeds/rss.xml</code> into an RSS reader. New approved companion articles appear there.</p>
          <a class="button button-small" href="/feeds/rss.xml">View RSS</a>
        </article>
        <article class="panel">
          <span class="label">Atom</span>
          <h2>Same releases, Atom format.</h2>
          <p>Copy <code>${SITE_URL}/feeds/atom.xml</code> into an Atom-compatible reader. It is generated from the same approved release records.</p>
          <a class="button button-small" href="/feeds/atom.xml">View Atom</a>
        </article>
      </div>
      <div class="shell callout">
        <p><strong>Info-only work is not syndicated.</strong> Those showcases describe private active builds without source or operational materials and do not appear in RSS or Atom.</p>
      </div>
      <div class="shell callout">
        <p><strong>Planned, not live:</strong> a future separately hosted MCP service may expose only approved public manifest records through read-only operations. GitHub Pages cannot host that service, and there is no MCP endpoint on this site today.</p>
      </div>
    </section>`;

  return page({
    title: "Subscribe to the solution journal | Bill Whalen",
    description: "Follow Bill Whalen's public solution journal through live RSS 2.0 or Atom feeds.",
    canonical: `${SITE_URL}/subscribe/`,
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: "Subscribe to Bill Whalen's solution journal",
      url: `${SITE_URL}/subscribe/`,
      description: "RSS and Atom subscription options for the public solution journal."
    },
    body
  });
}

function manifest(catalog) {
  const releases = orderedReleases(catalog);
  const infoOnly = orderedInfoOnly(catalog);
  return {
    version: 3,
    title: "Bill Whalen solution journal manifest",
    updated: catalog.updated,
    policy: {
      publicationModes: ["public-release", "info-only"],
      evidence: "Public releases cite public sources; info-only showcases publish descriptions only",
      valueLabels: ["measured", "observed", "designed"],
      activityLabel: "Last public push is a repository-history fact, not adoption evidence",
      infoOnlyLabel: "Owner-reviewed as-of is not a code, deployment, adoption, or activity signal",
      excludedSurfaces: ["private evidence", "customer-identifying content", "source for info-only work", "email subscriptions", "live MCP endpoint"]
    },
    recordCount: releases.length + infoOnly.length,
    releaseCount: releases.length,
    infoOnlyCount: infoOnly.length,
    releases: releases.map((release) => ({
      ...release,
      urls: {
        solution: `${SITE_URL}/journal/${release.slug}/`,
        article: `${SITE_URL}/blog/${release.article.slug}/`
      }
    })),
    infoOnly: infoOnly.map((release) => ({
      ...release,
      urls: {
        showcase: `${SITE_URL}/journal/${release.slug}/`
      }
    }))
  };
}

function rss(catalog) {
  const items = orderedReleases(catalog).filter((release) => release.article.feed).map((release) => {
    const url = `${SITE_URL}/blog/${release.article.slug}/`;
    const description = `${release.summary} ${release.valueEvidence.statement}`;
    return `    <item>
      <title>${escapeXml(release.article.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${new Date(`${release.published}T12:00:00Z`).toUTCString()}</pubDate>
      <description>${escapeXml(description)}</description>
      <category>${escapeXml(release.category)}</category>
    </item>`;
  }).join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Bill Whalen solution journal</title>
    <link>${SITE_URL}/journal/</link>
    <description>Customer-neutral public solution entries and illustrated build notes.</description>
    <language>en-us</language>
    <lastBuildDate>${new Date(`${catalog.updated}T12:00:00Z`).toUTCString()}</lastBuildDate>
    <atom:link href="${SITE_URL}/feeds/rss.xml" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>
`;
}

function atom(catalog) {
  const entries = orderedReleases(catalog).filter((release) => release.article.feed).map((release) => {
    const url = `${SITE_URL}/blog/${release.article.slug}/`;
    return `  <entry>
    <title>${escapeXml(release.article.title)}</title>
    <id>${url}</id>
    <link href="${url}"/>
    <published>${release.published}T12:00:00Z</published>
    <updated>${release.updated}T12:00:00Z</updated>
    <summary>${escapeXml(release.summary)}</summary>
    <category term="${escapeXml(release.category)}"/>
    <author><name>Bill Whalen</name></author>
  </entry>`;
  }).join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>Bill Whalen solution journal</title>
  <id>${SITE_URL}/journal/</id>
  <link href="${SITE_URL}/journal/"/>
  <link href="${SITE_URL}/feeds/atom.xml" rel="self"/>
  <updated>${catalog.updated}T12:00:00Z</updated>
  <author><name>Bill Whalen</name></author>
${entries}
</feed>
`;
}

export function sitemapEntries(catalog) {
  const releases = orderedReleases(catalog);
  const infoOnly = orderedInfoOnly(catalog);
  return [
    { url: `${SITE_URL}/`, updated: catalog.updated, priority: "1.0" },
    { url: `${SITE_URL}/journal/`, updated: catalog.updated, priority: "0.9" },
    { url: `${SITE_URL}/subscribe/`, updated: catalog.updated, priority: "0.5" },
    ...releases.flatMap((release) => [
      { url: `${SITE_URL}/journal/${release.slug}/`, updated: release.updated, priority: "0.8" },
      { url: `${SITE_URL}/blog/${release.article.slug}/`, updated: release.updated, priority: "0.7" }
    ]),
    ...infoOnly.map((release) => ({
      url: `${SITE_URL}/journal/${release.slug}/`,
      updated: release.ownerReviewedAsOf,
      priority: "0.6"
    }))
  ];
}

function sitemap(catalog) {
  const urls = sitemapEntries(catalog).map((entry) => `  <url>
    <loc>${entry.url}</loc>
    <lastmod>${entry.updated}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>${entry.priority}</priority>
  </url>`).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
}

export async function loadCatalog() {
  return JSON.parse(await readFile(resolve(ROOT, "content", "releases.json"), "utf8"));
}

export async function buildOutputs() {
  const catalog = await loadCatalog();
  const outputs = new Map([
    ["journal/index.html", journalIndex(catalog)],
    ["subscribe/index.html", subscribePage(catalog)],
    ["feeds/rss.xml", rss(catalog)],
    ["feeds/atom.xml", atom(catalog)],
    ["releases.json", `${JSON.stringify(manifest(catalog), null, 2)}\n`],
    ["sitemap.xml", sitemap(catalog)]
  ]);

  for (const release of orderedReleases(catalog)) {
    outputs.set(`journal/${release.slug}/index.html`, solutionPage(release));
    outputs.set(`blog/${release.article.slug}/index.html`, articlePage(release));
  }
  for (const release of orderedInfoOnly(catalog)) {
    outputs.set(`journal/${release.slug}/index.html`, infoOnlyPage(release));
  }

  return { catalog, outputs };
}
