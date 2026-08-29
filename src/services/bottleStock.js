/* Beer is stocked in crates, not as separate prize lines. A BA enters the
   number of crates once; every bottle prize on the wheel then draws from
   that single pool.

   "1 Bottle", "2 Bottles" and "3 Bottles" cost 1, 2 and 3 from the pool
   respectively, so the pool is counted in bottles, not in wins. */

export const BOTTLES_PER_CRATE = 24;

/* How many bottles this prize hands over, or 0 if it isn't beer.
   Matches "1 Bottle", "2 Bottles", "3 bottles" and so on. */
export function bottleCost(prizeName) {
  const name = String(prizeName || "").trim();

  /* A 6-pack is six bottles out of the same pool, even though its name
     doesn't follow the "<n> Bottles" shape. */
  if (/6\s*-?\s*pack/i.test(name)) return 6;

  const match = name.match(/^(\d+)\s*bottles?$/i);
  return match ? Number(match[1]) : 0;
}

export function isBottlePrize(prizeName) {
  return bottleCost(prizeName) > 0;
}

export function cratesToBottles(crates) {
  const n = Number(crates);
  if (!isFinite(n) || n < 0) return 0;
  return Math.floor(n) * BOTTLES_PER_CRATE;
}

const key = (outletId) => `bottle_pool_${outletId}`;

export function readPool(outletId) {
  const raw = localStorage.getItem(key(outletId));
  if (raw === null) return null; // no beer configured for this outlet
  const n = Number(raw);
  return isFinite(n) && n >= 0 ? n : 0;
}

export function writePool(outletId, bottles) {
  localStorage.setItem(key(outletId), String(Math.max(0, Math.floor(bottles))));
}

/* A bottle prize can only stay on the wheel while the pool can still
   cover it — no point offering "3 Bottles" with 2 left. */
export function canAfford(prizeName, pool) {
  const cost = bottleCost(prizeName);
  if (cost === 0) return true; // not beer, pool doesn't apply
  if (pool === null) return true; // beer not being tracked at this outlet
  return pool >= cost;
}
