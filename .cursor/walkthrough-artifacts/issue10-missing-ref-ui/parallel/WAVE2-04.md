# WAVE2-04 — COOK extras (implementer)

File `FHbikS2jILAeMv8mote0vD` · page `Cookapp · Recording Reproduction`  
Skill `figma-use` only. Did **not** call `get_design_context`, `resetOverrides`, `createImageAsync`. Did **not** edit Bottom NAV `77:237`, header set `127:10295`, **04c** `402:9340`, or 04 main `116:8908`.

Stills (ignore status bar / Dynamic Island / keyboard):

- 04b ← `docs/ui-screenshots/missing-ref/04/IMG_4405.PNG`
- 04d ← `docs/ui-screenshots/missing-ref/04/IMG_4407.PNG`

## Frames (x/y locked)

| Frame | Node | Canvas | Size |
|---|---|---|---|
| 04b · Timers | `402:9328` | **x=18128 y=168** | 440×956 |
| 04d · Cooking Step 2/21 | `402:9387` | **x=19408 y=168** | 440×956 |

04d still is one viewport (same as 04 / IMG_4404). **Did not grow height**; y stayed 168.

## PixelBase

| Frame | PixelBase | After |
|---|---|---|
| 04b | `458:3820` | **hidden**, `layoutPositioning=ABSOLUTE` at 0,0 (out of flow) |
| 04d | `458:3822` | **hidden**, same |

## Unhide / reconstruct

Existing vector sheet/hero layers unhidden (were `visible=false` and stacked under PixelBase):

**04b**

- Hero Photo `402:9329` visible, 440×160 (stew peek)
- Timers Sheet `402:9330` visible, y=120, 440×836, top radii 40
- Glass **+** `Add · default` `402:9332` (blur + hairline); plus glyph in `402:9333`
- Green **Timers** 34pt
- Centered **No active timers**

**04d**

- Hero Photo `402:9388` visible, 160h peek
- Cooking Sheet `402:9389` visible, y=120, 440×836, top radii 40
- Dual capsule list+timer (glass), voice circle (glass + waveform/red mic), green **2/21**
- Green title `Beef Bourguignon (Beef…)`
- Body FILL + centered instruction; range fills **beef** / **carrots** brand green `{r:0,g:0.741,b:0.337}`
- Wrap locked to still:  
  `Strain liquid into a bowl,` / `reserve marinade. Separate` / `the beef, carrots and onion.`
- Footer **Back** (default grey/white) · **Next** (solid brand green) — not Say Close/Next

List glyph was a hamburger leftover; replaced with two-row checklist SVG to match IMG_4407 / 04 chrome. Voice rebuilt as waveform + red mic. **Did not clone/edit** `116:8908`.

## Out of scope (untouched)

- 04c `402:9340` / PixelBase `458:3821`
- 04 source component `116:8908` / instance `116:18290`
- NAV `77:237`, header `127:10295`

## Verify

Live `.screenshot()` of `402:9328` and `402:9387` after unroll (contentsOnly). Side-by-side vs 4405/4407: peek + sheet radius, empty timers copy, 2/21, green phrase fills, Back/Next. Chrome is glass on controls only; sheet body opaque white.
