/* ============================================================
   FETA — central prize list
   Paste these into your existing Apps Script project, then wire
   the two lines marked ADD ME into your doGet and doPost.
   ============================================================ */

var PRIZE_SHEET = 'Prizes';

/* ---------- one-time setup ----------
   Run createPrizeSheet() once from the Apps Script editor.
   Then set your admin key:
     Project Settings → Script Properties → Add
     Property: ADMIN_KEY     Value: <pick a long random string>
   That value is what you type into the Admin key box in the app.
   Do not put the key in this file — script properties keep it out
   of the code and out of version control.
------------------------------------- */

function createPrizeSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(PRIZE_SHEET);

  if (!sh) {
    sh = ss.insertSheet(PRIZE_SHEET);
  }

  sh.clear();
  sh.getRange(1, 1, 1, 4).setValues([['name', 'qty', 'active', 'updatedAt']]);
  sh.getRange(1, 1, 1, 4).setFontWeight('bold');
  sh.setFrozenRows(1);

  var seed = [
    ['Keychain', 10, true, ''],
    ['1 Bottle', 10, true, ''],
    ['2 Bottles', 5, true, ''],
    ['T-Shirt', 5, true, ''],
    ['Cap', 5, true, ''],
    ['Bottle Opener', 10, true, ''],
    ['Umbrella', 3, true, ''],
    ['Glass', 5, true, '']
  ];
  sh.getRange(2, 1, seed.length, 4).setValues(seed);

  return 'Prizes sheet ready.';
}

/* ---------- read ---------- */

function getPrizesResponse() {
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(PRIZE_SHEET);

  if (!sh) {
    return jsonOut({
      success: false,
      message: 'No Prizes sheet. Run createPrizeSheet() once.'
    });
  }

  var last = sh.getLastRow();
  var prizes = [];

  if (last > 1) {
    var rows = sh.getRange(2, 1, last - 1, 4).getValues();
    for (var i = 0; i < rows.length; i++) {
      var name = String(rows[i][0]).trim();
      if (!name) continue;
      prizes.push({
        name: name,
        qty: Number(rows[i][1]) || 0,
        active: rows[i][2] !== false && String(rows[i][2]).toLowerCase() !== 'false'
      });
    }
  }

  return jsonOut({ success: true, prizes: prizes });
}

/* ---------- write ---------- */

function savePrizesResponse(payload) {
  var expected = PropertiesService.getScriptProperties().getProperty('ADMIN_KEY');

  if (!expected) {
    return jsonOut({
      success: false,
      message: 'ADMIN_KEY is not set in Script Properties.'
    });
  }

  if (String(payload.adminKey || '') !== expected) {
    return jsonOut({ success: false, message: 'That admin key is not correct.' });
  }

  var prizes = payload.prizes;
  if (!prizes || !prizes.length) {
    return jsonOut({ success: false, message: 'The list was empty.' });
  }

  /* One writer at a time, so two admins saving together can't
     interleave and leave a half-written list. */
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
  } catch (e) {
    return jsonOut({
      success: false,
      message: 'Someone else is saving right now. Try again in a moment.'
    });
  }

  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sh = ss.getSheetByName(PRIZE_SHEET);
    if (!sh) sh = ss.insertSheet(PRIZE_SHEET);

    var stamp = new Date().toISOString();
    var rows = prizes.map(function (p) {
      return [
        String(p.name).trim(),
        Number(p.qty) || 0,
        p.active !== false,
        stamp
      ];
    });

    sh.clear();
    sh.getRange(1, 1, 1, 4).setValues([['name', 'qty', 'active', 'updatedAt']]);
    sh.getRange(1, 1, 1, 4).setFontWeight('bold');
    sh.setFrozenRows(1);
    sh.getRange(2, 1, rows.length, 4).setValues(rows);
    SpreadsheetApp.flush();

    return jsonOut({ success: true, saved: rows.length, updatedAt: stamp });
  } catch (err) {
    return jsonOut({ success: false, message: String(err) });
  } finally {
    lock.releaseLock();
  }
}

/* ---------- helper ---------- */

function jsonOut(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/* ============================================================
   WIRING

   In your existing doGet, alongside the other actions:

     if (action === 'getPrizes') {            // ADD ME
       return getPrizesResponse();
     }

   In your existing doPost, after you parse the body:

     var payload = JSON.parse(e.postData.contents);
     if (payload.action === 'savePrizes') {   // ADD ME
       return savePrizesResponse(payload);
     }

   Then Deploy → Manage deployments → edit → New version.
   Apps Script serves the old code until you publish a new version,
   so skipping this step is why a change appears to do nothing.
   ============================================================ */
