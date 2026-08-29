import { API_URL } from "../config";

const CACHE_KEY = "feta_prize_list";
const CACHE_TIME_KEY = "feta_prize_list_saved_at";

/* A list to fall back on if the sheet has never been filled in and the
   phone has no cached copy yet. Matches what the app shipped with. */
export const FALLBACK_PRIZES = [
  { name: "Keychain", qty: 10, active: true, tier: "regular", weight: 20 },
  { name: "1 Bottle", qty: 10, active: true, tier: "regular", weight: 20 },
  { name: "2 Bottles", qty: 5, active: true, tier: "regular", weight: 10 },
  { name: "3 Bottles", qty: 3, active: true, tier: "regular", weight: 5 },
  { name: "6 Pack", qty: 2, active: true, tier: "main", weight: 2 },
  { name: "Cap", qty: 5, active: true, tier: "regular", weight: 10 },
  { name: "Bottle Opener", qty: 10, active: true, tier: "regular", weight: 20 },
  { name: "Umbrella", qty: 3, active: true, tier: "regular", weight: 5 },
  { name: "Glass", qty: 5, active: true, tier: "regular", weight: 10 },
  { name: "T-Shirt", qty: 1, active: true, tier: "main", weight: 1 },
];

function normalise(list) {
  if (!Array.isArray(list)) return [];
  return list
    .filter((p) => p && String(p.name || "").trim())
    .map((p) => ({
      name: String(p.name).trim(),
      qty: Math.max(0, Number(p.qty) || 0),
      active: p.active !== false && String(p.active).toLowerCase() !== "false",
      tier: p.tier === "main" ? "main" : "regular",
      weight: p.weight === undefined || p.weight === "" ? 1 : Math.max(0, Number(p.weight) || 0),
    }));
}

/* The last list this phone successfully downloaded. Read this first so
   the screen has something to show while the network call is in flight,
   and so a BA with no signal can still set up a campaign. */
export function readCachedPrizes() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const list = normalise(JSON.parse(raw));
    return list.length ? list : null;
  } catch {
    return null;
  }
}

export function readCacheTime() {
  return localStorage.getItem(CACHE_TIME_KEY) || "";
}

function writeCache(list) {
  localStorage.setItem(CACHE_KEY, JSON.stringify(list));
  localStorage.setItem(CACHE_TIME_KEY, new Date().toISOString());
}

/* Pull the current list from the sheet. Returns every prize including
   inactive ones, so the admin screen can show what's switched off. */
export async function getPrizes() {
  const res = await fetch(`${API_URL}?action=getPrizes&t=${Date.now()}`);
  const data = await res.json();

  if (!data.success) {
    throw new Error(data.message || "The server didn't return a prize list.");
  }

  const list = normalise(data.prizes);
  if (list.length) writeCache(list);
  return list;
}

/* Only prizes that are switched on, for the campaign setup screen. */
export async function getActivePrizes() {
  const list = await getPrizes();
  return list.filter((p) => p.active);
}

export async function savePrizes(prizes, username, password) {
  const list = normalise(prizes);

  if (!list.length) {
    throw new Error("Add at least one prize before saving.");
  }

  const names = list.map((p) => p.name.toLowerCase());
  const duplicate = names.find((n, i) => names.indexOf(n) !== i);
  if (duplicate) {
    throw new Error(`"${duplicate}" is listed twice. Prize names must be unique.`);
  }

  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body: JSON.stringify({ action: "savePrizes", username, password, prizes: list }),
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

  writeCache(list);
  return list;
}
