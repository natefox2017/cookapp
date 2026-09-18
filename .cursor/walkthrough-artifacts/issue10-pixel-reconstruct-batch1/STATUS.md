# Status · pixel reconstruct 43/39/05/07

**Updated:** 2026-09-18T12:16Z  
**Branch:** `cursor/pixel-reconstruct-43-39-05-07-4b9d`  
**Issue:** #94 (scheduled resume) · parent #10

## Done this session (post-12:00 UTC)
- Figma quota OK — live `get_screenshot` + `use_figma` succeeded
- PixelBase confirmed **hidden** on sources 43/39/05/07 (no wallpaper MAE)
- Vector chrome already visible; restoredCount=0 (nothing left to unhide)
- Fixes applied:
  - Timer: Selection Band → y=14 (over 0h row); hint copy matched docs typo (`it's continue`)
  - Household: Color Bar width → 96
  - Account: hide heavy `⧉` Copy Glyph (keep vector Copy Icon)
  - Folders: Selected Cookbook Capsule → soft mint (14% green), not solid green slab
- Live exports in `figma/{43,39,05,07}-*.png` + `REPORT.json` + `compare/*`

## Honest MAE (status-stripped @440w) — PixelBase banned

| Page | baseline #82 | after fixes | Δ full |
|------|-------------:|------------:|-------:|
| 43 | 5.29 | 5.22 | -0.07 |
| 39 | 7.39 | 7.29 | -0.10 |
| 05 | 10.06 | 10.78 | +0.72 |
| 07 | 9.07 | 5.81 | **-3.26** |

**DoD ≤~2–4 full MAE: NOT met.** Do not tick #10 checklists. Ready PR = evidence + ask independent QA.

## Notes
- Timer chrome MAE still ~23 — likely phone-status vs Figma top-chrome alignment + Back/Start glass residual
- Folders bot MAE ~9 — nav icon weight / Folder+ glyph still diverge from docs
