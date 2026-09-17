# Issue #10 Design QA — Progress (2026-09-17)

Figma: `FHbikS2jILAeMv8mote0vD` · page `37:2` White Theme · Interaction Tree  
Refs: `docs/ui-screenshots/`  
Evidence: this folder (`figma/`, `compare/`, `refs/`, `crops/`)

## Rule
Check Issue boxes only on side-by-side PASS. PARTIAL stays unchecked with residuals.

## FAIL-with-ref pages

| Page | Ref | Verdict | What changed | Residuals |
|---|---|---|---|---|
| 05 Timer | `create-timer.jpg` | **PARTIAL** (near PASS) | Back/Start capsules; Untitled Timer; segmented presets; toggle OFF; hint typo matched | Picker fade/rows; shadow weight |
| 06 Recipe Menu | `recipe-detail-*-menu-open.jpg` | **PARTIAL** | Full Edit→Delete IA; glass blur; Trailing=More; hero image; flame hidden on Start Cooking | Icon glyphs; glass fidelity; some chrome |
| 11 Discover | `discover.jpg` | **PARTIAL** | Trailing Filter removed; card order kale→noodles→muffins→mayo; photo fills | Nav Discover icon; card scrim/text polish |
| 01/20 Cookbook | `cookbook-grid.jpg` | **PARTIAL** | AddMore = +/…; grid photos; kale badge `4` | Shared nav icons; text/badge polish |
| 02 Recipe Detail | `recipe-detail-beef-bourguignon.jpg` | **PARTIAL** | Hero photo; Cart+Calendar pill + separate More; no flame | Ingredient note copy; nav icon set |
| 07 Folders | `folders-home-expanded.jpg` | **PARTIAL** | Recently Added present in All Recipes group | Row icons/counts vs ref; Folders section density |
| 25 Groceries | `groceries-list.jpg` | **FAIL** | (shared chrome only) | List start items/notes; Discover icon |
| 26 List Menu | `groceries-list-menu-open.jpg` | **PARTIAL** | Menu IA → Choose List / Hide Purchased / Share List / Clear | Placeholder icons; chevron only on Choose List OK |
| 27 Choose List | `groceries-choose-list-menu-open.jpg` | **PARTIAL** | Choose List panel (家庭 / 每日任务 / Groceries / + New List) | Header icon/chevron polish |
| 29 Meal Plan | `meal-plan-empty.jpg` | **PARTIAL** | Large green title; household badge hidden; Trailing=Cart | Date window ≠ ref (past days missing) |
| 30 Inline | `meal-plan-with-recipe.jpg` | **PARTIAL** | Beef recipe card under Tomorrow | Date window; card placement/density |
| 33 Settings | `settings.jpg` | **PARTIAL** | Trial hero hidden; Pestle Pro Active row; Chrome Extension present | Siri mic icon; row ordering polish |
| 34 General | `settings-general.jpg` | **FAIL** | not deeply reworked this pass | App Icon thumb; Timers switch |
| 39 Account | `account-settings.jpg` | **FAIL** | not deeply reworked | Copy Support ID green icon |
| 41 Paywall | `join-pestle-pro.jpg` | **FAIL** | not deeply reworked | Join Pestle Pro hero composition |
| 43 Household | `household-settings.jpg` | **FAIL** | not deeply reworked | ba d management vs Create form |

## MISSING_REF (report only — no invented UI)
03, 04, 08–10, 12–15, 16–19, 21–22, 24, 28, 31–32, 35–36, 38, 40, 42, 44–49 — unchanged; need screenshots in `docs/ui-screenshots/`.

## Preserved
Continuous `01…49` numbering; 4-row nav labels/layout intact.
