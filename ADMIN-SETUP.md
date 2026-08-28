# Admin control of the wheel prizes

One account edits a master prize list. Every BA's app reads that list, so
changing it changes what they see — without shipping a new build.

## Why the backend has to change

Right now the prize list lives in each phone's `localStorage`. That store is
private to one browser on one device. Nothing you save on your phone can reach
a BA's phone, no matter how the app is written. For a shared list, the list has
to live somewhere both phones can read — your Google Sheet.

So this feature is roughly half frontend, half a small addition to your Apps
Script. Both halves are needed; the app alone won't do it.

---

## Step 1 — Add the sheet and the two endpoints

Open your Apps Script project and paste in everything from
`apps-script/prizes.gs`.

**Run `createPrizeSheet()` once** from the editor. It adds a `Prizes` sheet with
columns `name`, `qty`, `active`, `updatedAt`, seeded with the eight prizes the
app shipped with.

**Set your admin key.** Project Settings → Script Properties → Add:

| Property | Value |
|---|---|
| `ADMIN_KEY` | a long random string you choose |

That string is what you'll type into the Admin key box in the app. Keep it in
Script Properties rather than in the code — your web app URL is public, so
without a key check anyone who found the URL could rewrite your prize list.

**Wire the two actions.** In `doGet`, alongside your existing actions:

```js
if (action === 'getPrizes') {
  return getPrizesResponse();
}
```

In `doPost`, after you parse the body:

```js
var payload = JSON.parse(e.postData.contents);
if (payload.action === 'savePrizes') {
  return savePrizesResponse(payload);
}
```

**Deploy a new version.** Deploy → Manage deployments → edit → New version.
Apps Script keeps serving the old code until you publish, which is the usual
reason a change seems to do nothing.

## Step 2 — Mark your admin account

Add a `role` column to your Users sheet and put `admin` in it for the one
account that manages the wheel. Leave it blank for everyone else.

Your login endpoint must return that field on the user object, so the app can
see it. If your `login` action builds the user by hand, add `role` to it.

Anyone without `role: "admin"` who types `/admin/prizes` into the address bar is
sent back to the outlets screen.

## Step 3 — Copy the app files

| File | Where |
|---|---|
| `src/services/prizeService.js` | new |
| `src/components/AdminRoute.jsx` | new |
| `src/pages/AdminPrizesPage.jsx` | new |
| `src/routes/AppRoutes.jsx` | replace |
| `src/pages/HomePage.jsx` | replace |
| `src/pages/CampaignSetupPage.jsx` | replace |

---

## How it behaves

**You** log in and see a "Wheel prizes" card on the outlets screen that BAs
don't get. It opens an editor where you can rename prizes, set default stock,
reorder them, switch one off without deleting it, add new ones, and delete.
Saving asks for the admin key, which is remembered for the session only.

**BAs** get the list when they open a campaign setup screen. Their phone caches
the last list it downloaded, so setup still works with no signal — the screen
says so when it's showing a cached copy.

## The one thing to know about timing

Changes reach a BA the **next time they open a campaign setup screen**. A
campaign that is already running keeps the stock it was created with.

That's deliberate. A BA halfway through an activation has physical prizes in a
bag and a count that must match. Rewriting their remaining stock from the server
mid-session would put the app out of step with the box in front of them. So the
central list controls what goes *onto* a wheel, not what's already on one.

If you'd rather a save also force-refresh live campaigns, that's a different
design and worth talking through — it needs a rule for what happens to stock
already handed out.

## Where "active" fits

Switching a prize off hides it from BAs without losing its default stock or its
place in the order. Use it for seasonal items rather than deleting and retyping.

## What is not protected

The admin key guards writing. Reading the prize list is open, as the whole BA
app is — the same is already true of your outlets and winners endpoints. If you
want reads locked down too, that's a broader change to how every call
authenticates, and worth doing as its own piece of work.
