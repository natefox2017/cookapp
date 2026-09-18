# Issue #10 — missing-ref Figma pass (2026-09-18)

Figma `FHbikS2jILAeMv8mote0vD` / `37:2`. Refs: `docs/ui-screenshots/missing-ref/`. Ignore status bar / Dynamic Island / keyboard.

## Batch 1 (prior)

| Page | Node | Ref | Verdict | Notes |
|------|------|-----|---------|-------|
| **03** Meal Plan | `116:18239` ← `116:8936` | `03/meal-plan.jpg` | **PASS*** | Filled Meal Plan (Sun13 Beef + Lunch Mayo + Mon14 Beef). *Photo encode / crop. |
| **08** Recently Added | `119:12665` | `08-09/IMG_4411.PNG` | **PASS*** | Kale grid + Back/More. *Card crop. |
| **09** Main | `119:12726` | `08-09/IMG_4414.PNG` | **PASS*** | Your Recipes + Back/AddMore. *Beef photo. |
| **31** Add Menu | `119:12435` | `29-32/IMG_4467.PNG` + recording | **PASS*** | Add Recipe / Section / Note / Random. *Chevron residual. |
| **32** Add Section | `119:12521` | recording f015 | **PASS*** | Breakfast/Lunch/Dinner + Manage Times. |

## Batch 2 (prior)

| Page | Node | Ref | Verdict | Notes |
|------|------|-----|---------|-------|
| **10** New Smart Folder | `184:13555` ← `184:13290` | `10、12/IMG_4423.PNG` | **PASS*** | 6 Recipes Found + filter rows. *Cancel glass pill vs blue text. |
| **15** Cuisine Selector | `119:12241` ← `118:10871` | `13-15/IMG_4438.PNG` | **PASS*** | French selected + Search Cuisines. *Radio outline gray vs green; list length. |
| **22** New Recipe | `119:13349` ← `118:11949` | `22/IMG_4448.PNG` | **PASS*** | Green title + ✓; Time/Cover; Ingredients/Steps CTAs; Categories/Cuisine. *Icon art blocks; header density. |
| **35** App Icon | `117:10131` ← `116:18900` | `35/IMG_4482.PNG` | **PASS*** | Card list Pestle/Dark/Sketch; color-block icons (owner OK). |
| **49** What's New | `117:10603` ← `116:19356` | `47-49/49.PNG` | **PASS*** | Three features + Leave a Review / Continue / footer. *Icon blocks. |

Independent QA (batch2): see `batch2/QA-VERDICT.md` → **VERDICT PASS** (all PASS*).

## Batch 3 (this PR update)

| Page | Node | Ref | Verdict | Notes |
|------|------|-----|---------|-------|
| **36** Markdown | `117:10157` ← `116:18924` | `36/IMG_4483.PNG` | **PASS*** | 10 toggles ON + Example. *Long-page trunc. |
| **38** Experiments | `117:10209` ← `116:18972` | `38-40/IMG_4486.PNG` | **PASS*** | Two OFF toggles + per-row hints. |
| **40** Create Account | `117:10279` ← `116:19044` | `38-40/IMG_4488.PNG` | **PASS*** | Get started + or + social. *Art / Back residual. |
| **42** Join Mailing List | `117:10357` ← `116:19116` | `42-43/IMG_4490.PNG` | **PASS*** | Close + owner copy + mint Join. |
| **44** Timers | `117:10435` ← `116:19188` | `44/IMG_4493.PNG` | **PASS*** | Empty “No active timers”. |

Independent QA (batch3): see `batch3/QA-VERDICT.md` → **VERDICT PASS** (all PASS*).

## Still open (next batches)

04 long stitch · 06 · **12** Following filter (no dedicated pack shot) · **13** Editor · **14** Category · **16–21** Search/Scope/Add Recipe Menu · **24/28** Groceries · **45/46** How To / Import · FIGMA_MISSING pantry/filter/etc. · **47/48 Owner: do not draw**.

Evidence: `figma/` + `batch2/figma/` + `batch3/figma/`.
