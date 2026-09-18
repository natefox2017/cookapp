# WAVE7 — Duplicate page buttons (baked chrome + vector overlay)

Owner report: 很多页面按钮还重复了（screenshot: Trial / Paywall double Close X）。

## Root cause

Not two vector layers. Full-file scan found **0** overlapping circular chrome pairs.

Paywall `41 · Trial / Paywall` / source `White Screen / W05.2.2 Trial / Paywall`:

| Layer | Role |
|-------|------|
| `Hero Photo` `277:13139` IMAGE `f88b36…` | Recording crop with **Close already painted** into pixels (center ≈ design `(399, 72)`) |
| `Close` `277:13160` → `Glass / Top Button` | Real Liquid Glass control at `(376, 16)` |

Misaligned stack → ghost double X. `PixelBase` on this screen is already `visible=false` (not the culprit).

Recipe Detail heroes (`151:15679` / `151:15678`) are clean food photos — no baked chrome. No other Close-over-IMAGE cases on main components.

## Fix (file `FHbikS2jILAeMv8mote0vD`)

1. Export raw Hero fill (1320×840).
2. OpenCV `INPAINT_TELEA` over detected baked disk (~`(1196, 217)` r≈78 @3×).
3. Re-upload scrubbed PNG → `Hero Photo` `277:13139` (new hash `707289f34a3a7ce24da06c79a1d81f0a0cbc3219`, `FILL`).
4. Interaction Tree instance `117:10305` inherits automatically.

Did **not** remove/move vector `Close` `277:13160`.

## Verify

- Hero-alone TR: former button region mean luma ~35 (was ~135); no light disk
- Paywall master + tree `41`: single glass Close over clean kitchen photo
- Structural rescans: still 1 Close-over-IMAGE (scrubbed hash); 0 vector chrome overlaps

Artifacts: `/opt/cursor/artifacts/screenshots/paywall-scrub-*.png`, `paywall-41-after-scrub.png`, `paywall-master-after.png`.

Ignore status bar / Dynamic Island / keyboard when comparing stills.
