const TARGET_URL = "https://www.fakeaddressgenerator.com/All_countries/address/country/Turkey";
const STORAGE_KEY = "turkeyAddressCache";
const CLOUDFLARE_CHALLENGE_TITLE = "just a moment...";
const CLOUDFLARE_CHALLENGE_TEXT = "Enable JavaScript and cookies to continue";
const CLOUDFLARE_CHALLENGE_TEXT_LOWER = CLOUDFLARE_CHALLENGE_TEXT.toLowerCase();
const CLOUDFLARE_CHALLENGE_SCRIPT_SELECTOR = "script[src*='/cdn-cgi/challenge-platform']";
const CLOUDFLARE_CHALLENGE_JS_MARKER = "window._cf_chl_opt";

const refreshButton = document.getElementById("refreshButton");
const statusElement = document.getElementById("status");
const dataContainer = document.getElementById("dataContainer");

const storage = {
  async get() {
    if (globalThis.chrome?.storage?.local) {
      const result = await chrome.storage.local.get(STORAGE_KEY);
      return result[STORAGE_KEY] ?? null;
    }

    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  },
  async set(value) {
    if (globalThis.chrome?.storage?.local) {
      await chrome.storage.local.set({ [STORAGE_KEY]: value });
      return;
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  }
};

function cleanText(text) {
  return text.replace(/\s+/g, " ").trim();
}

function parseAddressData(html) {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const sections = [];

  for (const table of doc.querySelectorAll("table.common-table")) {
    const heading = cleanText(table.querySelector("h2")?.textContent || "Details");
    const rows = [];

    for (const row of table.querySelectorAll("tr")) {
      const cells = row.querySelectorAll("td");
      if (cells.length < 2) {
        continue;
      }

      const label = cleanText(cells[0].textContent || "");
      const value = cleanText(cells[1].textContent || "");

      if (!label || !value) {
        continue;
      }

      rows.push({ label, value });
    }

    if (rows.length) {
      sections.push({ heading, rows });
    }
  }

  return sections;
}

function isCloudflareChallengePage(html) {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const title = cleanText(doc.title || "").toLowerCase();
  const bodyText = cleanText(doc.body?.textContent || "").toLowerCase();

  return (
    title.includes(CLOUDFLARE_CHALLENGE_TITLE) ||
    bodyText.includes(CLOUDFLARE_CHALLENGE_TEXT_LOWER) ||
    Boolean(doc.querySelector(CLOUDFLARE_CHALLENGE_SCRIPT_SELECTOR)) ||
    html.includes(CLOUDFLARE_CHALLENGE_JS_MARKER)
  );
}

function render(data) {
  dataContainer.innerHTML = "";

  if (!data?.sections?.length) {
    dataContainer.textContent = "No data found.";
    return;
  }

  for (const section of data.sections) {
    const wrapper = document.createElement("article");
    wrapper.className = "section";

    const title = document.createElement("h2");
    title.textContent = section.heading;

    const list = document.createElement("ul");
    list.className = "rows";

    for (const row of section.rows) {
      const item = document.createElement("li");
      const label = document.createElement("span");
      label.className = "label";
      label.textContent = row.label;

      const value = document.createElement("span");
      value.className = "value";
      value.textContent = row.value;

      item.append(label, value);
      list.appendChild(item);
    }

    wrapper.append(title, list);
    dataContainer.appendChild(wrapper);
  }
}

async function fetchAndStore() {
  refreshButton.disabled = true;
  statusElement.textContent = "Fetching latest data…";

  try {
    const response = await fetch(TARGET_URL, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    const html = await response.text();
    if (isCloudflareChallengePage(html)) {
      throw new Error("The source website is currently protected by Cloudflare and blocked this request. Please try again later.");
    }

    const sections = parseAddressData(html);

    if (!sections.length) {
      throw new Error("Address data could not be extracted from the response.");
    }

    const payload = {
      fetchedAt: new Date().toISOString(),
      sections
    };

    await storage.set(payload);
    render(payload);
    statusElement.textContent = `Updated: ${new Date(payload.fetchedAt).toLocaleString()}`;
  } catch (error) {
    statusElement.textContent = `Error: ${error instanceof Error ? error.message : "Unknown error"}`;
  } finally {
    refreshButton.disabled = false;
  }
}

async function init() {
  const cached = await storage.get();

  if (cached?.sections?.length) {
    render(cached);
    statusElement.textContent = `Cached: ${new Date(cached.fetchedAt).toLocaleString()}`;
    return;
  }

  await fetchAndStore();
}

refreshButton.addEventListener("click", fetchAndStore);
init();
