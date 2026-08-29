/**
 * Feta Wheel — backend
 *
 * One Apps Script Web App serving every action the frontend calls:
 *   login, getOutlets, addOutlet, addWinner, getPrizes, savePrizes,
 *   generateMyDailyPDF
 *
 * ── Setup ──────────────────────────────────────────────────────────
 * 1. Create a new Google Sheet. Open Extensions → Apps Script.
 * 2. Paste this whole file in as Code.gs (replace the default content).
 * 3. Run `setupAllSheets` once from the editor (select it in the
 *    function dropdown, click Run). Approve the permissions prompt.
 *    This creates the Users, Outlets, Winners, and Prizes tabs and
 *    seeds two accounts — see the bottom of this file for the values.
 * 4. Project Settings → Script Properties → add ADMIN_KEY with a
 *    long random string of your choosing. That's what the admin
 *    prize screen will ask for when saving.
 * 5. Deploy → New deployment → type "Web app" → Execute as "Me" →
 *    Who has access "Anyone". Copy the /exec URL.
 * 6. Put that URL into src/config.js in the frontend (one place —
 *    every page and service reads from there).
 *
 * Whenever you change this file, you must Deploy → Manage
 * deployments → Edit → New version, or the live URL keeps serving
 * the old code.
 * ─────────────────────────────────────────────────────────────────
 */

const SHEET_USERS = "Users";
const SHEET_OUTLETS = "Outlets";
const SHEET_WINNERS = "Winners";
const SHEET_PRIZES = "Prizes";
const SHEET_SETTINGS = "Settings";
const SHEET_SPINS = "Spins";
const SHEET_CITIES = "Cities";

function ss_() {
  return SpreadsheetApp.getActiveSpreadsheet();
}

function sheet_(name) {
  return ss_().getSheetByName(name);
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}

function rowsToObjects_(sheet) {
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];
  const headers = values[0];
  return values.slice(1).map((row) => {
    const obj = {};
    headers.forEach((h, i) => (obj[h] = row[i]));
    return obj;
  });
}

// ─── Web app entry points ───────────────────────────────────────────

function doGet(e) {
  const action = e.parameter.action;

  try {
    if (action === "login") return handleLogin_(e);
    if (action === "getOutlets") return handleGetOutlets_(e);
    if (action === "getPrizes") return handleGetPrizes_(e);
    if (action === "getCities") return handleGetCities_(e);
    if (action === "getUsers") return handleGetUsers_(e);
    if (action === "getSettings") return handleGetSettings_(e);
    if (action === "managerStats") return handleManagerStats_(e);
    if (action === "generateMyDailyPDF") return handleDailyPDF_(e);

    return json_({ success: false, message: "Unknown action: " + action });
  } catch (err) {
    return json_({ success: false, message: String(err) });
  }
}

function doPost(e) {
  let payload;
  try {
    payload = JSON.parse(e.postData.contents);
  } catch (err) {
    return json_({ success: false, message: "Bad request body." });
  }

  try {
    if (payload.action === "addOutlet") return handleAddOutlet_(payload);
    if (payload.action === "addWinner") return handleAddWinner_(payload);
    if (payload.action === "savePrizes") return handleSavePrizes_(payload);
    if (payload.action === "saveCities") return handleSaveCities_(payload);
    if (payload.action === "saveUsers") return handleSaveUsers_(payload);
    if (payload.action === "saveSettings") return handleSaveSettings_(payload);
    if (payload.action === "logSpin") return handleLogSpin_(payload);
    if (payload.action === "ping") return handlePing_(payload);

    return json_({ success: false, message: "Unknown action: " + payload.action });
  } catch (err) {
    return json_({ success: false, message: String(err) });
  }
}

// ─── Login ───────────────────────────────────────────────────────────

function handleLogin_(e) {
  const username = String(e.parameter.username || "").trim();
  const password = String(e.parameter.password || "");

  const users = rowsToObjects_(sheet_(SHEET_USERS));
  const match = users.find(
    (u) => String(u.username).trim() === username && String(u.password) === password
  );

  if (!match) {
    return json_({ success: false, message: "Invalid credentials" });
  }

  return json_({
    success: true,
    user: {
      id: match.id,
      username: match.username,
      name: match.name,
      role: match.role || "",
      region: match.region || "",
    },
  });
}

// ─── Outlets ─────────────────────────────────────────────────────────

function handleGetOutlets_(e) {
  const baId = String(e.parameter.baId || "");
  const outlets = rowsToObjects_(sheet_(SHEET_OUTLETS)).filter(
    (o) => String(o.baId) === baId
  );
  // outletService.js expects the raw array, not a wrapped object.
  return json_(outlets);
}

function handleAddOutlet_(payload) {
  const id = "OUT-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8);

  let photoUrl = "";
  if (payload.photo) {
    photoUrl = savePhotoToDrive_(payload.photo, id);
  }

  appendByHeader_(sheet_(SHEET_OUTLETS), {
    id: id,
    baId: payload.baId || "",
    deviceId: payload.deviceId || "",
    name: payload.name || "",
    address: payload.address || "",
    city: payload.city || "",
    latitude: payload.latitude || "",
    longitude: payload.longitude || "",
    photoUrl: photoUrl,
    createdAt: new Date(),
  });

  return json_({ status: "success", id: id });
}

function savePhotoToDrive_(base64DataUrl, outletId) {
  try {
    const parts = base64DataUrl.split(",");
    const meta = parts[0];
    const data = parts[1];
    const contentType = meta.match(/data:(.*);base64/)[1];
    const blob = Utilities.newBlob(
      Utilities.base64Decode(data),
      contentType,
      outletId + ".jpg"
    );
    const folder = getOrCreateFolder_("Feta Wheel — Outlet Photos");
    const file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return file.getUrl();
  } catch (err) {
    return "";
  }
}

function getOrCreateFolder_(name) {
  const existing = DriveApp.getFoldersByName(name);
  if (existing.hasNext()) return existing.next();
  return DriveApp.createFolder(name);
}

// ─── Winners ─────────────────────────────────────────────────────────

/* Writes a row by matching header names rather than fixed positions, so
   adding a column to an existing sheet can never misalign the data. */
function appendByHeader_(sheet, obj) {
  const headers = sheet
    .getRange(1, 1, 1, sheet.getLastColumn())
    .getValues()[0]
    .map(function (h) {
      return String(h).trim();
    });

  const row = headers.map(function (h) {
    return Object.prototype.hasOwnProperty.call(obj, h) ? obj[h] : "";
  });

  sheet.appendRow(row);
}

function handleAddWinner_(payload) {
  const id = "WIN-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8);

  appendByHeader_(sheet_(SHEET_WINNERS), {
    id: id,
    outletId: payload.outletId || "",
    outletName: payload.outletName || "",
    prize: payload.prize || "",
    tier: payload.tier === "main" ? "main" : "regular",
    baId: payload.baId || "",
    fullName: payload.fullName || "",
    phone: payload.phone || "",
    age: payload.age || "",
    gender: payload.gender || "",
    date: payload.date || new Date().toISOString(),
  });

  return json_({ success: true, id: id });
}

/* Every spin is logged, win or not — this is what "people reached"
   counts. Winners only tells you who won something. */
function handleLogSpin_(payload) {
  appendByHeader_(sheet_(SHEET_SPINS), {
    id: "SPN-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8),
    outletId: payload.outletId || "",
    baId: payload.baId || "",
    prize: payload.prize || "",
    outcome: payload.outcome || "", // main | regular | none
    date: payload.date || new Date().toISOString(),
  });
  return json_({ success: true });
}

/* Lightweight heartbeat so the manager dashboard can show who's live. */
function handlePing_(payload) {
  const sheet = sheet_(SHEET_USERS);
  const values = sheet.getDataRange().getValues();
  const headers = values[0];
  const idCol = headers.indexOf("id");
  let seenCol = headers.indexOf("lastSeen");

  if (seenCol === -1) {
    seenCol = headers.length;
    sheet.getRange(1, seenCol + 1).setValue("lastSeen");
  }

  for (let i = 1; i < values.length; i++) {
    if (String(values[i][idCol]) === String(payload.baId)) {
      sheet.getRange(i + 1, seenCol + 1).setValue(new Date());
      break;
    }
  }
  return json_({ success: true });
}

// ─── Settings (editable text, e.g. the winner congratulations message) ──

function handleGetSettings_(e) {
  const rows = rowsToObjects_(sheet_(SHEET_SETTINGS));
  const settings = {};
  rows.forEach((r) => (settings[r.key] = r.value));
  return json_({ success: true, settings: settings });
}

function handleSaveSettings_(payload) {
  const auth = authorisePublish_(payload);
  if (!auth.ok) return json_({ success: false, message: auth.message });

  const sheet = sheet_(SHEET_SETTINGS);
  const rows = rowsToObjects_(sheet);
  const existing = {};
  rows.forEach((r, i) => (existing[r.key] = i + 2)); // +2: header row + 1-index

  Object.keys(payload.settings || {}).forEach((key) => {
    const value = payload.settings[key];
    if (existing[key]) {
      sheet.getRange(existing[key], 2).setValue(value);
    } else {
      sheet.appendRow([key, value]);
    }
  });

  return json_({ success: true });
}

/* Publishing (prizes, settings, cities) requires a user whose row has
   canPublish set TRUE *and* a matching password. The canPublish flag
   lives in the sheet so access can be granted or revoked without a code
   change or redeploy.

   Note: passwords in the Users sheet are plain text, so anyone with edit
   access to the spreadsheet can already see them. Restrict sharing on
   that file accordingly. */
function authorisePublish_(payload) {
  const username = String(payload.username || "").trim();
  const password = String(payload.password || "");

  if (!username || !password) {
    return { ok: false, message: "Enter your username and password." };
  }

  const users = rowsToObjects_(sheet_(SHEET_USERS));
  const match = users.find(function (u) {
    return String(u.username).trim() === username;
  });

  if (!match || String(match.password) !== password) {
    return { ok: false, message: "That password isn't right." };
  }

  const flag = String(match.canPublish).trim().toLowerCase();
  if (flag !== "true" && flag !== "yes" && flag !== "1") {
    return { ok: false, message: "This account can't publish changes." };
  }

  return { ok: true, user: match };
}

// ─── Cities ──────────────────────────────────────────────────────────

function handleGetCities_(e) {
  const rows = rowsToObjects_(sheet_(SHEET_CITIES));
  const cities = rows
    .filter(function (c) {
      return (
        String(c.name || "").trim() &&
        String(c.active).toLowerCase() !== "false"
      );
    })
    .map(function (c) {
      return String(c.name).trim();
    });

  return json_({ success: true, cities: cities });
}

function handleSaveCities_(payload) {
  const auth = authorisePublish_(payload);
  if (!auth.ok) return json_({ success: false, message: auth.message });

  const sheet = sheet_(SHEET_CITIES);
  sheet.clear();
  sheet.appendRow(["name", "active", "updatedAt"]);

  const now = new Date();
  (payload.cities || []).forEach(function (c) {
    const name = String(c.name || "").trim();
    if (name) sheet.appendRow([name, c.active !== false, now]);
  });

  return json_({ success: true });
}

// ─── User management ─────────────────────────────────────────────────

/* Returns the full user list including passwords. Gated behind the same
   canPublish + password check as publishing, since it exposes every
   credential in one response. */
function handleGetUsers_(e) {
  const auth = authorisePublish_({
    username: e.parameter.username,
    password: e.parameter.password,
  });
  if (!auth.ok) return json_({ success: false, message: auth.message });

  const users = rowsToObjects_(sheet_(SHEET_USERS)).map(function (u) {
    return {
      id: u.id,
      username: u.username,
      password: u.password,
      name: u.name,
      role: u.role || "",
      region: u.region || "",
      canPublish: String(u.canPublish).toLowerCase() === "true",
    };
  });

  return json_({ success: true, users: users });
}

function handleSaveUsers_(payload) {
  const auth = authorisePublish_(payload);
  if (!auth.ok) return json_({ success: false, message: auth.message });

  const incoming = payload.users || [];
  if (!incoming.length) {
    return json_({ success: false, message: "No users to save." });
  }

  /* Guard against locking everyone out: at least one account must keep
     publish rights. */
  const anyPublisher = incoming.some(function (u) {
    return u.canPublish === true;
  });
  if (!anyPublisher) {
    return json_({
      success: false,
      message: "At least one account must keep publish rights.",
    });
  }

  const sheet = sheet_(SHEET_USERS);
  const existing = rowsToObjects_(sheet);
  const seenBefore = {};
  existing.forEach(function (u) {
    seenBefore[String(u.id)] = u.lastSeen || "";
  });

  sheet.clear();
  sheet.appendRow([
    "id", "username", "password", "name",
    "role", "region", "canPublish", "lastSeen",
  ]);

  incoming.forEach(function (u) {
    const id = String(u.id || "").trim() ||
      "USR-" + Date.now() + "-" + Math.random().toString(36).slice(2, 6);
    sheet.appendRow([
      id,
      String(u.username || "").trim(),
      String(u.password || ""),
      String(u.name || "").trim(),
      String(u.role || "").trim(),
      String(u.region || "").trim(),
      u.canPublish === true,
      seenBefore[id] || "",
    ]);
  });

  return json_({ success: true });
}

// ─── Prizes ──────────────────────────────────────────────────────────

/* A number that may have been stored as a Date by Sheets' autoformatting.
   Converts back via the 1899-12-30 epoch rather than silently reading 0. */
function readNumber_(value, fallback) {
  if (value === "" || value === null || value === undefined) return fallback;
  if (value instanceof Date) {
    const epoch = new Date(1899, 11, 30);
    return Math.round((value - epoch) / 86400000);
  }
  const n = Number(value);
  return isNaN(n) ? fallback : n;
}

function handleGetPrizes_(e) {
  const prizes = rowsToObjects_(sheet_(SHEET_PRIZES)).map((p) => ({
    name: p.name,
    qty: Number(p.qty) || 0,
    active: String(p.active).toLowerCase() !== "false",
    tier: p.tier === "main" ? "main" : "regular",
    weight: readNumber_(p.weight, 1),
  }));
  return json_({ success: true, prizes: prizes });
}

function handleSavePrizes_(payload) {
  const auth = authorisePublish_(payload);
  if (!auth.ok) return json_({ success: false, message: auth.message });

  const sheet = sheet_(SHEET_PRIZES);
  sheet.clear();
  sheet.appendRow(["name", "qty", "active", "tier", "weight", "updatedAt"]);

  /* Sheets will happily reinterpret a plain number typed into this column
     as a date (0 becomes 31/12/1899). Forcing the qty and weight columns
     to a plain number format stops that, so the values survive a round
     trip through the spreadsheet. */
  sheet.getRange("B:B").setNumberFormat("0");
  sheet.getRange("E:E").setNumberFormat("0");

  const now = new Date();
  (payload.prizes || []).forEach((p) => {
    sheet.appendRow([
      p.name,
      p.qty,
      p.active !== false,
      p.tier === "main" ? "main" : "regular",
      p.weight === undefined ? 1 : Math.max(0, Number(p.weight) || 0),
      now,
    ]);
  });

  return json_({ success: true });
}

// ─── Manager dashboard stats ─────────────────────────────────────────

/* Aggregates for one region. A user's region comes from the "region"
   column on the Users sheet; BAs and their manager share the value.
   A manager with no region set sees every region. */
function handleManagerStats_(e) {
  const region = String(e.parameter.region || "").trim();
  const from = String(e.parameter.from || "").trim(); // YYYY-MM-DD inclusive
  const to = String(e.parameter.to || "").trim();     // YYYY-MM-DD inclusive
  const LIVE_WINDOW_MIN = 15;

  const users = rowsToObjects_(sheet_(SHEET_USERS));
  const inRegion = (u) =>
    !region || String(u.region || "").trim().toLowerCase() === region.toLowerCase();

  const bas = users.filter(
    (u) => inRegion(u) && String(u.role || "").trim().toLowerCase() !== "manager"
  );
  const baIds = {};
  bas.forEach((b) => (baIds[String(b.id)] = b));

  const now = new Date();
  const liveBAs = bas.filter((b) => {
    if (!b.lastSeen) return false;
    const seen = b.lastSeen instanceof Date ? b.lastSeen : new Date(b.lastSeen);
    if (isNaN(seen)) return false;
    return (now - seen) / 60000 <= LIVE_WINDOW_MIN;
  });

  const mine = (row) => !region || baIds[String(row.baId)];

  /* Date filter is inclusive on both ends. An empty from/to means
     unbounded on that side, so no params at all gives all time. */
  const inRange = (row, dateField) => {
    const d = isoDate_(row[dateField || "date"]);
    if (!d) return false;
    if (from && d < from) return false;
    if (to && d > to) return false;
    return true;
  };

  const allSpins = rowsToObjects_(sheet_(SHEET_SPINS)).filter(mine);
  const allWinners = rowsToObjects_(sheet_(SHEET_WINNERS)).filter(mine);
  const allOutlets = rowsToObjects_(sheet_(SHEET_OUTLETS)).filter(
    (o) => !region || baIds[String(o.baId)]
  );

  const spins = allSpins.filter((r) => inRange(r));
  const winners = allWinners.filter((r) => inRange(r));
  const outlets = allOutlets.filter((r) => inRange(r, "createdAt"));

  const mainWins = winners.filter((w) => String(w.tier) === "main");
  const regularWins = winners.filter((w) => String(w.tier) !== "main");

  /* Per-BA breakdown for the selected period, best performer first. */
  const byBA = {};
  spins.forEach((s) => {
    const key = String(s.baId || "");
    if (!byBA[key]) byBA[key] = { reached: 0, wins: 0 };
    byBA[key].reached += 1;
  });
  winners.forEach((w) => {
    const key = String(w.baId || "");
    if (!byBA[key]) byBA[key] = { reached: 0, wins: 0 };
    byBA[key].wins += 1;
  });

  const baBreakdown = Object.keys(byBA)
    .map((key) => {
      const u = baIds[key];
      return {
        id: key,
        name: u ? u.name || u.username : "Unknown",
        reached: byBA[key].reached,
        wins: byBA[key].wins,
      };
    })
    .sort((a, b) => b.reached - a.reached)
    .slice(0, 10);

  return json_({
    success: true,
    stats: {
      region: region || "All regions",
      from: from,
      to: to,

      // Always "right now", never affected by the date filter.
      liveBAs: liveBAs.length,
      totalBAs: bas.length,
      liveBAList: liveBAs.map((b) => ({ name: b.name || b.username, id: b.id })),

      // Scoped to the selected period.
      peopleReached: spins.length,
      mainPrizeWins: mainWins.length,
      regularPrizeWins: regularWins.length,
      outlets: outlets.length,
      baBreakdown: baBreakdown,

      // All-time totals, for context alongside the period figures.
      peopleReachedAllTime: allSpins.length,
      mainPrizeWinsAllTime: allWinners.filter((w) => String(w.tier) === "main").length,
      regularPrizeWinsAllTime: allWinners.filter((w) => String(w.tier) !== "main").length,
      outletsAllTime: allOutlets.length,
    },
  });
}

// ─── Daily PDF report ────────────────────────────────────────────────

function handleDailyPDF_(e) {
  const deviceId = String(e.parameter.deviceId || "");
  const date = String(e.parameter.date || "");

  const outlets = rowsToObjects_(sheet_(SHEET_OUTLETS)).filter(
    (o) => String(o.deviceId) === deviceId && isoDate_(o.createdAt) === date
  );
  const outletIds = outlets.map((o) => o.id);

  const winners = rowsToObjects_(sheet_(SHEET_WINNERS)).filter(
    (w) => outletIds.indexOf(w.outletId) !== -1 && isoDate_(w.date) === date
  );

  let html = "<h2>Feta Wheel — Daily report</h2><p>" + date + "</p>";
  html += "<h3>Outlets visited (" + outlets.length + ")</h3><ul>";
  outlets.forEach((o) => (html += "<li>" + o.name + " — " + o.city + "</li>"));
  html += "</ul>";
  html += "<h3>Winners registered (" + winners.length + ")</h3><ul>";
  winners.forEach(
    (w) => (html += "<li>" + w.fullName + " — " + w.prize + " (" + w.outletName + ")</li>")
  );
  html += "</ul>";

  const blob = Utilities.newBlob(html, "text/html").getAs("application/pdf");
  const base64 = Utilities.base64Encode(blob.getBytes());

  return json_({ success: true, pdf: base64 });
}

function isoDate_(value) {
  if (!value) return "";
  const d = value instanceof Date ? value : new Date(value);
  if (isNaN(d)) return "";
  return d.toISOString().split("T")[0];
}

// ─── Sheets menu (so setup can be run with one click, no dropdown needed) ──

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("Feta Wheel")
    .addItem("Run setup (first time only)", "setupAllSheets")
    .addToUi();
}

// ─── One-time setup ──────────────────────────────────────────────────

function setupAllSheets() {
  const ss = ss_();

  createSheetIfMissing_(ss, SHEET_USERS, ["id", "username", "password", "name", "role", "region", "canPublish", "lastSeen"]);
  createSheetIfMissing_(ss, SHEET_OUTLETS, [
    "id", "baId", "deviceId", "name", "address", "city",
    "latitude", "longitude", "photoUrl", "createdAt",
  ]);
  createSheetIfMissing_(ss, SHEET_WINNERS, [
    "id", "outletId", "outletName", "prize", "tier", "baId", "fullName",
    "phone", "age", "gender", "date",
  ]);
  createSheetIfMissing_(ss, SHEET_SPINS, [
    "id", "outletId", "baId", "prize", "outcome", "date",
  ]);
  createSheetIfMissing_(ss, SHEET_PRIZES, ["name", "qty", "active", "tier", "weight", "updatedAt"]);
  createSheetIfMissing_(ss, SHEET_SETTINGS, ["key", "value"]);
  createSheetIfMissing_(ss, SHEET_CITIES, ["name", "active", "updatedAt"]);

  seedUsersIfEmpty_();
  seedPrizesIfEmpty_();
  seedSettingsIfEmpty_();
  seedCitiesIfEmpty_();

  Logger.log("Setup complete.");
}

function createSheetIfMissing_(ss, name, headers) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
    return sheet;
  }

  /* Sheet already exists with data. Append any headers it's missing —
     existing rows keep their values, new columns start blank — so an
     upgrade never requires hand-editing the spreadsheet. */
  const existing = sheet
    .getRange(1, 1, 1, sheet.getLastColumn())
    .getValues()[0]
    .map(function (h) {
      return String(h).trim();
    });

  const missing = headers.filter(function (h) {
    return existing.indexOf(h) === -1;
  });

  if (missing.length) {
    sheet
      .getRange(1, existing.length + 1, 1, missing.length)
      .setValues([missing]);
  }

  return sheet;
}

function seedUsersIfEmpty_() {
  const sheet = sheet_(SHEET_USERS);
  if (sheet.getLastRow() > 1) return; // already has users

  appendByHeader_(sheet, {
    id: "BA-001", username: "ba1", password: "B0lCMVyZfL",
    name: "Field BA", role: "", region: "", canPublish: false,
  });
  appendByHeader_(sheet, {
    id: "ADM-001", username: "admin1", password: "2fWlxb79Ig",
    name: "Admin", role: "admin", region: "", canPublish: true,
  });
}

function seedSettingsIfEmpty_() {
  const sheet = sheet_(SHEET_SETTINGS);
  if (sheet.getLastRow() > 1) return;

  sheet.appendRow(["winMessage", "Congratulations! You've won {prize} 🎉"]);
}

function seedCitiesIfEmpty_() {
  const sheet = sheet_(SHEET_CITIES);
  if (sheet.getLastRow() > 1) return;

  const now = new Date();
  [
    "Addis Ababa", "Dire Dawa", "Bahir Dar", "Hawassa", "Mekelle",
    "Gondar", "Jimma", "Adama", "Dessie", "Jijiga",
    "Shashamane", "Hosaena", "Arba Minch", "Harar",
  ].forEach(function (name) {
    sheet.appendRow([name, true, now]);
  });
}

function seedPrizesIfEmpty_() {
  const sheet = sheet_(SHEET_PRIZES);
  if (sheet.getLastRow() > 1) return;

  // [name, qty, active, tier] — tier is "regular" (common, high odds) or
  // "main" (rare, low odds, gets the full name+phone winner registration).
  // [name, qty, active, tier, weight] — weight is the relative chance.
  const fallback = [
    ["Keychain", 10, true, "regular", 20],
    ["1 Bottle", 10, true, "regular", 20],
    ["2 Bottles", 5, true, "regular", 10],
    ["3 Bottles", 3, true, "regular", 5],
    ["Cap", 5, true, "regular", 10],
    ["Bottle Opener", 10, true, "regular", 20],
    ["Umbrella", 3, true, "regular", 5],
    ["Glass", 5, true, "regular", 10],
    ["T-Shirt", 1, true, "main", 1],
  ];
  const now = new Date();
  fallback.forEach((p) => sheet.appendRow([p[0], p[1], p[2], p[3], p[4], now]));
}
