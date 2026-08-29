import { API_URL } from "../config";

import { getDeviceId } from "../services/deviceId";

/* The sheet appends new rows at the bottom, so the raw response is
   oldest-first. BAs care about what they just added, so newest goes on
   top. Anything without a usable date sorts to the end rather than
   jumping the queue. */
export function newestFirst(outlets) {
  if (!Array.isArray(outlets)) return [];

  return [...outlets].sort((a, b) => {
    const ta = new Date(a?.createdAt).getTime();
    const tb = new Date(b?.createdAt).getTime();
    const va = isNaN(ta) ? -Infinity : ta;
    const vb = isNaN(tb) ? -Infinity : tb;
    return vb - va;
  });
}

export async function getOutlets(baId) {
  /* Without an id there is no such thing as "all outlets" — return
     nothing rather than letting the request go out unfiltered. */
  if (!baId) return [];

  const deviceId = getDeviceId();
  const response = await fetch(
    `${API_URL}?action=getOutlets&baId=${baId}&deviceId=${deviceId}`
  );
  return newestFirst(await response.json());
}
