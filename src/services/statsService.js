import { API_URL } from "../config";

export async function getManagerStats(region, from = "", to = "") {
  const params = new URLSearchParams({
    action: "managerStats",
    region: region || "",
    from: from || "",
    to: to || "",
    t: String(Date.now()),
  });

  const res = await fetch(`${API_URL}?${params.toString()}`);
  const data = await res.json();
  if (!data.success) {
    throw new Error(data.message || "Couldn't load the figures.");
  }
  return data.stats;
}

/* Fire-and-forget: a failed log should never interrupt an activation. */
export function logSpin({ outletId, baId, prize, outcome }) {
  try {
    fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({
        action: "logSpin",
        outletId,
        baId,
        prize,
        outcome,
        date: new Date().toISOString(),
      }),
    }).catch(() => {});
  } catch {
    /* offline — reach for this spin goes uncounted, which is preferable
       to blocking the BA mid-activation. */
  }
}

export function pingPresence(baId) {
  if (!baId) return;
  try {
    fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({ action: "ping", baId }),
    }).catch(() => {});
  } catch {
    /* ignore */
  }
}
