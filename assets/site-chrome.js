(() => {
  const header = document.querySelector("[data-site-header]");
  const footer = document.querySelector("[data-site-footer]");
  const links = [
    ["/", "Home"],
    ["/#work", "Work"],
    ["/#capabilities", "Capabilities"],
    ["/#resume", "Resume"],
    ["/journal/", "Solution journal"],
    ["/blog/", "Blog"],
    ["/tools/", "Tools"],
    ["/#connect", "Connect"]
  ];
  const home = ["/", "/index.html"].includes(window.location.pathname);
  const rssIcon = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="5" cy="19" r="2" fill="currentColor"/><path d="M3 11a10 10 0 0 1 10 10M3 3a18 18 0 0 1 18 18" stroke="currentColor" stroke-width="2"/></svg>`;

  header.innerHTML = `
    <div class="sc-bar">
      <a class="sc-brand" href="/" aria-label="Bill Whalen — Home"><span class="sc-mark" aria-hidden="true">BW</span><span class="sc-name">Bill Whalen<small>THE ATOMIC COLLECTION</small></span></a>
      <button class="sc-button sc-menu" type="button" aria-expanded="false" aria-controls="site-navigation">Menu</button>
      <nav class="sc-nav" id="site-navigation" aria-label="Primary navigation">
        ${links.map(([href, label]) => `<a href="${href}">${label}</a>`).join("")}
      </nav>
      <div class="sc-utilities">
        ${home ? `<button class="sc-button" id="commandButton" type="button" aria-label="Open quick launch" aria-haspopup="dialog"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m13 2-9 12h7l-1 8 10-12h-7l1-8Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg></button>` : ""}
        <a class="sc-button" href="/feeds/rss.xml" aria-label="RSS feed">${rssIcon}</a>
        <label class="sc-theme"><span class="sc-sr-only">Theme</span><select id="themeSelect" aria-label="Theme"><option value="light">Light</option><option value="dark">Dark</option><option value="auto">Auto</option></select></label>
      </div>
    </div>`;
  footer.innerHTML = `
    <div class="sc-footer-inner">
      <p>© 2026 Bill Whalen. Personal portfolio; views are my own. Community projects are provided as-is and are not Microsoft products or supported offerings.</p>
      <div class="sc-footer-links">
        <a href="/journal/">Journal</a><a href="/blog/">Blog</a><a href="/tools/">Tools</a><a href="/subscribe/">Subscribe</a><a href="/feeds/rss.xml">Feeds/RSS</a><a href="https://github.com/billwhalenmsft" rel="noreferrer">GitHub</a><a href="https://www.linkedin.com/in/williamjaywhalen/" rel="noreferrer">LinkedIn</a>
      </div>
    </div>`;

  const select = document.getElementById("themeSelect");
  select.value = document.documentElement.dataset.themePreference;
  select.addEventListener("change", () => window.siteTheme.setPreference(select.value));

  const menu = header.querySelector(".sc-menu");
  function closeMenu() {
    menu.setAttribute("aria-expanded", "false");
  }
  menu.addEventListener("click", () => {
    menu.setAttribute("aria-expanded", String(menu.getAttribute("aria-expanded") !== "true"));
  });
  header.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && menu.getAttribute("aria-expanded") === "true") {
      closeMenu();
      menu.focus();
    }
  });
  document.addEventListener("click", (event) => {
    if (!header.contains(event.target)) closeMenu();
  });
  header.querySelectorAll(".sc-nav a").forEach((link) => link.addEventListener("click", closeMenu));
  window.matchMedia("(max-width: 900px)").addEventListener("change", closeMenu);

  function updateActiveLink() {
    const path = window.location.pathname;
    const hash = { "#about": "#resume", "#contact": "#connect" }[window.location.hash] || window.location.hash;
    const current = home ? (links.some(([href]) => href === `/${hash}`)
      ? `/${hash}` : "/")
      : links.find(([href]) => href !== "/" && !href.includes("#") && path.startsWith(href))?.[0];
    header.querySelectorAll(".sc-nav a").forEach((link) => {
      if (link.getAttribute("href") === current) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
  }
  updateActiveLink();
  window.addEventListener("hashchange", updateActiveLink);
})();
