let dictionary = {};
let dictionaryPromise = null;

const FAVORITES_KEY = "devbuddyFavorites";

function normalizeTerm(term) {
  const normalized = String(term || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");

  // Remove punctuation only at the edges, keep inner spaces for multi-word terms.
  return normalized.replace(/^[^a-z0-9]+|[^a-z0-9]+$/g, "");
}

function normalizeMeaning(entry) {
  if (!entry) return "";
  if (typeof entry === "string") return entry.trim();
  if (typeof entry.meaning === "string") return entry.meaning.trim();
  return "";
}

function mergeFavoritesIntoDictionary(baseDictionary, favoriteDictionary) {
  const merged = { ...baseDictionary };

  Object.entries(favoriteDictionary || {}).forEach(([rawKey, entry]) => {
    const key = normalizeTerm(rawKey);
    const meaning = normalizeMeaning(entry);
    if (!key || !meaning) return;
    merged[key] = { meaning };
  });

  return merged;
}

function getFavoritesFromStorage() {
  return new Promise((resolve) => {
    if (!(typeof chrome !== "undefined" && chrome.storage?.local)) {
      resolve({});
      return;
    }

    chrome.storage.local.get([FAVORITES_KEY], (data) => {
      resolve(data?.[FAVORITES_KEY] || {});
    });
  });
}

function loadDictionary(forceReload = false) {
  if (forceReload) {
    dictionaryPromise = null;
  }

  if (dictionaryPromise) {
    return dictionaryPromise;
  }

  dictionaryPromise = (async () => {
    const url = chrome.runtime.getURL("dictionary.json");
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const baseDictionary = await response.json();
    const favorites = await getFavoritesFromStorage();
    dictionary = mergeFavoritesIntoDictionary(baseDictionary, favorites);
    return dictionary;
  })().catch((error) => {
    console.error("Failed to load dictionary:", error);
    dictionary = {};
    dictionaryPromise = null;
    return dictionary;
  });

  return dictionaryPromise;
}

loadDictionary();

function removeTooltip() {
  const oldTooltip = document.querySelector(".devbuddy-tooltip");
  if (oldTooltip) oldTooltip.remove();
}

function showTooltip(term, meaning, x, y) {
  removeTooltip();

  const tooltip = document.createElement("div");
  tooltip.className = "devbuddy-tooltip";

  const termEl = document.createElement("span");
  termEl.className = "devbuddy-tooltip__term";
  termEl.textContent = term;

  const meaningEl = document.createElement("span");
  meaningEl.className = "devbuddy-tooltip__meaning";
  meaningEl.textContent = meaning;

  tooltip.appendChild(termEl);
  tooltip.appendChild(meaningEl);

  tooltip.style.left = `${x}px`;
  tooltip.style.top = `${y + 15}px`;

  document.body.appendChild(tooltip);

  const rect = tooltip.getBoundingClientRect();

  if (rect.right > window.innerWidth) {
    tooltip.style.left = `${window.innerWidth - rect.width - 10}px`;
  }

  if (rect.bottom > window.innerHeight) {
    tooltip.style.top = `${y - rect.height - 10}px`;
  }
}

async function tryShowTooltip(clientX, clientY) {
  const selectedText = normalizeTerm(window.getSelection()?.toString() || "");
  if (!selectedText) {
    removeTooltip();
    return;
  }

  if (!dictionary[selectedText]) {
    await loadDictionary();
  }

  const entry = dictionary[selectedText];
  if (entry?.meaning) {
    showTooltip(selectedText, entry.meaning, clientX, clientY);
  } else {
    removeTooltip();
  }
}

document.addEventListener("mouseup", (event) => {
  void tryShowTooltip(event.clientX, event.clientY);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    removeTooltip();
  }
});

if (typeof chrome !== "undefined" && chrome.storage?.onChanged) {
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== "local" || !changes[FAVORITES_KEY]) return;
    void loadDictionary(true);
  });
}
