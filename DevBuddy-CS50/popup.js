const input = document.getElementById("termInput");
const searchBtn = document.getElementById("searchBtn");
const result = document.getElementById("result");
const termCount = document.getElementById("termCount");
const addTermInput = document.getElementById("addTermInput");
const addMeaningInput = document.getElementById("addMeaningInput");
const addFavoriteBtn = document.getElementById("addFavoriteBtn");
const favoritesList = document.getElementById("favoritesList");
const favoriteCount = document.getElementById("favoriteCount");
const favoritesEmpty = document.getElementById("favoritesEmpty");
const closePopupBtn = document.getElementById("closePopupBtn");

const FAVORITES_KEY = "devbuddyFavorites";
const DRAFT_KEY = "devbuddyDraft";
const DRAFT_SAVE_DELAY_MS = 180;

let baseDictionary = {};
let favorites = {};
let dictionary = {};
let editingKey = "";
let draftSaveTimer = null;
let keepDraftOnClose = true;

function normalize(term) {
  return String(term || "").toLowerCase().trim().replace(/\s+/g, " ");
}

function normalizeMeaning(entry) {
  if (!entry) return "";
  if (typeof entry === "string") return entry.trim();
  if (typeof entry.meaning === "string") return entry.meaning.trim();
  return "";
}

function getDisplayTerm(key, entry) {
  if (entry && typeof entry.term === "string" && entry.term.trim()) {
    return entry.term.trim();
  }

  return key;
}

function showResult(message) {
  result.textContent = message;
}

function createSvgIcon(pathDataList) {
  const svgNs = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgNs, "svg");
  svg.classList.add("icon-svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("width", "14");
  svg.setAttribute("height", "14");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("focusable", "false");

  pathDataList.forEach((d) => {
    const path = document.createElementNS(svgNs, "path");
    path.setAttribute("d", d);
    svg.appendChild(path);
  });

  return svg;
}

function createActionButton(type, key) {
  const isEdit = type === "edit";
  const button = document.createElement("button");
  button.type = "button";
  button.className = `mini-btn ${isEdit ? "edit-btn" : "remove-btn"}`;
  button.dataset.key = key;
  button.setAttribute("aria-label", isEdit ? "Edit term" : "Remove term");
  button.title = isEdit ? "Edit" : "Remove";

  const iconPaths = isEdit
    ? ["M12 20h9", "M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"]
    : ["M3 6h18", "M8 6V4h8v2", "M19 6l-1 14H6L5 6", "M10 11v6", "M14 11v6"];

  button.appendChild(createSvgIcon(iconPaths));
  return button;
}

function refreshAddButtonLabel() {
  if (!addFavoriteBtn) return;
  addFavoriteBtn.textContent = editingKey ? "Save Edit" : "Add";
}

function resetEditMode() {
  editingKey = "";
  refreshAddButtonLabel();
}

function updateCombinedDictionary() {
  const favoriteEntries = {};

  Object.entries(favorites).forEach(([rawKey, entry]) => {
    const key = normalize(rawKey);
    const meaning = normalizeMeaning(entry);
    if (!key || !meaning) return;

    favoriteEntries[key] = { meaning };
  });

  dictionary = { ...baseDictionary, ...favoriteEntries };

  if (termCount) {
    termCount.textContent = `${Object.keys(dictionary).length} terms`;
  }
}

function renderFavorites() {
  const rows = Object.entries(favorites)
    .map(([rawKey, entry]) => {
      const key = normalize(rawKey);
      const meaning = normalizeMeaning(entry);
      if (!key || !meaning) return null;

      return {
        key,
        meaning,
        term: getDisplayTerm(key, entry)
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.key.localeCompare(b.key));

  if (favoriteCount) favoriteCount.textContent = String(rows.length);
  if (favoritesEmpty) favoritesEmpty.style.display = rows.length ? "none" : "block";
  if (!favoritesList) return;

  favoritesList.innerHTML = "";

  rows.forEach((row) => {
    const item = document.createElement("li");
    item.className = "favorite-item";

    const textWrap = document.createElement("div");
    textWrap.className = "favorite-text";

    const term = document.createElement("span");
    term.className = "favorite-term";
    term.textContent = row.term;

    const meaning = document.createElement("p");
    meaning.className = "favorite-meaning";
    meaning.textContent = row.meaning;

    textWrap.appendChild(term);
    textWrap.appendChild(meaning);

    const editBtn = createActionButton("edit", row.key);
    const removeBtn = createActionButton("remove", row.key);

    const actions = document.createElement("div");
    actions.className = "favorite-actions";
    actions.appendChild(editBtn);
    actions.appendChild(removeBtn);

    item.appendChild(textWrap);
    item.appendChild(actions);
    favoritesList.appendChild(item);
  });
}

function getFromStorage() {
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

function saveToStorage() {
  return new Promise((resolve, reject) => {
    if (!(typeof chrome !== "undefined" && chrome.storage?.local)) {
      reject(new Error("Storage is unavailable."));
      return;
    }

    chrome.storage.local.set({ [FAVORITES_KEY]: favorites }, () => {
      const error = chrome.runtime?.lastError;
      if (error) reject(error);
      else resolve();
    });
  });
}

function loadDraftFromStorage() {
  return new Promise((resolve) => {
    if (!(typeof chrome !== "undefined" && chrome.storage?.local)) {
      resolve({});
      return;
    }

    chrome.storage.local.get([DRAFT_KEY], (data) => {
      resolve(data?.[DRAFT_KEY] || {});
    });
  });
}

function saveDraftToStorage(draft) {
  return new Promise((resolve, reject) => {
    if (!(typeof chrome !== "undefined" && chrome.storage?.local)) {
      reject(new Error("Storage is unavailable."));
      return;
    }

    chrome.storage.local.set({ [DRAFT_KEY]: draft }, () => {
      const error = chrome.runtime?.lastError;
      if (error) reject(error);
      else resolve();
    });
  });
}

function clearDraftInStorage() {
  return new Promise((resolve, reject) => {
    if (!(typeof chrome !== "undefined" && chrome.storage?.local)) {
      reject(new Error("Storage is unavailable."));
      return;
    }

    chrome.storage.local.remove([DRAFT_KEY], () => {
      const error = chrome.runtime?.lastError;
      if (error) reject(error);
      else resolve();
    });
  });
}

function getDraftPayload() {
  return {
    term: String(addTermInput?.value || ""),
    meaning: String(addMeaningInput?.value || "")
  };
}

function applyDraftPayload(draft) {
  if (!draft || typeof draft !== "object") return;
  if (addTermInput && typeof draft.term === "string") addTermInput.value = draft.term;
  if (addMeaningInput && typeof draft.meaning === "string") addMeaningInput.value = draft.meaning;
}

function queueDraftSave() {
  if (draftSaveTimer) clearTimeout(draftSaveTimer);
  draftSaveTimer = setTimeout(() => {
    draftSaveTimer = null;
    saveDraftToStorage(getDraftPayload()).catch(() => {});
  }, DRAFT_SAVE_DELAY_MS);
}

async function flushDraftSave() {
  if (!keepDraftOnClose) return;

  if (draftSaveTimer) {
    clearTimeout(draftSaveTimer);
    draftSaveTimer = null;
  }

  try {
    await saveDraftToStorage(getDraftPayload());
  } catch (_error) {
    // Ignore draft save failures to avoid blocking UI actions.
  }
}

async function loadDictionary() {
  try {
    const response = await fetch("dictionary.json");
    baseDictionary = await response.json();
  } catch (_error) {
    baseDictionary = {};
    showResult("Could not load dictionary.");
  }
}

async function loadFavorites() {
  favorites = await getFromStorage();
  if (editingKey && !favorites[editingKey]) resetEditMode();
  updateCombinedDictionary();
  renderFavorites();
}

function runSearch() {
  const key = normalize(input.value);
  if (!key) {
    showResult("Type a term first.");
    return;
  }

  const entry = dictionary[key];
  if (!entry) {
    showResult("Term not found.");
    return;
  }

  showResult(entry.meaning);
}

async function addFavorite() {
  const rawTerm = addTermInput?.value || "";
  const key = normalize(rawTerm);
  const meaning = String(addMeaningInput?.value || "").trim();

  if (!key) {
    showResult("Type the new term first.");
    return;
  }

  if (!meaning) {
    showResult("Add a meaning before saving.");
    return;
  }

  const previousEditingKey = editingKey;
  const isRename = Boolean(previousEditingKey && previousEditingKey !== key);
  const existed = Boolean(favorites[key]);

  if (isRename && existed) {
    showResult(`"${key}" already exists in favorites.`);
    return;
  }

  if (isRename) {
    delete favorites[previousEditingKey];
  }

  favorites[key] = {
    term: rawTerm.trim(),
    meaning
  };

  try {
    await saveToStorage();
    resetEditMode();
    updateCombinedDictionary();
    renderFavorites();

    if (addTermInput) addTermInput.value = "";
    if (addMeaningInput) addMeaningInput.value = "";
    if (input) input.value = key;
    clearDraftInStorage().catch(() => {});

    if (isRename) {
      showResult(`Updated "${previousEditingKey}" to "${key}".`);
      return;
    }

    showResult(existed ? `Updated "${key}" in favorites.` : `Saved "${key}" to favorites.`);
  } catch (_error) {
    showResult("Could not save favorite term.");
  }
}

function editFavorite(key) {
  const entry = favorites[key];
  if (!key || !entry) return;

  const term = getDisplayTerm(key, entry);
  const meaning = normalizeMeaning(entry);

  editingKey = key;
  refreshAddButtonLabel();

  if (addTermInput) {
    addTermInput.value = term;
    addTermInput.focus();
    addTermInput.select();
  }

  if (addMeaningInput) addMeaningInput.value = meaning;
  queueDraftSave();

  showResult(`Editing "${key}". Update term or meaning, then Save Edit.`);
}

async function removeFavorite(key) {
  if (!key || !favorites[key]) return;

  delete favorites[key];

  try {
    await saveToStorage();
    if (editingKey === key) resetEditMode();
    updateCombinedDictionary();
    renderFavorites();
    showResult(`Removed "${key}" from favorites.`);
  } catch (_error) {
    showResult("Could not remove favorite term.");
  }
}

searchBtn.addEventListener("click", runSearch);
input.addEventListener("keydown", (event) => {
  if (event.key === "Enter") runSearch();
});

addFavoriteBtn?.addEventListener("click", addFavorite);
addTermInput?.addEventListener("keydown", (event) => {
  if (event.key === "Enter") addFavorite();
});
addTermInput?.addEventListener("input", queueDraftSave);
addMeaningInput?.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) addFavorite();
});
addMeaningInput?.addEventListener("input", queueDraftSave);
closePopupBtn?.addEventListener("click", async () => {
  keepDraftOnClose = false;
  if (draftSaveTimer) {
    clearTimeout(draftSaveTimer);
    draftSaveTimer = null;
  }
  await clearDraftInStorage().catch(() => {});
  window.close();
});
window.addEventListener("blur", () => {
  flushDraftSave();
});
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden") {
    flushDraftSave();
  }
});

favoritesList?.addEventListener("click", (event) => {
  const button = event.target.closest(".mini-btn");
  if (!button) return;

  const key = normalize(button.dataset.key);
  if (button.classList.contains("edit-btn")) {
    editFavorite(key);
    return;
  }

  removeFavorite(key);
});

if (typeof chrome !== "undefined" && chrome.storage?.onChanged) {
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== "local" || !changes[FAVORITES_KEY]) return;

    favorites = changes[FAVORITES_KEY].newValue || {};
    if (editingKey && !favorites[editingKey]) resetEditMode();
    updateCombinedDictionary();
    renderFavorites();
  });
}

async function init() {
  refreshAddButtonLabel();
  applyDraftPayload(await loadDraftFromStorage());
  await loadDictionary();
  await loadFavorites();
}

init();
