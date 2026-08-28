# Feta rebrand — where each file goes

Open `feta-design-preview.html` in a browser first to see the four screens.

## 1. Copy files

| From this folder | Into your project |
|---|---|
| `src/index.css` | `src/index.css` (replace) |
| `src/brand/FetaBrand.jsx` | `src/brand/FetaBrand.jsx` (new folder) |
| `src/pages/*.jsx` | `src/pages/` (replace all seven) |
| `src/assets/*.png` | `src/assets/` |
| `index.html` | project root (replace) |
| `public/manifest.json` | `public/` (replace) |
| `public/icon-*.png`, `apple-touch-icon.png`, `favicon-32.png` | `public/` (replace the Habesha ones) |

## 2. Delete the old Habesha assets

- `src/assets/21+Logo - Habesha - Horizontal.png`
- `src/assets/21+Logo - Habesha - Vertical.png`
- `src/assets/Gemini_Generated_Image_hngu6uhngu6uhngu.png`
- `src/assets/pattern_background.png`

## 3. Run it

No new dependencies. `npm run dev`.

---

# Asset provenance

Everything now comes from the files you supplied.

| File | Source |
|---|---|
| `feta-logo-lockup.png` | your uploaded transparent PNG, cropped and scaled to 900px |
| `feta-mark.png` | wordmark from the brand sheet, red removed with a soft alpha so the letter counters knock out cleanly on any background |
| `feta-pattern.png` | your uploaded pattern artwork, unmodified |
| `feta-pattern-white.png` | same artwork with the red dropped, so it can sit on any surface |
| `icon-*.png` | generated: Feta red ground, gold sunburst, the wordmark centred |

## Correction to the tibeb pattern

The first pass drew the weave as white chevrons on red. That was wrong. In your
artwork the band is a **solid cream field with the chevron and triangle motif cut
into it in red** — the inverse. `TibebBand` is now traced from measured
proportions of the supplied pattern: a double chevron line, a down-pointing
triangle nested in each trough, and up-pointing triangles below each peak, at a
44:43 pitch-to-height ratio.

The component takes `ground` and `line` rather than a single `color`:

```jsx
<TibebBand height={17} />
<TibebBand height={18} ground={FETA.amber} line={FETA.redDeep} />
<TibebBand height={20} ground={FETA.red} line={FETA.cream} flip />
```

Two companions ship alongside it:

- `<TibebDashes />` — the dashed row that separates the woven bands
- `<TibebField />` — your pattern artwork itself as a large background texture,
  used behind the Start screen hero. Not a redraw.

---

# Palette

Sampled from the artwork, not eyeballed.

| Token | Hex | Source |
|---|---|---|
| `--feta-red` | `#B4222C` | master logo field |
| `--feta-red-deep` | `#7C1319` | derived depth tone |
| `--feta-red-dark` | `#480A0E` | derived, darkest surface |
| `--feta-gold` | `#B78B32` | wordmark outline + sunburst rays |
| `--feta-amber` | `#FBB15C` | illustration warm tone |
| `--feta-cream` | `#FFF4E4` | wordmark fill |
| `--feta-ink` | `#17110F` | wordmark keyline |
| `--feta-silver` | `#9A9A9A` | apron artwork |

Available as CSS variables and Tailwind utilities (`bg-feta-red`, `text-feta-amber`) via the `@theme` block.

# The signature device

The FETA wordmark is drawn as **white fill → gold ring → ink ring → offset red
shadow**. That construction is a reusable class, so every card, button and the
wheel rim are built from the same material as the logo.

- `.feta-lockup` — full weight, for buttons and hero cards
- `.feta-lockup-sm` — lighter, for list rows
- `.feta-lockup-flat` — rings only, no drop shadow
- `.feta-press` — the surface sinks into its own shadow when tapped

# Components (`src/brand/FetaBrand.jsx`)

`Screen`, `Sunburst`, `TibebBand`, `TibebDashes`, `TibebField`, `FetaMark`,
`FetaLockup`, `FetaButton`, `SectionLabel`, and `FETA` (the palette as a JS
object, for canvas and inline styles).

Wrap any new page in `<Screen>` and it inherits the red ground, sunburst and
woven trim.

# Typography

Archivo Black for display, Archivo for body, Noto Sans Ethiopic so the Amharic
renders properly on BA phones. Loaded from Google Fonts in `index.html`.

# Screens

- **Start** — the full artwork is the hero, ከጓደኛ ጋር beneath it, your pattern
  sheet washed in behind. "Golden Wheel" became "Feta Wheel".
- **Login** — cream form panel with a red tibeb band across its head.
- **Home** — outlet rows are cream cards with the lockup keyline.
- **Add outlet** — camera target is a full lockup panel.
- **Campaign setup** — prize buttons show a ✓ and turn amber once selected.
- **Spin** — segments cycle cream / red / gold / ink / amber / deep red so no two
  neighbours match. Rim is ink → gold → cream with tick marks. Hub reads ፈታ.
- **Winner** — the prize is the headline, in the layered logo shadow treatment.

# Logic

Untouched. All Apps Script calls, the offline outlet queue, image compression,
device ID handling and the spin/prize-decrement maths are exactly as they were.

# Accessibility

`prefers-reduced-motion` stops the rotating rays and transitions. Inputs are 16px
so iOS doesn't zoom on focus. Amber focus rings on every interactive element.

---

# Wheel corrections

**Emoji removed.** They rendered differently on every Android build, sat at odd
angles, and collided with the prize names. Prize labels now stand alone.

**Labels run along the radius.** Each one reads outward from the hub. Labels
that would land on the left half get rotated a further 180° and anchored from
the opposite end, so nothing is ever upside down. Long names such as "Bottle
opener" wrap to two lines; anything that still won't fit is truncated with an
ellipsis rather than overflowing its slice. Type size scales with how wide the
slice actually is, so a two-unit slice gets small-but-legible text instead of
overlapping its neighbours.

**The hub carries the real logo.** It was Amharic text set in a webfont, which
is not the wordmark. The Feta mark now sits there as an image element layered
over the canvas, so it stays sharp at any wheel size. The canvas hub grew from
`r * 0.2` to `r * 0.26` to give it room, and the HTML button that overlays it
was resized to match.

---

# Blank wheel fix

If the wheel renders as empty red with only the hub and pointer showing, this
is the cause and it is fixed in this version.

The canvas had `width={wheelSize} height={wheelSize}` as React attributes.
Assigning either of those to a canvas **wipes its contents**, so any re-render
that touched the size could blank the wheel after the draw had already run,
with no error in the console. On mount the wheel size is measured from the
viewport, so the size changes once immediately — a race the drawing sometimes
lost.

Three changes:

- The backing store is now sized inside `drawWheel` rather than by React, so
  nothing else can clear it.
- Drawing moved to `useLayoutEffect` with a `requestAnimationFrame` second pass,
  covering a canvas that has only just attached or a viewport that settled after
  mobile browser chrome resized.
- The canvas is scaled by `devicePixelRatio`, with CSS size held separately.
  On a 3× phone the backing store is now 1140px for a 380px wheel, so the
  labels and rim are sharp instead of soft.

---

# If the wheel is still blank

This version can no longer fail silently. After replacing
`src/pages/SpinWheelPage.jsx` and hard-reloading, you will see one of three
things, and each tells us the cause:

**A cream wheel reading "No prizes loaded", with a "Set up the campaign" link.**
The canvas is working. The problem is that `localStorage` has a
`campaign_<outletId>` entry that parses to an empty array — so the campaign was
never saved, or was saved against a different outlet id. Tap the link, add
prizes, and it will draw.

**A dark banner reading "Wheel couldn't draw: …".** The drawing threw. The
message on screen is the actual error, and the full stack is in the console.
Send me that line.

**Nothing at all — still empty red.** Then `drawWheel` is not running, which
means the file wasn't replaced or the dev server is serving a cached build.
Stop the server, delete `node_modules/.vite`, and start it again.

To check the stored campaign directly, open the browser console on the spin
screen and run:

```js
Object.keys(localStorage).filter(k => k.startsWith('campaign_'))
  .forEach(k => console.log(k, localStorage.getItem(k)));
```
