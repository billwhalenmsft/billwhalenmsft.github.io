import { execFileSync } from "node:child_process";
import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import {
  buildOutputs,
  ROOT,
  SITE_URL,
  sitemapEntries
} from "./site.mjs";

const errors = [];
const checks = [];

function check(condition, message) {
  if (!condition) errors.push(message);
}

function pass(message) {
  checks.push(message);
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function requireStrings(values, field, slug) {
  check(Array.isArray(values) && values.length > 0, `${slug}: ${field} must be a non-empty array.`);
  if (Array.isArray(values)) {
    values.forEach((value, index) => check(
      isNonEmptyString(value),
      `${slug}: ${field}[${index}] must be a non-empty string.`
    ));
  }
}

function dateIsValid(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value)
    && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
}

function pathForHref(href) {
  if (href === "/") return "index.html";
  const withoutQuery = href.split("?")[0].split("#")[0];
  const clean = withoutQuery.replace(/^\/+/, "");
  if (!clean) return "index.html";
  return clean.endsWith("/") ? `${clean}index.html` : clean;
}

function idsIn(html) {
  return [...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);
}

function validateHtml(relativePath, html) {
  check(/^<!DOCTYPE html>/i.test(html), `${relativePath}: missing HTML5 doctype.`);
  check(/<html\b[^>]*\blang="en"/i.test(html), `${relativePath}: missing lang="en".`);
  check((html.match(/<head\b/gi) || []).length === 1, `${relativePath}: expected one head element.`);
  check((html.match(/<body\b/gi) || []).length === 1, `${relativePath}: expected one body element.`);
  check((html.match(/<main\b/gi) || []).length === 1, `${relativePath}: expected one main landmark.`);
  check((html.match(/<h1\b/gi) || []).length === 1, `${relativePath}: expected one h1.`);
  check(/class="skip-link"[^>]*href="#main"/i.test(html), `${relativePath}: missing skip link to main.`);
  check(html.includes('new URLSearchParams(window.location.search).get("scoutTheme")'), `${relativePath}: missing required theme detection.`);
  check(html.includes("--cp-bg: #f7f4ef;"), `${relativePath}: missing canonical Clawpilot variables.`);
  check(/rel="alternate"[^>]+application\/rss\+xml/i.test(html), `${relativePath}: missing RSS discoverability link.`);
  check(/rel="alternate"[^>]+application\/atom\+xml/i.test(html), `${relativePath}: missing Atom discoverability link.`);

  const ids = idsIn(html);
  check(ids.length === new Set(ids).size, `${relativePath}: duplicate id attributes.`);

  for (const match of html.matchAll(/<img\b[^>]*>/gi)) {
    check(/\balt="[^"]*"/i.test(match[0]), `${relativePath}: image without alt text.`);
  }
  for (const match of html.matchAll(/<button\b[^>]*>/gi)) {
    check(/\btype="button"/i.test(match[0]), `${relativePath}: button without type="button".`);
  }
  for (const match of html.matchAll(/<svg\b[^>]*>/gi)) {
    const tag = match[0];
    check(
      /\baria-hidden="true"/i.test(tag) || /\brole="img"/i.test(tag),
      `${relativePath}: SVG must be decorative or have an image role.`
    );
  }

  for (const match of html.matchAll(/<script type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/gi)) {
    try {
      JSON.parse(match[1]);
    } catch (error) {
      errors.push(`${relativePath}: invalid JSON-LD (${error.message}).`);
    }
  }

  const styleBlocks = [...html.matchAll(/<style>([\s\S]*?)<\/style>/gi)].map((match) => match[1]);
  for (const block of styleBlocks) {
    const lines = block.split(/\r?\n/);
    lines.forEach((line, index) => {
      const colorToken = /#[0-9a-f]{3,8}\b|rgba?\(|hsla?\(/i.test(line);
      const variableDeclaration = /--cp-[\w-]+\s*:/.test(line);
      check(
        !colorToken || variableDeclaration,
        `${relativePath}: hardcoded component color in style block line ${index + 1}.`
      );
    });
  }
}

async function readJson(path) {
  return JSON.parse(await readFile(resolve(ROOT, path), "utf8"));
}

const { catalog, outputs } = await buildOutputs();
const allowlist = await readJson("config/public-source-allowlist.json");
const denyConfig = await readJson("config/public-safety-deny-patterns.json");
const protectedConfig = await readJson("config/protected-routes.json");
const allowlistedRepositories = new Set(allowlist.repositories);
const allowedEvidence = new Set(["measured", "observed", "designed"]);

check(catalog.version === 1, "Catalog version must be 1.");
check(dateIsValid(catalog.updated), "Catalog updated date must use YYYY-MM-DD.");
check(Array.isArray(catalog.releases) && catalog.releases.length >= 6, "Catalog must contain at least six releases.");

const releaseSlugs = new Set();
const articleSlugs = new Set();
for (const release of catalog.releases) {
  const slug = release.slug || "(missing slug)";
  check(/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug), `${slug}: slug must be stable kebab-case.`);
  check(!releaseSlugs.has(slug), `${slug}: duplicate release slug.`);
  releaseSlugs.add(slug);

  for (const field of [
    "title",
    "summary",
    "category",
    "maturity",
    "originalState",
    "delivered",
    "outcome"
  ]) {
    check(isNonEmptyString(release[field]), `${slug}: ${field} is required.`);
  }

  check(release.status === "approved", `${slug}: only approved releases may be generated.`);
  check(dateIsValid(release.published), `${slug}: published must use YYYY-MM-DD.`);
  check(dateIsValid(release.updated), `${slug}: updated must use YYYY-MM-DD.`);
  check(release.updated >= release.published, `${slug}: updated cannot precede published.`);
  requireStrings(release.tags, "tags", slug);
  requireStrings(release.capabilities, "capabilities", slug);
  requireStrings(release.guardrails, "guardrails", slug);
  requireStrings(release.limitations, "limitations", slug);
  requireStrings(release.sourceUrls, "sourceUrls", slug);

  check(
    release.valueEvidence && allowedEvidence.has(release.valueEvidence.level),
    `${slug}: valueEvidence.level must be measured, observed, or designed.`
  );
  check(
    release.valueEvidence && isNonEmptyString(release.valueEvidence.statement),
    `${slug}: valueEvidence.statement is required.`
  );
  if (release.valueEvidence?.level === "designed") {
    check(
      /\bdesigned value\b|\bvalue hypothesis\b/i.test(release.valueEvidence.statement),
      `${slug}: designed value wording must be explicit.`
    );
  }

  check(Array.isArray(release.architecture) && release.architecture.length >= 3, `${slug}: architecture requires at least three steps.`);
  release.architecture?.forEach((step, index) => {
    check(isNonEmptyString(step.label), `${slug}: architecture[${index}].label is required.`);
    check(isNonEmptyString(step.detail), `${slug}: architecture[${index}].detail is required.`);
  });

  check(Array.isArray(release.provenance) && release.provenance.length > 0, `${slug}: provenance is required.`);
  release.provenance?.forEach((source, index) => {
    check(isNonEmptyString(source.label), `${slug}: provenance[${index}].label is required.`);
    check(isNonEmptyString(source.url), `${slug}: provenance[${index}].url is required.`);
    check(isNonEmptyString(source.note), `${slug}: provenance[${index}].note is required.`);
    check(
      allowlist.repositories.some((repository) => source.url === repository || source.url.startsWith(`${repository}/`)),
      `${slug}: provenance URL is outside the exact-project source allowlist: ${source.url}`
    );
  });

  release.sourceUrls?.forEach((url) => check(
    allowlistedRepositories.has(url),
    `${slug}: source URL is not an exact allowlisted repository: ${url}`
  ));

  check(release.visual?.type === "inline-svg", `${slug}: visual.type must be inline-svg.`);
  check(isNonEmptyString(release.visual?.alt), `${slug}: visual.alt is required.`);
  check(
    Array.isArray(release.visual?.nodes) && release.visual.nodes.length === 4,
    `${slug}: visual.nodes must contain exactly four public-safe nodes.`
  );
  requireStrings(release.visual?.nodes, "visual.nodes", slug);

  check(isNonEmptyString(release.article?.slug), `${slug}: article.slug is required.`);
  check(!articleSlugs.has(release.article?.slug), `${slug}: duplicate article slug.`);
  articleSlugs.add(release.article?.slug);
  check(isNonEmptyString(release.article?.title), `${slug}: article.title is required.`);
  check(isNonEmptyString(release.article?.dek), `${slug}: article.dek is required.`);
  check(release.article?.feed === true, `${slug}: approved V1 companion article must be included in feeds.`);
}
pass("Catalog schema, approvals, evidence labels, and exact public source allowlist checked.");

const publicText = [
  JSON.stringify(catalog),
  ...[...outputs.entries()].map(([path, content]) => `${path}\n${content}`)
].join("\n");
for (const pattern of denyConfig.patterns) {
  const regex = new RegExp(pattern.regex, pattern.flags);
  check(!regex.test(publicText), `Public-safety deny pattern matched: ${pattern.name}.`);
}
check(!/\b(?:saved|reduced|increased|improved)\s+\d+(?:\.\d+)?%/i.test(publicText), "Unsupported percentage result claim detected.");
check(!/\bROI\b\s*(?:of|:|=)?\s*\d/i.test(publicText), "Unsupported numeric ROI claim detected.");
pass("PII, customer/internal markers, secret-like content, protected route, and unsupported result patterns checked.");

for (const route of protectedConfig.routes) {
  const actualHash = execFileSync("git", ["hash-object", route.path], {
    cwd: ROOT,
    encoding: "utf8"
  }).trim();
  check(actualHash === route.gitBlob, `${route.path}: protected route Git blob changed.`);
}
pass("Protected engagement hashes checked byte-for-byte.");

const diskHtml = new Map();
for (const [relativePath, expected] of outputs) {
  const absolutePath = resolve(ROOT, relativePath);
  let actual = null;
  try {
    actual = await readFile(absolutePath, "utf8");
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  check(actual === expected, `${relativePath}: generated output is stale or missing.`);
  if (relativePath.endsWith(".html")) {
    validateHtml(relativePath, expected);
    diskHtml.set(relativePath, expected);
  }
}

for (const relativePath of ["index.html", "404.html"]) {
  const html = await readFile(resolve(ROOT, relativePath), "utf8");
  diskHtml.set(relativePath, html);
}

const home = diskHtml.get("index.html");
check((home.match(/class="project-card"/g) || []).length === 9, "Homepage must retain all nine accepted project cards.");
check(home.includes('id="hero-title">I build AI <span>people use.</span></h1>'), "Homepage accepted hero changed.");
check(home.includes('id="projectSearch"'), "Homepage project search is missing.");
check(home.includes('id="commandDialog"'), "Homepage keyboard quick launcher is missing.");
check(home.includes("event.ctrlKey || event.metaKey"), "Homepage Ctrl/Cmd+K interaction is missing.");
check(home.includes('href="/journal/"'), "Homepage must link to the live solution journal.");
check(home.includes('application/rss+xml'), "Homepage must advertise the RSS feed.");
check(home.includes('application/atom+xml'), "Homepage must advertise the Atom feed.");
pass("Accepted homepage hero, nine cards, search/filter, theme, and keyboard surfaces checked.");

for (const [relativePath, html] of diskHtml) {
  const pageIds = new Set(idsIn(html));
  for (const match of html.matchAll(/href="([^"]+)"/g)) {
    const href = match[1];
    if (
      href.startsWith("http://")
      || href.startsWith("https://")
      || href.startsWith("mailto:")
      || href.startsWith("data:")
    ) continue;

    if (href.startsWith("#")) {
      check(pageIds.has(href.slice(1)), `${relativePath}: missing local fragment target ${href}.`);
      continue;
    }

    const [pathPart, fragment] = href.split("#");
    const targetPath = pathForHref(pathPart);
    try {
      await access(resolve(ROOT, targetPath));
    } catch {
      errors.push(`${relativePath}: missing internal link target ${href}.`);
      continue;
    }
    if (fragment && targetPath.endsWith(".html")) {
      const targetHtml = diskHtml.get(targetPath) || await readFile(resolve(ROOT, targetPath), "utf8");
      check(idsIn(targetHtml).includes(fragment), `${relativePath}: missing target fragment ${href}.`);
    }
  }
}
pass("Internal paths, navigation links, and fragments checked.");

const rssXml = outputs.get("feeds/rss.xml");
const atomXml = outputs.get("feeds/atom.xml");
check(/^<\?xml version="1.0" encoding="UTF-8"\?>/.test(rssXml), "RSS must declare UTF-8 XML.");
check(/<rss version="2.0"/.test(rssXml), "RSS 2.0 root is missing.");
check((rssXml.match(/<item>/g) || []).length === catalog.releases.length, "RSS item count must match feed releases.");
check(/^<\?xml version="1.0" encoding="UTF-8"\?>/.test(atomXml), "Atom must declare UTF-8 XML.");
check(/<feed xmlns="http:\/\/www.w3.org\/2005\/Atom">/.test(atomXml), "Atom root is missing.");
check((atomXml.match(/<entry>/g) || []).length === catalog.releases.length, "Atom entry count must match feed releases.");

const sitemapXml = outputs.get("sitemap.xml");
const sitemapUrls = [...sitemapXml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
const expectedSitemapUrls = sitemapEntries(catalog).map((entry) => entry.url);
check(
  JSON.stringify(sitemapUrls) === JSON.stringify(expectedSitemapUrls),
  "Sitemap URLs must exactly match generated public routes."
);
check(!sitemapXml.includes("engagements/"), "Protected engagements must not appear in the sitemap.");
check(outputs.get("releases.json").endsWith("\n"), "Public release manifest must end with a newline.");
pass("RSS, Atom, public manifest, and exact sitemap coverage checked.");

if (errors.length > 0) {
  console.error(`Validation failed with ${errors.length} issue${errors.length === 1 ? "" : "s"}:`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exitCode = 1;
} else {
  checks.forEach((message) => console.log(`PASS: ${message}`));
  console.log(`Validated ${catalog.releases.length} releases and ${outputs.size} generated files.`);
}
