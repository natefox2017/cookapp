# DOCS-SOT FAIL → FIX · Groceries 25–27 / Meal Plan 29–30

**SoT:** `docs/ui-screenshots/`  
**Figma:** `FHbikS2jILAeMv8mote0vD` · Interaction Tree `37:2`  
**Branch:** `cursor/groc-meal-25-30-fail-eff1`  
**Gate:** `GATE.json` + `side/*-final.png`

| Page | Tree | Main | Ref | Gate | Key fixes |
|---|---|---|---|---|---|
| **25** Groceries | `115:18854` | `115:8136` | `groceries-list.jpg` | PASS_CLOSE (MAE≈13.7) | Discover → quotes-in-square icon; qty + in-note metrics green; list garlic→pepper; Oil/Bacon hidden; Flour/Thyme/Pepper variants |
| **26** List Menu | `119:11940` | `118:10578` | `groceries-list-menu-open.jpg` | PASS_CLOSE (IA) | Menu IA Choose List / Hide Purchased / Share / Clear; leading icons; chevron only Choose List; scrim 18% |
| **27** Custom List | `119:12010` | `118:10650` | `groceries-choose-list-menu-open.jpg` | PASS_CLOSE (MAE≈15.4) | Choose List popover (家庭 / 每日任务 / Groceries / + New List) — not list body |
| **29** Meal Plan | `122:13366` | `115:8250` | `meal-plan-empty.jpg` | PASS_CLOSE (MAE≈22) | Date window Sun13→Tomorrow; large green left title; household photo card + people/5; removed broken `b` |
| **30** Inline | `119:12354` | `118:10980` | `meal-plan-with-recipe.jpg` | PASS_CLOSE (MAE≈47→improved structure) | Inline centered title; Yesterday/Today/Tomorrow; clean Beef photo under Tomorrow; single servings badge |

## Residual (honest)
- Shared bottom chrome still denser/flatter than some refs (cross-page; not unique to 25–30).
- 26 pixel MAE high due to scrim + no status bar in Figma export.
- Issue **#10 left OPEN** — package Acceptance still REJECT for other FAIL pages.

## Evidence
`.cursor/walkthrough-artifacts/issue10-fail-fix/groc-meal/`
