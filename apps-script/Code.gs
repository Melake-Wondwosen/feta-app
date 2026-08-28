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
    if (action === "getSettings") return handleGetSettings_(e);
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
    if (payload.action === "saveSettings") return handleSaveSettings_(payload);

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
  const sheet = sheet_(SHEET_OUTLETS);
  const id = "OUT-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8);

  let photoUrl = "";
  if (payload.photo) {
    photoUrl = savePhotoToDrive_(payload.photo, id);
  }

  sheet.appendRow([
    id,
    payload.baId || "",
    payload.deviceId || "",
    payload.name || "",
    payload.address || "",
    payload.city || "",
    payload.latitude || "",
    payload.longitude || "",
    photoUrl,
    new Date(),
  ]);

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

function handleAddWinner_(payload) {
  const sheet = sheet_(SHEET_WINNERS);
  const id = "WIN-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8);

  sheet.appendRow([
    id,
    payload.outletId || "",
    payload.outletName || "",
    payload.prize || "",
    payload.fullName || "",
    payload.phone || "",
    payload.age || "",
    payload.gender || "",
    payload.date || new Date().toISOString(),
  ]);

  return json_({ success: true, id: id });
}

// ─── Settings (editable text, e.g. the winner congratulations message) ──

function handleGetSettings_(e) {
  const rows = rowsToObjects_(sheet_(SHEET_SETTINGS));
  const settings = {};
  rows.forEach((r) => (settings[r.key] = r.value));
  return json_({ success: true, settings: settings });
}

function handleSaveSettings_(payload) {
  const adminKey = PropertiesService.getScriptProperties().getProperty("ADMIN_KEY");
  if (!adminKey || payload.adminKey !== adminKey) {
    return json_({ success: false, message: "Wrong admin key." });
  }

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

// ─── Prizes ──────────────────────────────────────────────────────────

function handleGetPrizes_(e) {
  const prizes = rowsToObjects_(sheet_(SHEET_PRIZES)).map((p) => ({
    name: p.name,
    qty: Number(p.qty) || 0,
    active: String(p.active).toLowerCase() !== "false",
    tier: p.tier === "main" ? "main" : "regular",
  }));
  return json_({ success: true, prizes: prizes });
}

function handleSavePrizes_(payload) {
  const adminKey = PropertiesService.getScriptProperties().getProperty("ADMIN_KEY");
  if (!adminKey || payload.adminKey !== adminKey) {
    return json_({ success: false, message: "Wrong admin key." });
  }

  const sheet = sheet_(SHEET_PRIZES);
  sheet.clear();
  sheet.appendRow(["name", "qty", "active", "tier", "updatedAt"]);

  const now = new Date();
  (payload.prizes || []).forEach((p) => {
    sheet.appendRow([p.name, p.qty, p.active !== false, p.tier === "main" ? "main" : "regular", now]);
  });

  return json_({ success: true });
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

  createSheetIfMissing_(ss, SHEET_USERS, ["id", "username", "password", "name", "role"]);
  createSheetIfMissing_(ss, SHEET_OUTLETS, [
    "id", "baId", "deviceId", "name", "address", "city",
    "latitude", "longitude", "photoUrl", "createdAt",
  ]);
  createSheetIfMissing_(ss, SHEET_WINNERS, [
    "id", "outletId", "outletName", "prize", "fullName",
    "phone", "age", "gender", "date",
  ]);
  createSheetIfMissing_(ss, SHEET_PRIZES, ["name", "qty", "active", "tier", "updatedAt"]);
  createSheetIfMissing_(ss, SHEET_SETTINGS, ["key", "value"]);

  seedUsersIfEmpty_();
  seedPrizesIfEmpty_();
  seedSettingsIfEmpty_();

  Logger.log("Setup complete.");
}

function createSheetIfMissing_(ss, name, headers) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
  }
  return sheet;
}

function seedUsersIfEmpty_() {
  const sheet = sheet_(SHEET_USERS);
  if (sheet.getLastRow() > 1) return; // already has users

  sheet.appendRow(["BA-001", "ba1", "B0lCMVyZfL", "Field BA", ""]);
  sheet.appendRow(["ADM-001", "admin1", "2fWlxb79Ig", "Admin", "admin"]);
}

function seedSettingsIfEmpty_() {
  const sheet = sheet_(SHEET_SETTINGS);
  if (sheet.getLastRow() > 1) return;

  sheet.appendRow(["winMessage", "Congratulations! You've won {prize} 🎉"]);
}

function seedPrizesIfEmpty_() {
  const sheet = sheet_(SHEET_PRIZES);
  if (sheet.getLastRow() > 1) return;

  // [name, qty, active, tier] — tier is "regular" (common, high odds) or
  // "main" (rare, low odds, gets the full name+phone winner registration).
  const fallback = [
    ["Keychain", 10, true, "regular"],
    ["1 Bottle", 10, true, "regular"],
    ["2 Bottles", 5, true, "regular"],
    ["3 Bottles", 3, true, "regular"],
    ["Cap", 5, true, "regular"],
    ["Bottle Opener", 10, true, "regular"],
    ["Umbrella", 3, true, "regular"],
    ["Glass", 5, true, "regular"],
    ["T-Shirt", 1, true, "main"],
  ];
  const now = new Date();
  fallback.forEach((p) => sheet.appendRow([p[0], p[1], p[2], p[3], now]));
}
