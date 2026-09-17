# Issue #10 · Meal Plan Inline **30** residual v3

**Branch:** `cursor/meal-plan-30-nav-v3-b317`  
**Figma:** `FHbikS2jILAeMv8mote0vD` / page `37:2`  
**Screen:** `118:10980` White Screen / 41 Meal Plan Inline  
**Source chrome:** `77:203` Selected=Meal Plan · `152:15648` Tab=Meal Plan Selected=true  
**Ref:** `docs/ui-screenshots/meal-plan-with-recipe.jpg`  
**Evidence:** `before/` · `after/` · `side/` · `GATE.json`  
**Sync:** `/opt/cursor/artifacts/meal-plan-30-v3/`

Ignore status bar / Dynamic Island / keyboard.

## Gate

| Page | Ref | MAE | midMae | botMae | Verdict |
|---|---|---:|---:|---:|---|
| **30** Inline | `meal-plan-with-recipe.jpg` | 50.14 | 91.08 | **14.74** | **PASS*** |

midMae stays high from content-band date/copy differences (out of this residual’s scope; Beef card already clean in v2). botMae is the nav-band signal.

Chrome width @440: REF ≈ **376** · BEFORE (no glass) ≈ **339** · AFTER v3 ≈ **359**.

## What changed (source components only)

### `77:203` Selected=Meal Plan
- Restored Liquid Glass: `BACKGROUND_BLUR:30` + `DROP_SHADOW` + fill opacity **0.88** on Four Tab Capsule + Search Circle (matched Cookbook selected)
- Retuned density: capsule **308** · search **60** · gap **8** · total **376** · barH **62** · centered on screen (`x≈32`)
- Inactive tab icons → **Tone=Primary** (darker strokes); Meal Plan → **Tone=Accent**
- Bottom Chrome z-order above Tuesday row on `118:10980`

### `152:15648` Tab=Meal Plan, Selected=true
- Active highlight: light grey rounded-rect (**r=14**), not near-circle green wash
- Tighter icon/label vertical packing inside pill

### Not touched
25 / 26 / 27 Groceries · Cookbook / Settings · MISSING_REF · Backend/Admin/SwiftUI  
(29 shares `77:203` chrome — glass/density improvement only; content unchanged)

## PASS* residual (non-blocking)
1. Tab glyphs remain **stroke** vectors (Pestle ref uses heavier/filled solids) — no filled icon assets in kit
2. Internal capsule padding still ~1 tab-slot looser than Pestle in places
3. Full-frame midMae inflated by date-row copy/layout (Monday Dinner vs ref Breakfast peek) — not this residual

## Checklist recommendation
- Check **30** as **PASS*** (nav density residual closed enough for glass + width + active pill)
- Leave Issue **#10 OPEN** (MISSING_REF / other residuals elsewhere)
- Assignee remains @natefox2017
