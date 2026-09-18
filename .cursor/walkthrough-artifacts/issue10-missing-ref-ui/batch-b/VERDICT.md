# Batch B — implemented (not audit-only)

Figma `FHbikS2jILAeMv8mote0vD` / page `37:2`. Sources only + extras right of Cookbook row. Bottom NAV / 03/08/10/16/24/35 untouched.

Raster `PixelBase` overlays on 04/22 were **hidden** so constructed layers show.

## What changed

| Source | Node | Change |
|---|---|---|
| 04 Cooking | `116:8908` | Hero + glass list/timer + voice + 1/21 + green title + instruction + Say Close/Next. Height locked 956. |
| 13 Editor | `118:10814` | Tall **3002** form: green title, X+check, Total Time 3h10m, cover photo, ingredients with red minus, steps, nutrition, Manage/Delete. |
| 14 Category | `118:10840` | Full-screen sheet, green Category, +/check glass, full list, Search Categories. Height 1487. |
| 15 Cuisine | `118:10871` | Green Cuisine, French selected, Western included, Search Cuisines. Height 1045. |
| 22 New Recipe | `118:11949` | Empty form stitch: Name/Description, Add Time, Cover Photo, Ingredients split, Steps minus, Categories→Delete. Height 1200. |

Tree instances (auto-update from sources): `116:18290` 04, `119:12180` 13, `119:12208` 14, `119:12241` 15, `119:13349` 22.

### Extra frames (not 01–49)

| Name | Node | x |
|---|---|---|
| 04b · Timers | `402:9328` | 14928 |
| 04c · Cooking Ingredients | `402:9340` | 15568 |
| 04d · Cooking Step 2/21 | `402:9387` | 16208 |

## Verdicts

### 04 Cooking Steps — instance `116:18290` ← `116:8908`
**VERDICT: PASS\***
- Screenshot fidelity: cooking chrome + title + body + Say Close/Next. *Instruction missing owner green highlights (beef/large/12 hours/24 hours).*
- Liquid Glass: dual capsule + voice circle (blur+hairline). Content sheet opaque white.
- Consistency: Pestle green badge/title.
- Control states: named default on Close/Next/Voice.
- Required redo: range-fill green phrases; keep PixelBase hidden.

### 04b Timers — `402:9328`
**VERDICT: PASS\*** — green Timers, glass +, No active timers, photo peek.

### 04c Ingredients — `402:9340`
**VERDICT: PASS\*** — checklist + green check. *Qty not green-tokenized.*

### 04d Step 2/21 — `402:9387`
**VERDICT: PASS\*** — 2/21, Back/Next. *Body highlights missing.*

### 13 Recipe Editor — `119:12180` ← `118:10814`
**VERDICT: PASS\***
- Screenshot fidelity: owner must-haves (green title, X+check, Total Time, cover, red-minus ingredients) + tall stitch into steps/nutrition/delete. *Some step copy condensed vs every 4428–4436 line.*
- Liquid Glass: X/check chrome only.
- Consistency: same cards as 22.
- Control states: minus/plus/Add Recipe/New Ingredient/New Step/Manage/Delete named default.

### 14 Category sheet — `119:12208` ← `118:10840`
**VERDICT: PASS\***
- Stitched list Alcoholic Beverage→Vegetarian + Search Categories. *Peek is gray not recipe photo; radios empty (matches 4452).*
- Liquid Glass: + / check / search capsule.
- Consistency: matches 15 pattern.

### 15 Cuisine sheet — `119:12241` ← `118:10871`
**VERDICT: PASS\***
- French ✓, Western on list, Search Cuisines. *Peek gray.*

### 22 New Recipe — `119:13349` ← `118:11949`
**VERDICT: PASS\***
- Empty New Recipe: Name/Description, Add Time, Cover Photo, Ingredients Add Recipe|New Ingredient, Steps red minus, Add sections, Categories, Cuisine, Manage Fields, Delete Recipe (4448+4449).
- *Cover glyph is simple rect vs photo icon; PixelBase hidden.*
- Liquid Glass: X/check only.
- Control states: default named on CTAs.

## Cross-cut

| Check | Result |
|---|---|
| Screenshot fidelity | PASS* (all claimed) |
| Liquid Glass | PASS* chrome only |
| Consistency | PASS* 13/22 and 14/15 aligned |
| Control states | PASS* default labeled; hover/disabled not extra pages |
| Shared NAV / 03/08/10/16/24/35 | Untouched |
