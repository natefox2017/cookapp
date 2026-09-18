# Pixel DoD batch1 · GAP analysis (pre-fix)

**DoD:** pixel-level PASS only (PASS* does not count).  
**Batch:** 43 Household · 39 Account · 07 Folders · 05 Timer (lowest prior MAE → highest).  
**Refs:** `docs/ui-screenshots/{household-settings,account-settings,folders-home-expanded,create-timer}.jpg`  
**Ignore:** status bar / Dynamic Island / keyboard.  
**Figma:** `FHbikS2jILAeMv8mote0vD` / page `37:2`  
**Known nodes:** 05 `116:18318`←`116:8985` · 07 `115:19093`←`115:8375` · 39/43 TBD on live scan.

## Cached MAE baseline (status-stripped @440w)

| Page | Cached export | full | chrome | mid | bot |
|------|---------------|-----:|-------:|----:|----:|
| **43** | fail-fix/after | **5.60** | 7.72 | 5.88 | 2.27 |
| **07** | pass-star-scrub/after | **6.48** | 4.20 | 5.47 | 13.76 |
| **39** | fail-fix/after | **7.54** | 10.80 | 7.98 | 2.41 |
| **05** | timer-menu-v2/after | **10.70** | 19.15 | 10.87 | 2.55 |

Cached exports may predate residual finish; **fresh `get_screenshot` required** before any checklist tick.

## Visible gaps (side-by-side vs docs)

### 43 Household (`household-settings.jpg`)
1. Section label **Rename** vs Figma **RENAME** (case + size)
2. Input + Delete button corner radius too sharp (docs = pill)
3. Member bar mint too saturated; square glyph shade off
4. Helper under Delete: alignment/margins vs docs
5. Side margins / vertical rhythm tighter than docs

### 39 Account (`account-settings.jpg`)
1. Card internal right padding: `Active` / copy icon too close to edge
2. Copy glyph stroke weight thicker than docs
3. Helper text line-breaks / vertical gaps under Create-account + Support ID cards
4. Title top padding vs Back chrome

### 07 Folders (`folders-home-expanded.jpg`)
1. List dividers: docs full-bleed inside card vs Figma inset (start under label)
2. Bottom Cookbook tab glyph / active pill density residual
3. Folder+ chrome / icon weight residual
4. Categories row spacing slightly tight

### 05 Timer (`create-timer.jpg`)
1. Presets must be **single segmented control** (not separate chips; no selected-15 wash)
2. Back/Start glass capsules: radius + elevation vs docs flatter pills
3. Name row vertical padding
4. Picker height / fade band density
5. Chrome MAE elevated (~19) — priority for pixel pass

## Fix order (shared source first)
1. **05** Timer master `116:8985` — segmented presets + chrome capsules + picker density
2. **07** Folders accordion / list divider inset → full card dividers; tab inherits shared Bottom NAV
3. **39** Account source — card padding + copy glyph
4. **43** Household source — Rename casing, pill radii, mint bar, helper alignment

## Blocker
Figma MCP Education plan tool-call limit hit mid-batch (`whoami` = Full seat / student tier). Cannot `use_figma` / `get_screenshot` until quota resets. Sibling agent `Figma pixel DoD #10` also RUNNING — shared quota pressure.

## Evidence
- `compare/*-side-cached.png` · `compare/*-diff-cached.png`
- `refs/*-ref.jpg`
