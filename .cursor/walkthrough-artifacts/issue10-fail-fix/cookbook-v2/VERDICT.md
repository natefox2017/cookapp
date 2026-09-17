# Cookbook cluster v2 · Issue #10

**Date:** 2026-09-17  
**Figma:** `FHbikS2jILAeMv8mote0vD` · page `37:2`  
**Branch:** `cursor/cookbook-v2-01-11-09f8`  
**Scope:** 01/20 Cookbook · 02 Recipe Detail · 07 Folders · 11 Discover only  
**Refs:** `docs/ui-screenshots/` (ignore status bar / Dynamic Island / keyboard)

## Interaction Tree nodes

| Page | Instance | Main component |
|------|----------|----------------|
| 01 Cookbook | `115:18732` | `115:8012` White Screen / W02 Cookbook |
| 20 Cookbook Populated | `119:13141` | `118:11747` (separate populated main; not same as 01) |
| 02 Recipe Detail | `116:18195` | `116:8866` White Screen / W03 Recipe Detail |
| 07 Folders | `115:19093` | `115:8375` Folders Accordion State=Default (Categories expanded) |
| 11 Discover | `130:14331` | `115:8191` White Screen / W07 Discover |

## What changed (Figma source)

1. **02 hero chrome ghosts** — hero `151:15678` imageTransform crops baked Pestle top-bar out of photo; live glass header remains.
2. **02 header glass** — `Glass / Top Button` + `Kind=CartCalendarMore` + header `275:16344` → light frosted white glass + blur; Cart+Calendar capsule + separate More; `+` badge; `glassY` header → 60.
3. **02 ingredient notes** — parenthetical notes gray; quantities green.
4. **11 Discover card chrome ghosts** — original card image hashes kept; `imageTransform` crops bottom baked nav; live text left hidden (photo already has typography).
5. **Discover tab glyph** — Icon=Discover Primary/Secondary/Accent rebuilt as rounded-rect quote marks.
6. **Shared chrome polish** — AddMore / Top Button / bottom capsules: light glass, hairline stroke, blur (01/07/11).

## Side-by-side evidence

- Before: `before/`
- After: `after/`
- Compare: `compare/*-final-side.png`
- Mirror: `/opt/cursor/artifacts/figma-qa-cookbook-v2/`

Pixel MAE (content crop, phone width) is **photo-dominated** and not the pass gate; structure / chrome / IA are.

| Page | MAE before → after | Structural verdict |
|------|--------------------:|--------------------|
| 01 | 54.13 → 54.38 | **PASS*** |
| 02 | 33.54 → 42.24 | **PASS*** |
| 07 | 10.35 → 10.52 | **PASS** |
| 11 | 65.86 → 66.32 | **PASS*** |

## Per-page verdicts

### 01 Cookbook — PASS* vs `cookbook-grid.jpg`
- Green title, 6 photo cards incl. Kale=4, AddMore trailing, Cookbook active pill.
- Residual: Discover glyph still approximate vs Pestle “face/quotes” mark; photo color/MAE; shared nav hairline density.

### 02 Recipe Detail — PASS* vs `recipe-detail-beef-bourguignon.jpg`
- Ghost baked chrome removed; light glass Back + Cart/Calendar capsule + More; Start Cooking no flame; Note gray parentheticals.
- Residual: hero crop not pixel-identical Pestle frame; calendar glyph uses MealPlan vector; glass peach tint vs Pestle.

### 07 Folders — PASS vs `folders-home-expanded.jpg`
- Recently Added row; Categories expanded (Main/Stew/Baking/Sauce/View All); Cuisines French visible; green title + FolderAdd.
- Residual: shared Discover tab glyph (cross-page).

### 11 Discover — PASS* vs `discover.jpg`
- No trailing Filter; card order Kale → Mongolian → Muffin → Mayo; ghosts from baked bottom-nav cropped; Discover tab active green + quote-square glyph.
- Residual: card typography still baked in photos (acceptable); slight bottom crop; MAE photo-dominated.

## Not in scope (untouched)
05/06 Timer/Menu · 25–30 Groceries/Meal Plan · 33–43 / 34/41 Settings · MISSING_REF · Backend/Admin/SwiftUI

## Issue checklist
勾选 01/20 · 02 · 07 · 11 为 PASS/PASS*；Issue **保持 OPEN**（MISSING_REF / 其他残差）。
