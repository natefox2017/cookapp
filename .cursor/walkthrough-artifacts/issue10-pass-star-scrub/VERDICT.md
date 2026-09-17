# Issue #10 PASS* residual scrub · 2026-09-17

Figma: `FHbikS2jILAeMv8mote0vD` · page `37:2`  
Refs: `docs/ui-screenshots/` (ignore status bar / Dynamic Island / keyboard)  
Evidence: `.cursor/walkthrough-artifacts/issue10-pass-star-scrub/`

## Goal
Push PASS* residuals toward PASS. **Do not** invent MISSING_REF bodies. **Do not** check Acceptance row 1 until all docs-mapped pages are true PASS.

## Changes (shared source first)

### 1. Dark → light glass chrome (esp. 02)
- `Glass / Top Capsule` · `Kind=CartCalendarMore` (`275:16327`): dark fill → light frosted (`#fff` @ 0.72 + hairline + blur)
- `Glass / Top Button` instances on Navigation Header `Title=None, Leading=Back, Trailing=CartCalendarMore` (`275:16344`): reset dark overrides
- Swept live instances of that header (incl. `116:18195` / `142:14178`)
- Cart `+` badge → dark for light glass
- Hero `151:15679`: re-uploaded clean food crop (`02-hero-clean.png`, hash `2194b7b5…`) to reduce baked chrome ghost

**02 MAE:** prior PASS* ≈38.6 → **full ≈35.3** (chrome band still elevated vs docs crop/framing)

### 2. Shared tab chrome (Bottom NAV `77:237`)
- Unified capsule + search circle glass: white @ 0.88, stroke 0.06, blur 30, shadow
- `Selected=Meal Plan` density aligned to Cookbook (422×64; capsule 350; search 64)
- Selected pill: Meal Plan grey → shared green tint (`#47C978` @ 0.141) like Cookbook
- Inactive tab labels/icons darkened toward near-black; stroke weight ↑ (~2.2) for denser look

### 3. Opportunistic
- **07 Folder+:** rebuilt `Icon=FolderAdd, Tone=Primary` (`180:12765`) as folder + badge circle with `+` (was weak/missing +)

### 4. Record only (no invent)
| Page | Status |
|---|---|
| 04 Cooking Steps | docs **MISSING_REF** · Cooking AA residual only |
| 47 Acknowledgements | **M18** blank kept |
| 48 Special Thanks | docs **MISSING_REF** / MAE residual only |

## MAE snapshot (status-stripped @440w)

| Page | Ref | full | chrome | bot | Verdict |
|---|---|---:|---:|---:|---|
| 02 Recipe Detail | recipe-detail-beef-bourguignon.jpg | 35.3 | 67.4 | 21.7 | **PASS*** (light glass fixed; hero framing residual) |
| 01 Cookbook | cookbook-grid.jpg | 55.4 | 8.1 | 14.3 | **PASS*** (tab outline icons residual) |
| 07 Folders | folders-home-expanded.jpg | 10.4 | 6.6 | 19.2 | **PASS*** (Folder+ improved; list density residual) |
| 11 Discover | discover.jpg | 57.8 | 6.9 | 55.6 | **PASS*** (shared outline tab icons; photo encoding) |

## Remaining residuals (honest)
1. **Tab icons still outline** — kit lacks true filled Pestle glyphs; thickened + blackened only
2. **02 hero framing / chrome MAE** — light glass OK; photo crop ≠ docs pixel band; faint top-edge ghost may remain in hero texture
3. **05 Timer spacing** — not retouched this pass (prior PASS* MAE≈10.4)
4. **MISSING_REF** pages unchanged — no invented UI
5. **Acceptance row 1** stays **unchecked** — PASS* ≠ full pass · hard FAIL still 0

## Compare artifacts
- `compare/02-chrome-triple.png` — REF / BEFORE dark / AFTER light
- `compare/02-side.png`, `01-side.png`, `07-side.png`, `11-side.png`
- `compare/01-tab-side.png`, `11-tab-side.png`
- `REPORT.json`
