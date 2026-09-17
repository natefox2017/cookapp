# Issue #10 · Groceries + Meal Plan residual v2

**Branch:** `cursor/groc-meal-v2-25-30-e74f`  
**Figma:** `FHbikS2jILAeMv8mote0vD` / page `37:2`  
**Scope:** 25 / 26 / 27 / 29 / 30 only  
**Evidence:** `before/` · `after/` · `side/` · `GATE.json`  
**Sync:** `/opt/cursor/artifacts/figma-qa/groc-meal-v2/`

Ignore status bar / Dynamic Island / keyboard.

## Gate (MAE vs `docs/ui-screenshots/`, status-bar cropped)

| Page | Ref | MAE | midMae | Verdict |
|---|---|---:|---:|---|
| **25** Groceries | `groceries-list.jpg` | 13.64 | 14.48 | **PASS** |
| **26** List Menu | `groceries-list-menu-open.jpg` | 48.60 | 48.36 | **PASS*** |
| **27** Choose List | `groceries-choose-list-menu-open.jpg` | 15.30 | 15.91 | **PASS** |
| **29** Meal Plan empty | `meal-plan-empty.jpg` | 24.57 | **7.00** | **PASS** |
| **30** Inline | `meal-plan-with-recipe.jpg` | 56.55 | 77.18 | **PARTIAL** |

\*26 MAE inflated by overlay vs full-page pixel diff; IA + icons match ref.

## What changed (source components, not pixel paste)

### 25 Groceries (`115:8136` + ingredient comps)
- Wine `((Note 3))` → gray note (was green)
- Carrots in-note metrics: green `300g/10oz` + `4-5` + `2"`
- Salt / Pepper → ASCII `3/4` / `1/2` (ref)
- List already garlic→pepper (Oil/Bacon off); preserved

### 26 List Menu (`117:10698`)
- Leading icons → SVG (list / eye-slash / person+ / trash)
- Soft drop shadow on menu glass
- IA: Choose List › / Hide Purchased / Share List / Clear (red)

### 27 Choose List (`118:10650` panel `277:12695`)
- Header order: Leading Icon → Title → Chevron
- Panel corner + shadow; Groceries selected green; 家庭 / 每日任务 / + New List

### 29 Meal Plan (`115:8250`)
- Date window Sun13 → Tomorrow (matches ref)
- Household photo card + people/5; Bottom Chrome above card (z-order)
- Broken `b` badge already gone

### 30 Inline (`118:10980` / card `277:14150`)
- Clean food-only photo upload (cropped hero, no baked chrome/title)
- Single title overlay + servings badge
- Monday Sep 21 → `Dinner`; Tuesday Sep 22 partially visible
- Residual: floating-pill nav density vs ref; high full-frame MAE

## Checklist recommendation
- Check: **25**, **26**, **27**, **29**
- Leave unchecked: **30** until nav chrome density / card crop human-reviewed
- Do **not** close Issue #10

## Out of scope (this pass)
01–11 Cookbook/Discover/Timer/Menu · 33–43 Settings · MISSING_REF pages · Backend/Admin/SwiftUI
