import { execFileSync } from "node:child_process";
import { access, readFile, readdir } from "node:fs/promises";
import { resolve } from "node:path";
import {
  buildOutputs,
  orderedInfoOnly,
  orderedReleases,
  ROOT,
  SITE_URL,
  sitemapEntries
} from "./site.mjs";

const errors = [];
const checks = [];
const chromeSource = await readFile(resolve(ROOT, "assets/site-chrome.js"), "utf8");

function offersSharedTheme(html) {
  return html.includes('<script src="/assets/site-theme.js"></script>')
    && html.includes('<script src="/assets/site-chrome.js"></script>')
    && ["Light", "Dark", "Auto"].every((theme) => chromeSource.includes(`>${theme}</option>`));
}

function validateSharedChrome(relativePath, html) {
  check((html.match(/<header data-site-header><\/header>/g) || []).length === 1,
    `${relativePath}: expected one empty shared header placeholder.`);
  check((html.match(/<footer data-site-footer><\/footer>/g) || []).length === 1,
    `${relativePath}: expected one empty shared footer placeholder.`);
  check(!/<nav\b/i.test(html), `${relativePath}: page must not define its own navigation markup.`);
  check(!/id="(?:themeSelect|themeButton|mobileMenu)"/.test(html),
    `${relativePath}: page must not define its own header controls.`);
  check(offersSharedTheme(html), `${relativePath}: missing shared Light/Dark/Auto control.`);
  for (const asset of ["site-theme.js", "site-chrome.js", "site-chrome.css"]) {
    check(html.split(`/assets/${asset}`).length === 2, `${relativePath}: expected one reference to ${asset}.`);
  }
  check(html.indexOf('src="/assets/site-theme.js"') < html.indexOf("</head>"),
    `${relativePath}: theme must initialize before first paint.`);
  check(!/<script[^>]*\b(?:async|defer)[^>]*src="\/assets\/site-theme.js"/.test(html),
    `${relativePath}: theme initialization must not be deferred.`);
  check(!/(?:dataset\.theme\s*=|setAttribute\(["']data-theme)/.test(html),
    `${relativePath}: page must not override shared theme behavior.`);
}

async function validateAllPageChrome(directory = "") {
  for (const entry of await readdir(resolve(ROOT, directory), { withFileTypes: true })) {
    if (entry.name.startsWith(".") || entry.name === "node_modules") continue;
    const path = directory ? `${directory}/${entry.name}` : entry.name;
    if (entry.isDirectory()) await validateAllPageChrome(path);
    else if (entry.name.endsWith(".html")) {
      const html = await readFile(resolve(ROOT, path), "utf8");
      if (/<!doctype html>/i.test(html)) validateSharedChrome(path, html);
    }
  }
}

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
  check(offersSharedTheme(html), `${relativePath}: missing required shared theme detection.`);
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

async function generatedPageDirectories(parent) {
  const result = [];
  const entries = await readdir(resolve(ROOT, parent), { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    try {
      await access(resolve(ROOT, parent, entry.name, "index.html"));
      result.push(entry.name);
    } catch {
      // Empty directories are not deployed Git content.
    }
  }
  return result.sort();
}

const { catalog, outputs } = await buildOutputs();
const allowlist = await readJson("config/public-source-allowlist.json");
const denyConfig = await readJson("config/public-safety-deny-patterns.json");
const protectedConfig = await readJson("config/protected-routes.json");
const allowlistedRepositories = new Set(allowlist.repositories);
const allowedEvidence = new Set(["measured", "observed", "designed"]);

check(catalog.version === 6, "Catalog version must be 6.");
check(dateIsValid(catalog.updated), "Catalog updated date must use YYYY-MM-DD.");
check(catalog.expectedPublicReleaseCount === 10, "Catalog must expect exactly 10 public releases.");
check(catalog.expectedInfoOnlyCount === 11, "Catalog must expect exactly 11 info-only showcases.");
check(Array.isArray(catalog.releases), "Catalog records must be an array.");

const releaseSlugs = new Set();
const articleSlugs = new Set();
const releaseRepositories = new Set();
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
  check(
    ["public-release", "info-only"].includes(release.publicationMode),
    `${slug}: publicationMode must be public-release or info-only.`
  );
  check(typeof release.featuredOnHome === "boolean", `${slug}: featuredOnHome must be explicit.`);
  if (release.featuredOnHome) {
    check(
      Number.isInteger(release.homepageRank) && release.homepageRank >= 1 && release.homepageRank <= 11,
      `${slug}: featured records require homepageRank from 1 through 11.`
    );
  } else {
    check(!Object.hasOwn(release, "homepageRank"), `${slug}: non-featured records must not have homepageRank.`);
  }
  requireStrings(release.tags, "tags", slug);
  requireStrings(release.capabilities, "capabilities", slug);
  requireStrings(release.guardrails, "guardrails", slug);
  requireStrings(release.limitations, "limitations", slug);

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

  check(release.visual?.type === "inline-svg", `${slug}: visual.type must be inline-svg.`);
  check(isNonEmptyString(release.visual?.alt), `${slug}: visual.alt is required.`);
  check(
    Array.isArray(release.visual?.nodes) && release.visual.nodes.length === 4,
    `${slug}: visual.nodes must contain exactly four public-safe nodes.`
  );
  requireStrings(release.visual?.nodes, "visual.nodes", slug);

  if (release.publicationMode === "public-release") {
    check(dateIsValid(release.published), `${slug}: published must use YYYY-MM-DD.`);
    check(dateIsValid(release.updated), `${slug}: updated must use YYYY-MM-DD.`);
    check(release.updated >= release.published, `${slug}: updated cannot precede published.`);
    requireStrings(release.sourceUrls, "sourceUrls", slug);
    check(release.sourceUrls.length === 1, `${slug}: public release requires one exact canonical repository URL.`);
    check(!releaseRepositories.has(release.sourceUrls[0]), `${slug}: duplicate canonical repository source URL.`);
    releaseRepositories.add(release.sourceUrls[0]);
    check(dateIsValid(release.publicActivity?.repositoryCreated), `${slug}: publicActivity.repositoryCreated must use YYYY-MM-DD.`);
    check(dateIsValid(release.publicActivity?.lastPublicPush), `${slug}: publicActivity.lastPublicPush must use YYYY-MM-DD.`);
    check(
      release.publicActivity?.lastPublicPush >= release.publicActivity?.repositoryCreated,
      `${slug}: last public push cannot precede repository creation.`
    );
    const expectedApiSource = release.sourceUrls?.[0]?.replace(
      "https://github.com/",
      "https://api.github.com/repos/"
    );
    check(
      release.publicActivity?.source === expectedApiSource,
      `${slug}: public activity source must be the exact public GitHub repository API URL.`
    );

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
    release.publicLinks?.forEach((link, index) => {
      check(isNonEmptyString(link.label), `${slug}: publicLinks[${index}].label is required.`);
      check(/^https:\/\//.test(link.url), `${slug}: publicLinks[${index}].url must be public HTTPS.`);
      let publicLinkHost = "";
      try {
        publicLinkHost = new URL(link.url).hostname;
      } catch {
        // The URL format check reports the invalid value.
      }
      check(
        publicLinkHost === "billwhalenmsft.github.io",
        `${slug}: publicLinks[${index}].url must use the approved public Pages host.`
      );
      check(["demo", "documentation", "release"].includes(link.type), `${slug}: publicLinks[${index}].type is invalid.`);
    });
    release.attribution?.forEach((item, index) => {
      check(isNonEmptyString(item.name), `${slug}: attribution[${index}].name is required.`);
      check(/^https:\/\//.test(item.url), `${slug}: attribution[${index}].url must be public HTTPS.`);
      check(isNonEmptyString(item.relationship), `${slug}: attribution[${index}].relationship is required.`);
      check(isNonEmptyString(item.license), `${slug}: attribution[${index}].license is required.`);
    });

    check(isNonEmptyString(release.article?.slug), `${slug}: article.slug is required.`);
    check(!articleSlugs.has(release.article?.slug), `${slug}: duplicate article slug.`);
    articleSlugs.add(release.article?.slug);
    check(isNonEmptyString(release.article?.title), `${slug}: article.title is required.`);
    check(isNonEmptyString(release.article?.dek), `${slug}: article.dek is required.`);
    check(release.article?.feed === true, `${slug}: approved public-release article must be included in feeds.`);
  } else if (release.publicationMode === "info-only") {
    check(dateIsValid(release.ownerReviewedAsOf), `${slug}: ownerReviewedAsOf must use YYYY-MM-DD.`);
    check(release.valueEvidence?.level === "designed", `${slug}: info-only value evidence must be designed.`);
    const standardInfoOnlyBoundary =
      "Information-only. Source and operational materials are not published.";
    const portableNeuronBoundary =
      "Information-only. Source, package, and operational materials are not published pending rights and licensing clearance.";
    check(
      release.publicBoundary === (slug === "portable-neuron"
        ? portableNeuronBoundary
        : standardInfoOnlyBoundary),
      `${slug}: exact info-only public boundary disclosure is required.`
    );
    check(/Information-only/i.test(release.maturity), `${slug}: maturity must visibly say Information-only.`);
    const approvedMaturity = {
      "atomic-blueprint": "Information-only / Local discovery prototype",
      "sales-suite": "Information-only / Controlled evaluation"
    }[slug];
    check(
      approvedMaturity ? release.maturity === approvedMaturity : /Private active build/i.test(release.maturity),
      `${slug}: maturity must retain the exact approved prototype/evaluation label or Private active build.`
    );
    for (const forbiddenField of [
      "sourceUrls",
      "publicActivity",
      "publicLinks",
      "provenance",
      "attribution",
      "article",
      "published"
    ]) {
      check(
        !Object.hasOwn(release, forbiddenField),
        `${slug}: info-only record must not contain ${forbiddenField}.`
      );
    }
    check(!/https?:\/\//i.test(JSON.stringify(release)), `${slug}: info-only record must not contain URLs.`);
    check(
      release.limitations.some((limitation) => /not a Microsoft product/i.test(limitation)),
      `${slug}: info-only limitations must state that the build is not a Microsoft product.`
    );
    if (slug === "portable-neuron") {
      check(
        !/\b(?:source code|binary|binaries|archive|dependency metadata|repository)\b/i.test(release.summary),
        `${slug}: homepage-safe summary must not imply publication of restricted package materials.`
      );
    }
    if (slug === "v-team-mesh-hivemind") {
      check(
        release.foundationNote === "RAPP and RAPP/1 are public projects published by Kody Wildfeuer. These foundations inform Bill's approach to persistent agent identity, traceable memory, and reusable work. V-Team Mesh + Hivemind is Bill's evolving working model, not an upstream RAPP or RAPP/1 feature or a proven integration.",
        `${slug}: verified plain-text foundation attribution is required verbatim.`
      );
      check(
        !/https?:\/\//i.test(release.foundationNote),
        `${slug}: info-only foundation attribution must not contain external links.`
      );
    }
  }
}
pass("Publication modes, approvals, evidence labels, and public-safe record schema checked.");

const ordered = orderedReleases(catalog);
const orderedInfo = orderedInfoOnly(catalog);
check(ordered.length === catalog.expectedPublicReleaseCount, "Catalog must contain exactly 10 public releases.");
check(orderedInfo.length === catalog.expectedInfoOnlyCount, "Catalog must contain exactly 11 info-only showcases.");
check(
  catalog.releases.length === catalog.expectedPublicReleaseCount + catalog.expectedInfoOnlyCount,
  "Catalog must contain exactly 21 total records."
);
check(
  allowlist.repositories.length === catalog.expectedPublicReleaseCount,
  "Source allowlist must contain exactly 10 public repositories."
);
check(
  JSON.stringify([...releaseRepositories].sort()) === JSON.stringify([...allowlistedRepositories].sort()),
  "Public releases and the exact-project source allowlist must match one-to-one."
);

for (let index = 1; index < ordered.length; index += 1) {
  check(
    ordered[index - 1].publicActivity.lastPublicPush >= ordered[index].publicActivity.lastPublicPush,
    "Journal release order must be newest last-public-push first."
  );
}
for (let index = 1; index < orderedInfo.length; index += 1) {
  check(
    orderedInfo[index - 1].ownerReviewedAsOf >= orderedInfo[index].ownerReviewedAsOf,
    "Info-only showcases must be ordered by owner-reviewed as-of date."
  );
}
pass("Exact repository creation and last-public-push facts and ordering checked.");

const featured = catalog.releases
  .filter((release) => release.featuredOnHome)
  .sort((left, right) => left.homepageRank - right.homepageRank);
check(featured.length === 11, "Homepage curation must contain exactly 11 featured records.");
check(
  JSON.stringify(featured.map((release) => release.homepageRank))
    === JSON.stringify([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]),
  "Homepage ranks must be unique and contiguous from 1 through 11."
);

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
await validateAllPageChrome();
let previousNavIndex = -1;
for (const href of ["/", "/#work", "/#capabilities", "/#resume", "/journal/", "/blog/", "/tools/", "/#connect"]) {
  const navIndex = chromeSource.indexOf(`["${href}",`);
  check(navIndex > previousNavIndex, `Shared header: missing or misordered navigation target ${href}.`);
  previousNavIndex = navIndex;
  const [path, fragment] = href.split("#");
  if (fragment) {
    check(idsIn(diskHtml.get("index.html")).includes(fragment), `Shared header: missing homepage anchor ${href}.`);
  } else {
    await access(resolve(ROOT, pathForHref(path)));
  }
}
for (const href of ["/journal/", "/blog/", "/tools/", "/subscribe/", "/feeds/rss.xml",
  "https://github.com/billwhalenmsft", "https://www.linkedin.com/in/williamjaywhalen/"]) {
  check(chromeSource.includes(`href="${href}"`), `Shared footer: missing link ${href}.`);
}
check(chromeSource.includes('aria-controls="site-navigation"') && chromeSource.includes('aria-expanded="false"'),
  "Shared header: mobile menu must expose its controlled navigation and expanded state.");
check(chromeSource.includes('aria-current", "page"'), "Shared header: active links must expose aria-current.");
check(chromeSource.includes("© 2026 Bill Whalen. Personal portfolio; views are my own. Community projects are provided as-is and are not Microsoft products or supported offerings."),
  "Shared footer: portfolio boundary line must be preserved.");
pass("Every deployed HTML page uses the shared header, footer, and theme assets without private nav markup.");

const home = diskHtml.get("index.html");
check((home.match(/class="project-card"/g) || []).length === 11, "Homepage must contain exactly eleven featured project cards.");
check(
  home.includes('<h2 id="work-title">Eleven projects, deliberately curated.</h2>'),
  "Homepage featured-work heading must agree with the eleven-card gallery."
);
check(
  home.includes('<span id="projectCount">11 featured items</span>'),
  "Homepage initial featured-work count must agree with the eleven-card gallery."
);
check(
  home.includes("Explore all 21 journal entries"),
  "Homepage full-journal CTA must agree with the twenty-one-record catalog."
);
check(
  home.includes('<a href="https://github.com/kody-w/rapp-1"'),
  "Homepage foundation attribution must link RAPP/1 to the verified public upstream."
);
check(
  home.includes("Some of my agent work builds on RAPP and"),
  "Homepage foundation attribution wording is missing."
);
check(home.includes('id="hero-title">I build AI <span>people use.</span></h1>'), "Homepage accepted hero changed.");
check(home.includes('id="projectSearch"'), "Homepage project search is missing.");
check(home.includes('id="commandDialog"'), "Homepage keyboard quick launcher is missing.");
check(home.includes("event.ctrlKey || event.metaKey"), "Homepage Ctrl/Cmd+K interaction is missing.");
check(home.includes('href="/journal/"'), "Homepage must link to the live solution journal.");
check(home.includes('href="/blog/"'), "Homepage navigation must link to the blog.");
check(home.includes(">Latest from the blog</a>"), "Homepage must link to the latest blog posts near the journal.");
check(home.includes('application/rss+xml'), "Homepage must advertise the RSS feed.");
check(home.includes('application/atom+xml'), "Homepage must advertise the Atom feed.");
const homepageFeaturedSlugs = [...home.matchAll(/data-featured-slug="([^"]+)"/g)].map((match) => match[1]);
check(
  JSON.stringify(homepageFeaturedSlugs) === JSON.stringify(featured.map((release) => release.slug)),
  "Homepage featured cards must match catalog homepageRank order."
);
const homepageFeaturedModes = [...home.matchAll(/data-featured-mode="([^"]+)"/g)].map((match) => match[1]);
check(
  JSON.stringify(homepageFeaturedModes) === JSON.stringify(featured.map((release) => release.publicationMode)),
  "Homepage featured card mode badges must match catalog publication modes."
);
pass("Homepage hero, ranked curation, publication modes, search/filter, theme, and keyboard surfaces checked.");

const journalHtml = outputs.get("journal/index.html");
const journalReleaseSlugs = [...journalHtml.matchAll(/data-release="([^"]+)"/g)].map((match) => match[1]);
check(
  JSON.stringify(journalReleaseSlugs)
    === JSON.stringify([...ordered, ...orderedInfo].map((release) => release.slug)),
  "Journal cards must keep public-release and info-only ordering separate."
);
check(journalHtml.includes('data-filter="public-release"'), "Journal requires a Public releases filter.");
check(journalHtml.includes('data-filter="info-only"'), "Journal requires an Info-only active work filter.");
check(
  outputs.get("subscribe/index.html").includes(`all ${catalog.expectedPublicReleaseCount} approved public releases`),
  "Subscription page must state the exact approved release count."
);

const journalDirectories = await generatedPageDirectories("journal");
const expectedJournalDirectories = [...ordered, ...orderedInfo].map((release) => release.slug).sort();
check(
  JSON.stringify(journalDirectories) === JSON.stringify(expectedJournalDirectories),
  "Journal directory set must exactly match approved public and info-only records."
);
const blogDirectories = await generatedPageDirectories("blog");
const expectedBlogDirectories = [...ordered.map((release) => release.article.slug), "software-factory-pattern", "tokenomics-planner", "copilot-studio-harnesses", "sales-agent-cowork-sales-suite"].sort();
check(
  JSON.stringify(blogDirectories) === JSON.stringify(expectedBlogDirectories),
  "Blog directory set must exactly match public-release companion articles and Builder's Log posts."
);
const blogHtml = outputs.get("blog/index.html");
for (const [relativePath, html] of diskHtml) {
  const isBlogPost = /^blog\/[^/]+\/index\.html$/.test(relativePath);
  const fullWidthHero = /\.hero\.shell \{ grid-template-columns: minmax\(0, 1fr\); \}/.test(html);
  const titleStyles = html.match(/\.hero\.shell h1 \{([^}]+)\}/)?.[1];
  check(fullWidthHero === isBlogPost, `${relativePath}: full-width hero layout must apply only to blog posts.`);
  check(Boolean(titleStyles) === isBlogPost, `${relativePath}: blog title styles must apply only to blog posts.`);
  if (isBlogPost) {
    check(/max-width: none;/.test(titleStyles), `${relativePath}: blog title must use the full hero width.`);
    check(/font-size: clamp\(2\.25rem, 4\.5vw, 4rem\);/.test(titleStyles), `${relativePath}: blog title must use responsive sizing.`);
    check(/line-height: 1\.08;/.test(titleStyles), `${relativePath}: blog title must use compact line spacing.`);
    check(/text-wrap: balance;/.test(titleStyles), `${relativePath}: blog title must balance wrapped lines.`);
    check(html.includes("grid-template-columns: minmax(0, 1fr) min(100%, 72ch) minmax(0, 1fr);"), `${relativePath}: blog body must use the shared 72ch reading column.`);
    check(offersSharedTheme(html), `${relativePath}: blog posts must offer Light, Dark and Auto.`);
  }
}
pass("Full-width responsive hero titles scoped to all blog posts checked.");
const blogLanes = [...blogHtml.matchAll(/class="release-card blog-card" data-lane="([^"]+)" data-date="([^"]+)"/g)];
check(blogLanes.length === ordered.length + 4, "Blog cards must include every public article, all three Builder's Log posts, and the Sales Extension Suite post.");
check(
  blogLanes.every((item, index) => index === 0 || blogLanes[index - 1][2] >= item[2]),
  "Blog cards must be ordered newest first."
);
check(blogHtml.includes("Accelerators &amp; Prototypes"), "Blog must provide the Accelerators &amp; Prototypes filter.");
check(blogHtml.includes("Builder's Log"), "Blog must provide the Builder's Log filter.");
check(blogHtml.includes("Accelerators, prototypes, and build notes. Personal projects; views are my own."), "Blog intro must match the requested line.");
const softwareFactoryHtml = outputs.get("blog/software-factory-pattern/index.html");
const harnessHtml = outputs.get("blog/copilot-studio-harnesses/index.html");
const salesSuiteHtml = outputs.get("blog/sales-agent-cowork-sales-suite/index.html");
check(harnessHtml.includes("<h1>The Microsoft Copilot harness (formerly GitHub Copilot): a plain-English guide to Copilot Studio harnesses</h1>"), "Harness article must use the exact headline.");
check(harnessHtml.indexOf("Naming update (Oct 28)") < harnessHtml.indexOf("The short version"), "Naming update must precede the short version.");
check((harnessHtml.match(/<div class="card">/g) || []).length === 3, "Harness article must retain all three harness cards.");
check(harnessHtml.includes('<div class="table-wrap" role="region" aria-label="Harness comparison" tabindex="0">'), "Harness comparison must be a keyboard-scrollable table.");
check(offersSharedTheme(harnessHtml), "Harness post must reuse the Light, Dark and Auto theme control.");
const readMoreLinks = [...harnessHtml.split("<h2>Read more</h2>")[1].matchAll(/<a href="([^"]+)"/g)];
check(readMoreLinks[0]?.[1] === "https://www.microsoft.com/en-us/copilot/blog/copilot-studio/the-github-copilot-harness-in-copilot-studio-is-now-the-microsoft-copilot-harness/", "Microsoft announcement must be first under Read more.");
check(salesSuiteHtml.includes("<h1>Sales agent, Dynamics 365 in Cowork, and the Sales Extension Suite: how the pieces fit</h1>"), "Sales Extension Suite article must use the exact headline.");
check(salesSuiteHtml.includes('<p class="eyebrow"><strong>Accelerators &amp; Prototypes</strong> · October 30, 2026</p>'), "Sales Extension Suite article must show its lane and date.");
check(salesSuiteHtml.includes('<a class="button button-primary" href="https://billwhalenmsft.github.io/copilot-sales-service-agent-extensions/" rel="noreferrer">Try the Sales Extension Suite examples →</a>'), "Sales Extension Suite article must link prominently to the examples.");
check(salesSuiteHtml.indexOf("Try the Sales Extension Suite examples") < salesSuiteHtml.indexOf('aria-label="Sales assistance layers"'), "The examples button must appear under the introduction.");
check((salesSuiteHtml.match(/class="table-wrap"/g) || []).length === 2, "Sales Extension Suite article must wrap both tables for horizontal scrolling.");
check((salesSuiteHtml.match(/role="region" aria-label="Sales assistance /g) || []).length === 2, "Sales Extension Suite table wrappers must be keyboard-scrollable regions.");
check(salesSuiteHtml.includes('<table class="article-table">') && salesSuiteHtml.includes("min-width: 38rem;"), "Sales Extension Suite tables must use the shared responsive table styles.");
check(salesSuiteHtml.includes('<div class="callout"><p><strong>Boundary:</strong> Personal project showcase. The Sales Extension Suite is an independent preview accelerator I built. It is not a Microsoft product or supported offering, and it makes no production, adoption or results claims. Examples are fictional. Licensing and availability vary; confirm with your Microsoft account team or partner. Views are my own.</p></div>'), "Sales Extension Suite article must render the standard boundary callout verbatim.");
check(offersSharedTheme(salesSuiteHtml), "Sales Extension Suite article must provide Light, Dark and Auto theme choices.");
const salesSuiteArticleBody = salesSuiteHtml.match(/<div class="shell article-body">([\s\S]*?)<\/section>/)?.[1] || "";
const salesSuiteLinks = [...salesSuiteArticleBody.matchAll(/<a\b[^>]*\bhref="([^"]+)"/g)].map((match) => match[1]);
check(
  JSON.stringify(salesSuiteLinks) === JSON.stringify([
    "https://billwhalenmsft.github.io/copilot-sales-service-agent-extensions/",
    "https://billwhalenmsft.github.io/copilot-sales-service-agent-extensions/",
    "https://billwhalenmsft.github.io/copilot-sales-service-agent-extensions/catalog.html",
    "https://learn.microsoft.com/en-us/microsoft-sales-copilot/set-up-sales-chat",
    "https://learn.microsoft.com/en-us/microsoft-sales-copilot/deploy-sales-app-d365",
    "https://learn.microsoft.com/en-us/dynamics365/sales/copilot-overview",
    "https://learn.microsoft.com/en-us/dynamics365/release-plan/2026wave1/sales/dynamics365-sales/use-dynamics-365-sales-skills-365-copilot-cowork",
    "https://www.microsoft.com/en-us/dynamics-365/blog/it-professional/2026/10/08/bring-microsoft-dynamics-365-into-the-flow-of-work-with-30-new-crm-skills/",
    "https://www.microsoft.com/en-us/copilot/blog/2026/10/08/bringing-crm-into-the-flow-of-work-and-agents-into-business-process-for-sales-and-service-teams/"
  ]),
  "Sales Extension Suite article must render each provided URL as a link."
);
const salesBlogCard = blogHtml.match(/<article class="release-card blog-card" data-lane="accelerators" data-date="2026-10-30">[\s\S]*?href="\/blog\/sales-agent-cowork-sales-suite\/"/)?.[0] || "";
check(salesBlogCard.includes('<span class="status">Accelerators &amp; Prototypes</span>'), "Sales Extension Suite blog card must appear in the accelerator lane.");
check(salesBlogCard.includes('<p class="eyebrow">Sales assistance</p>'), "Sales Extension Suite blog card must use the Sales assistance category.");
check(salesBlogCard.includes("What to turn on for sellers: the Sales agent in Microsoft 365 Copilot, Dynamics 365 Sales skills in Copilot Cowork, and an optional accelerator that makes briefs, follow-ups and handoffs consistent."), "Sales Extension Suite blog card summary is missing.");
check(softwareFactoryHtml.includes("Information-only / Private active build"), "Builder's Log post must show the information-only label.");
check(softwareFactoryHtml.includes("Owner-reviewed as of <time datetime=\"2026-10-24\">2026-10-24</time>"), "Builder's Log post must show its as-of date.");
check(blogHtml.includes("A private, issue-first pattern where every build request becomes a spec&#39;d GitHub issue, a coding agent opens a small pull request, and I review every one before merging."), "Builder's Log card summary is missing.");
const softwareFactoryArticleBody = softwareFactoryHtml.match(/<div class="shell article-body">([\s\S]*?)<\/section>/)?.[1] || "";
const softwareFactoryLinks = [...softwareFactoryArticleBody.matchAll(/<a href="([^"]+)"/g)]
  .map((match) => match[1])
  .filter((href) => href.startsWith("http"));
check(
  JSON.stringify(softwareFactoryLinks) === JSON.stringify([
    "https://docs.github.com/en/copilot/concepts/agent-capabilities/about-agents/about-github-copilot-agents",
    "https://learn.microsoft.com/en-us/microsoft-365/managed-apps/?view=o365-worldwide"
  ]),
  "Builder's Log post may link only the two referenced public products."
);
check(
  softwareFactoryArticleBody.includes("<strong>Public boundary: Information-only.</strong> Source and operational materials are not published. Personal project showcase. Built and demonstrated with fictional data. Not a Microsoft product or supported offering; views are my own."),
  "Builder's Log post must include the complete public boundary."
);
const tokenomicsPlannerHtml = outputs.get("blog/tokenomics-planner/index.html");
check(tokenomicsPlannerHtml.includes('href="/tools/tokenomics/">Try the live planner →</a>'), "Tokenomics post must link prominently to the live planner.");
const livePlannerHtml = outputs.get("tools/tokenomics/index.html");
check(livePlannerHtml.includes('src="/assets/site-chrome.js"') && chromeSource.includes('["/tools/", "Tools"]'), "Live planner must link to the tools directory.");
check(livePlannerHtml.includes("font-size: clamp(2rem, 4vw, 3.25rem);"), "Planner title must use the requested sizing.");
check(livePlannerHtml.includes('class="estimate-layout"'), "Planner must share an input/result layout.");
check(livePlannerHtml.includes("@media (min-width: 1024px)"), "Planner must start the desktop layout at 1024px.");
check(/#estimate-results \{ position: sticky;/.test(livePlannerHtml), "Desktop planner results must be sticky.");
const boundaryStyles = livePlannerHtml.match(/\.boundary \{([^}]+)\}/)?.[1] || "";
check(!/position:\s*(fixed|sticky|absolute)/.test(boundaryStyles), "Planner disclaimer must remain in normal flow.");
check(livePlannerHtml.includes(".band-likely { border-left: 6px solid"), "Likely marker must be thicker than the boundary ticks.");
check(livePlannerHtml.includes(".planner select option, .theme-select option { background: var(--cp-surface); color: var(--cp-text); }"), "Native options must use explicit theme colors.");
check(livePlannerHtml.includes("Formerly the GitHub Copilot harness (renamed Oct 28, 2026). Same harness; no change to capabilities or billing."), "Planner must explain the harness rename.");
const plannerData = await readJson("tools/tokenomics/data/rates.json");
check(plannerData.harnesses.find((entry) => entry.id === "github")?.name === "Microsoft Copilot harness", "Planner must rename the harness without changing its ID.");
check(plannerData.rates.github.name === "Microsoft Copilot harness", "Source rate card must use the new harness label.");
check(livePlannerHtml.includes('src="./app.js"'), "Live planner must load the local ES module.");
check(livePlannerHtml.includes("Estimates, not quotes or licensing guidance."), "Live planner must retain its public boundary.");
check(["estimate", "why", "harness", "value", "sources"].every((id) => livePlannerHtml.includes(`id="${id}" role="tabpanel"`)), "Live planner must expose all five screens.");
check(tokenomicsPlannerHtml.includes("Tokenomics planner: what will this AI agent actually cost, and is it worth it?"), "Tokenomics planner article headline is missing.");
check(tokenomicsPlannerHtml.includes("Builder's Log &middot; Information-only / Private active build"), "Tokenomics planner must show the information-only label.");
check(tokenomicsPlannerHtml.includes("Owner-reviewed as of <time datetime=\"2026-10-27\">2026-10-27</time>"), "Tokenomics planner must show its as-of date.");
check(blogHtml.includes("Size an AI agent&#39;s monthly running cost as an honest low / likely / high range, pick the right harness, and weigh cost against business value. Unconfirmed rates are flagged on purpose, with the reason why."), "Tokenomics planner card summary is missing.");
check(blogHtml.includes('<p class="eyebrow">Decision support</p>'), "Tokenomics planner card category is missing.");
check(tokenomicsPlannerHtml.includes("<h2>⚠️ Read this first: why some numbers are ranges, not answers</h2>"), "Tokenomics planner must highlight its uncertainty callout.");
check(tokenomicsPlannerHtml.includes('<table class="article-table">'), "Tokenomics planner facts must be rendered as a table.");
check(offersSharedTheme(tokenomicsPlannerHtml), "Tokenomics planner must provide working Light, Dark, and Auto theme choices.");
const tokenomicsPlannerBody = tokenomicsPlannerHtml.match(/<div class="shell article-body">([\s\S]*?)<\/section>/)?.[1] || "";
const tokenomicsPlannerLinks = [...tokenomicsPlannerBody.matchAll(/<a href="([^"]+)"/g)]
  .map((match) => match[1])
  .filter((href) => href.startsWith("http"));
check(
  JSON.stringify(tokenomicsPlannerLinks) === JSON.stringify([
    "https://learn.microsoft.com/en-us/microsoft-copilot-studio/harnesses-overview",
    "https://learn.microsoft.com/en-us/microsoft-copilot-studio/requirements-messages-management",
    "https://learn.microsoft.com/en-us/microsoft-copilot-studio/agents-experience/billing-credit-overview",
    "https://learn.microsoft.com/en-us/microsoft-copilot-studio/guidance/govern-credit-consumption",
    "https://learn.microsoft.com/en-us/ai-builder/endofaibcredits",
    "https://cdn-dynmedia-1.microsoft.com/is/content/microsoftcorp/microsoft/bade/documents/products-and-services/en-us/ai/Copilot-Credits-Guide.pdf",
    "https://www.microsoft.com/en-us/research/publication/the-price-reversal-phenomenon-when-cheaper-reasoning-models-end-up-costing-more/"
  ]),
  "Tokenomics planner may link only the referenced public sources."
);
check(
  tokenomicsPlannerBody.includes("<strong>Public boundary: Information-only.</strong> Source and operational materials are not published yet. Personal project showcase. Built and demonstrated with fictional data. Estimates, not quotes or licensing guidance; for actual pricing, talk to your Microsoft account team or partner. Not a Microsoft product or supported offering; views are my own."),
  "Tokenomics planner must include the complete public boundary."
);

const tools = await readJson("tools/tools.json");
const toolsHtml = outputs.get("tools/index.html");
check(tools[0]?.name === "Tokenomics planner" && tools[0]?.status === "Live", "The live planner must be the first tool.");
check((toolsHtml.match(/class="release-card tool-card"/g) || []).length === tools.length, "Every tool data entry must render a card.");
const salesSuiteTool = tools.find((tool) => tool.name === "Sales Extension Suite for Copilot");
check(salesSuiteTool?.status === "Public release", "Sales Extension Suite must be listed as a Public release.");
check(salesSuiteTool?.description === "Optional Cowork plugins that package repeatable sales routines: account briefs, meeting follow-through, deal coaching and team handoffs.", "Sales Extension Suite tool description must match the requested copy.");
check(
  JSON.stringify(salesSuiteTool?.links) === JSON.stringify([
    { label: "Open site", url: "https://billwhalenmsft.github.io/copilot-sales-service-agent-extensions/" },
    { label: "Read the write-up", url: "/blog/sales-agent-cowork-sales-suite/" }
  ]),
  "Sales Extension Suite tool card must link to the public site and write-up."
);
const approvedToolLinks = new Set([
  "/tools/tokenomics/", "/blog/tokenomics-planner/",
  "/blog/sales-agent-cowork-sales-suite/",
  "https://billwhalenmsft.github.io/copilot-sales-service-agent-extensions/",
  ...ordered.flatMap((release) => [
    `/journal/${release.slug}/`, `/blog/${release.article.slug}/`,
    ...release.sourceUrls,
    ...(release.publicLinks || []).flatMap((link) => [
      link.url, link.url.startsWith(SITE_URL) ? link.url.slice(SITE_URL.length) : link.url
    ])
  ])
]);
for (const tool of tools) {
  for (const field of ["name", "status", "description"]) check(isNonEmptyString(tool[field]), `Tool ${tool.name}: missing ${field}.`);
  requireStrings(tool.tags, "tags", tool.name);
  check(["Live", "Public release"].includes(tool.status), `Tool ${tool.name}: invalid status.`);
  check(Array.isArray(tool.links) && tool.links.length >= 2, `Tool ${tool.name}: provide the tool and write-up links.`);
  for (const link of tool.links) {
    check(isNonEmptyString(link.label), `Tool ${tool.name}: missing link label.`);
    check(approvedToolLinks.has(link.url), `Tool ${tool.name}: link must already be public and approved: ${link.url}`);
  }
}
for (const [relativePath, html] of diskHtml) {
  check(html.includes('src="/assets/site-chrome.js"') && chromeSource.includes('["/tools/", "Tools"]'), `${relativePath}: missing shared Tools directory link.`);
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
check((rssXml.match(/<item>/g) || []).length === ordered.length, "RSS item count must match public releases.");
check(!rssXml.includes("software-factory-pattern"), "Builder's Log post must not appear in RSS.");
check(!rssXml.includes("tokenomics-planner"), "Tokenomics planner must not appear in RSS.");
check(!rssXml.includes("copilot-studio-harnesses"), "Harness Builder's Log must not appear in RSS.");
check(/^<\?xml version="1.0" encoding="UTF-8"\?>/.test(atomXml), "Atom must declare UTF-8 XML.");
check(/<feed xmlns="http:\/\/www.w3.org\/2005\/Atom">/.test(atomXml), "Atom root is missing.");
check((atomXml.match(/<entry>/g) || []).length === ordered.length, "Atom entry count must match public releases.");
check(!atomXml.includes("software-factory-pattern"), "Builder's Log post must not appear in Atom.");
check(!atomXml.includes("tokenomics-planner"), "Tokenomics planner must not appear in Atom.");
check(!atomXml.includes("copilot-studio-harnesses"), "Harness Builder's Log must not appear in Atom.");

const sitemapXml = outputs.get("sitemap.xml");
const sitemapUrls = [...sitemapXml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
const expectedSitemapUrls = sitemapEntries(catalog).map((entry) => entry.url);
check(
  JSON.stringify(sitemapUrls) === JSON.stringify(expectedSitemapUrls),
  "Sitemap URLs must exactly match generated public routes."
);
const softwareFactorySitemapEntry = sitemapXml.split("<url>")
  .find((entry) => entry.includes(`<loc>${SITE_URL}/blog/software-factory-pattern/</loc>`));
check(softwareFactorySitemapEntry?.includes("<lastmod>2026-10-24</lastmod>"), "Sitemap must include the Builder's Log post with the requested lastmod.");
const tokenomicsPlannerSitemapEntry = sitemapXml.split("<url>")
  .find((entry) => entry.includes(`<loc>${SITE_URL}/blog/tokenomics-planner/</loc>`));
check(tokenomicsPlannerSitemapEntry?.includes("<lastmod>2026-10-27</lastmod>"), "Sitemap must include the tokenomics planner post with the requested lastmod.");
const harnessSitemapEntry = sitemapXml.split("<url>")
  .find((entry) => entry.includes(`<loc>${SITE_URL}/blog/copilot-studio-harnesses/</loc>`));
check(harnessSitemapEntry?.includes("<lastmod>2026-10-29</lastmod>"), "Harness post must have the requested sitemap lastmod.");
const salesSuiteSitemapEntry = sitemapXml.split("<url>")
  .find((entry) => entry.includes(`<loc>${SITE_URL}/blog/sales-agent-cowork-sales-suite/</loc>`));
check(salesSuiteSitemapEntry?.includes("<lastmod>2026-10-30</lastmod>"), "Sales Extension Suite post must have the requested sitemap lastmod.");
check(!sitemapXml.includes("engagements/"), "Protected engagements must not appear in the sitemap.");
check(outputs.get("releases.json").endsWith("\n"), "Public release manifest must end with a newline.");
const publicManifest = JSON.parse(outputs.get("releases.json"));
check(publicManifest.version === 6, "Public release manifest version must be 6.");
check(publicManifest.recordCount === catalog.releases.length, "Manifest record count must be exactly 21.");
check(publicManifest.releaseCount === catalog.expectedPublicReleaseCount, "Manifest public release count must be exactly 10.");
check(publicManifest.infoOnlyCount === catalog.expectedInfoOnlyCount, "Manifest info-only count must be exactly 11.");
check(
  JSON.stringify(publicManifest.releases.map((release) => release.slug))
    === JSON.stringify(ordered.map((release) => release.slug)),
  "Public release manifest must use last-public-push ordering."
);
check(
  JSON.stringify(publicManifest.infoOnly.map((release) => release.slug))
    === JSON.stringify(orderedInfo.map((release) => release.slug)),
  "Info-only manifest records must use owner-reviewed as-of ordering."
);
pass("RSS, Atom, public manifest, and exact sitemap coverage checked.");

if (errors.length > 0) {
  console.error(`Validation failed with ${errors.length} issue${errors.length === 1 ? "" : "s"}:`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exitCode = 1;
} else {
  checks.forEach((message) => console.log(`PASS: ${message}`));
  console.log(`Validated ${ordered.length} public releases, ${orderedInfo.length} info-only showcases, and ${outputs.size} generated files.`);
}
