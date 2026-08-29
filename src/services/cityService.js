import { API_URL } from "../config";

const CACHE_KEY = "feta_cities";

export const FALLBACK_CITIES = [
  "Addis Ababa", "Dire Dawa", "Bahir Dar", "Hawassa", "Mekelle",
  "Gondar", "Jimma", "Adama", "Dessie", "Jijiga",
  "Shashamane", "Hosaena", "Arba Minch", "Harar",
];

/* BAs work offline, so the last known list is cached and used whenever
   the network isn't there. */
export async function getCities() {
  try {
    const res = await fetch(`${API_URL}?action=getCities&t=${Date.now()}`);
    const data = await res.json();
    if (data.success && Array.isArray(data.cities) && data.cities.length) {
      localStorage.setItem(CACHE_KEY, JSON.stringify(data.cities));
      return data.cities;
    }
  } catch {
    /* fall through to cache */
  }

  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const list = JSON.parse(cached);
      if (Array.isArray(list) && list.length) return list;
    }
  } catch {
    /* ignore */
  }

  return FALLBACK_CITIES;
}

/* Full list including hidden entries, for the admin editor. */
export async function getAllCities() {
  const res = await fetch(`${API_URL}?action=getCities&all=1&t=${Date.now()}`);
  const data = await res.json();
  if (!data.success) throw new Error(data.message || "Couldn't load cities.");
  return data.cities || [];
}

export async function saveCities(cities, username, password) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body: JSON.stringify({
      action: "saveCities",
      username,
      password,
      cities: cities.map((name) => ({ name, active: true })),
    }),
  });

  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("The server sent back something unreadable.");
  }

  if (!data.success) throw new Error(data.message || "The save was rejected.");

  localStorage.setItem(CACHE_KEY, JSON.stringify(cities));
}
