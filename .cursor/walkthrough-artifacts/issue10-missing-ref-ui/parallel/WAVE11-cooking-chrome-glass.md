# WAVE11 — Cooking Steps chrome: Liquid Glass + icons

Owner: buttons have solid backgrounds (not Liquid Glass); icons wrong.  
Refs: `docs/ui-screenshots/missing-ref/04/IMG_4404.PNG` (also 4405 Timers +, 4407 step 2).

## Screens

| Screen | Node |
|---|---|
| 04 Cooking 1/21 | source `116:8908` / chrome `406:14366` |
| 04d Step 2/21 | `402:9387` / chrome `402:9390` |
| 04b Timers empty | `402:9328` / Add `402:9332` |

## Material lock (match `Glass / Top Button` `196:23264`)

Dual Capsule + Voice (+ Timers Add):

- fill white **0.62**
- `GLASS` r24 (refraction 0.55 / depth 20 / light 110 / intensity 0.7 / dispersion 0.06)
- `DROP_SHADOW` r4 / y1 / a0.12
- hairline stroke black **0.08** @ 0.5pt (Pestle over white sheet)
- removed prior `BACKGROUND_BLUR` / heavy shadow / muddy low-opacity fills

Green **1/21** / **2/21** pills stay solid brand green (screenshot).

## Icons (vs IMG_4404)

| Control | Before (04) | After |
|---|---|---|
| Dual leading | bullet-list vectors | `list-check-glyph` (check + empty circle + lines) from 04d |
| Dual trailing | green timer vectors | `Icon=Timer, Tone=Accent` (brand green) |
| Voice | single rose “pause” stroke | red SVG waveform bars + mic (Pestle zoom) |
| 04d Voice | black bars + red “0”-like mic | same red waveform+mic SVG |
| 04d Timer | was ink after WAVE mis-recolor | restored brand green strokes |

## Notes

- Over the opaque white cooking sheet, glass reads near-white (same as Pestle still) — translucency shows when chrome sits over the hero peek.
- Bottom **Say Close / Say Next** unchanged (content CTAs, not nav glass).
