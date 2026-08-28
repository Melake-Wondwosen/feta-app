# Setting up the new backend

The old Apps Script deployment (`AKfycbwWZ...`) is no longer reachable/known,
so this is a fresh one. `apps-script/Code.gs` implements every action the app
calls: login, outlets, winners, prizes, and the daily PDF report.

## 1. Create the Sheet + Script

1. Go to sheets.google.com → Blank spreadsheet. Name it "Feta Wheel Data".
2. Extensions → Apps Script.
3. Delete the placeholder code, paste in everything from `apps-script/Code.gs`.
4. Save (Ctrl/Cmd+S).

## 2. Run setup once

1. In the function dropdown at the top, select `setupAllSheets`.
2. Click Run. The first time, Google will ask you to authorize — click
   through (Advanced → Go to project (unsafe) is expected for your own
   script).
3. This creates four tabs — Users, Outlets, Winners, Prizes — and seeds:

   | Role | Username | Password |
   |---|---|---|
   | BA | `ba1` | `B0lCMVyZfL` |
   | Admin | `admin1` | `2fWlxb79Ig` |

   Change these later by editing the Users sheet directly, or add more rows
   for real BAs. `role` must be exactly `admin` (blank for regular BAs) —
   that's what `AdminRoute.jsx` checks.

## 3. Set the admin key

Project Settings (gear icon) → Script Properties → Add property:

| Property | Value |
|---|---|
| `ADMIN_KEY` | any long random string you choose |

This is what the "Wheel prizes" admin screen will ask for when saving —
keep it separate from any user's password.

## 4. Deploy

Deploy → New deployment → gear icon → Web app.
- Execute as: **Me**
- Who has access: **Anyone**

Click Deploy, authorize again if asked, then copy the URL ending in `/exec`.

## 5. Point the app at it

Open `src/config.js` and replace the placeholder with that URL:

```js
export const API_URL = "https://script.google.com/macros/s/XXXXX/exec";
```

That's the only file that needs it now — every page and service imports
from here.

## 6. Redeploy the frontend

Commit and push; Vercel rebuilds automatically. Log in with `admin1` /
`2fWlxb79Ig` or `ba1` / `B0lCMVyZfL`.

## Whenever you edit Code.gs again

Deploy → Manage deployments → pencil icon → New version → Deploy. Apps
Script keeps serving the old code until you do this.
