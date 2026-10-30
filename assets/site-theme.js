(() => {
  const key = "site-theme";
  const valid = (value) => ["light", "dark", "auto"].includes(value);
  const system = window.matchMedia("(prefers-color-scheme: dark)");
  const param = new URLSearchParams(window.location.search).get("scoutTheme");
  let preference = valid(param) ? param : null;

  try {
    preference ||= localStorage.getItem(key);
    if (!valid(preference)) {
      preference = ["scoutTheme", "theme", "themePreference"]
        .map((oldKey) => localStorage.getItem(oldKey)).find(valid);
    }
  } catch {
    // Theme controls still work when browser storage is unavailable.
  }
  if (!valid(preference)) preference = "auto";

  function apply(value) {
    preference = valid(value) ? value : "auto";
    document.documentElement.dataset.themePreference = preference;
    document.documentElement.dataset.theme = preference === "auto"
      ? (system.matches ? "dark" : "light") : preference;
    const select = document.getElementById("themeSelect");
    if (select) select.value = preference;
  }

  function save() {
    try {
      localStorage.setItem(key, preference);
      ["scoutTheme", "theme", "themePreference"].forEach((oldKey) => localStorage.removeItem(oldKey));
    } catch {
      // Storage is optional; the current page can always change theme.
    }
  }

  apply(preference);
  save();
  system.addEventListener("change", () => apply(preference));
  window.addEventListener("storage", (event) => {
    if (event.key === key || event.key === null) apply(event.newValue);
  });
  window.siteTheme = {
    setPreference(value) {
      apply(value);
      save();
      const url = new URL(window.location.href);
      url.searchParams.delete("scoutTheme");
      window.history.replaceState({}, "", url);
    }
  };
})();
