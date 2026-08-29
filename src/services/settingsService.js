import { API_URL } from "../config";

const CACHE_KEY = "feta_settings";

const DEFAULT_WIN_MESSAGE = "Congratulations! You've won {prize} 🎉";

function readCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeCache(settings) {
  localStorage.setItem(CACHE_KEY, JSON.stringify(settings));
}

/* Reads the settings sheet. Falls back to the last cached copy, then to
   a built-in default, so a BA with no signal still sees a message. */
/* Returns the whole settings map (win message, theme, anything added
   later), falling back to the cached copy when offline. */
export async function getSettings() {
  try {
    const res = await fetch(`${API_URL}?action=getSettings&t=${Date.now()}`);
    const data = await res.json();
    if (data.success && data.settings) {
      writeCache(data.settings);
      return data.settings;
    }
  } catch {
    /* fall through to cache */
  }
  return readCache() || {};
}

export async function saveSettings(settings, username, password) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body: JSON.stringify({ action: "saveSettings", username, password, settings }),
  });

  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("The server sent back something unreadable.");
  }
  if (!data.success) throw new Error(data.message || "The save was rejected.");

  writeCache({ ...(readCache() || {}), ...settings });
}

export async function getWinMessage() {
  try {
    const res = await fetch(`${API_URL}?action=getSettings&t=${Date.now()}`);
    const data = await res.json();
    if (data.success && data.settings) {
      writeCache(data.settings);
      return data.settings.winMessage || DEFAULT_WIN_MESSAGE;
    }
  } catch {
    // fall through to cache/default below
  }

  const cached = readCache();
  return (cached && cached.winMessage) || DEFAULT_WIN_MESSAGE;
}

export async function saveWinMessage(message, username, password) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body: JSON.stringify({
      action: "saveSettings",
      username,
      password,
      settings: { winMessage: message },
    }),
  });

  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("The server sent back something unreadable.");
  }

  if (!data.success) {
    throw new Error(data.message || "The server rejected the save.");
  }

  const cached = readCache() || {};
  cached.winMessage = message;
  writeCache(cached);
}

export function fillTemplate(template, prize) {
  return String(template || DEFAULT_WIN_MESSAGE).replace(/\{prize\}/g, prize || "");
}
