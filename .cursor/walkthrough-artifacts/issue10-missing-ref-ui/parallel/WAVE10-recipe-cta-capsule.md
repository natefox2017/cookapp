# WAVE10 — Recipe Detail Start Cooking + CartCalendar glass lock

Owner feedback (Issue #10): green Start Cooking wrong vs stills; cart/calendar chrome inconsistent with circular glass buttons.

File: `FHbikS2jILAeMv8mote0vD`  
Refs: `docs/ui-screenshots/missing-ref/02/IMG_4396.PNG` (+ 4397–4402)

## 1) Start Cooking — solid mint pill (not glass)

Instance `116:8904` on Recipe Detail source `116:8866` had overrides: translucent mint fill (~0.82) + **GLASS** effect → corner bleed / darker green rects under rounded ends.

Measured from IMG_4396 (440pt scale): ~220×64, fill ≈ `#60D080`.

| Node | Change |
|---|---|
| Main `115:19211` `Label=Start Cooking` (`Recipe Action Button`) | 216→**220×64**, `cornerRadius=32`, solid `#60D080`, soft `DROP_SHADOW` (r16 / y6 / a0.18), **no GLASS** |
| Instance `116:8904` | Same fill/effects/size; x=110, y=302 (hero overlap) |

Liquid Glass stays on nav chrome only — Start Cooking is brand CTA over hero media (matches Pestle still), not a glass slab.

## 2) Glass / Top Capsule ↔ Glass / Top Button

Capsule instances on CartCalendarMore had detached **BACKGROUND_BLUR** + heavier shadow while circular `Glass / Top Button` uses **GLASS**.

| Node | Change |
|---|---|
| Set `196:23281` variants (`Label`, `AddMore`, `CartCalendarMore` `275:16327`) | fill white **0.62**; `GLASS` r24 (refraction/depth/light match Top Button); `DROP_SHADOW` r4 / y1 / a0.12 |
| Instance resets (3) | `275:16346` on variant + Recipe Detail header instances — cleared BACKGROUND_BLUR overrides |

Layout unchanged: Back circle · Cart+Calendar capsule · More circle (matches IMG_4396). Material now same Liquid Glass recipe as circular top buttons.

## Not in this wave

Queued follow-ups (glass icon backgrounds, pages without tab bar, top icon spacing sweep) — separate turns.
