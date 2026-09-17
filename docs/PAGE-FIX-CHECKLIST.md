# Cookapp White Theme · PAGE FIX CHECKLIST

**File:** `FHbikS2jILAeMv8mote0vD` · **Page:** `37:2` · **Section:** `113:7937`  
**LIVE map:** `final-table.md` (01…49)  
**Generated:** 2026-09-17T14:20Z  
**Scope:** User-listed broken LIVE pages — **03,04,05,06,08,09,11,14,15,18,19,22,23,24–49**  
**Policy for siblings:** content/internals only · **do not** move tree instance x/y · use LIVE frameIds · USER assets trump agent QA for **18**

---

## Evidence inventory (ALL found under requested roots)

### A. True user uploads — `/home/ubuntu/.cursor/projects/workspace/assets/`

| Path | LIVE |
|------|------|
| `D58BE5F6-A8C1-4D5D-A1BB-E07D8723AE89_L0_001.jpg` | **16** Search *(not in broken list; related)* |
| `8D01AAA6-87B8-4C43-BCFF-7CAE672202D0_L0_001.jpg` | **17** Search Focused *(not in broken list; related)* |
| `1117D566-7D24-408A-A510-B9C4C2633CE5_L0_001.jpg` | **18** Search Results |

### B. `/tmp/cookapp-qa`

| Path | LIVE |
|------|------|
| `cooking-final.png` (+ cooking.png / cooking2.png) | **04** Cooking Steps |
| `timer-final.png` (+ timer.png / timer2.png) | **05** Timer Form |
| `whatsnew.png` | **49** What's New |
| `ack.png` | **47** Acknowledgements |
| `tree-final.png` | canvas overview (not a page) |

### C. `/tmp/cookapp-shots` (+ identical `/tmp/walkthrough-redbox`)

| Path | LIVE |
|------|------|
| `after/10-recent.png` | **08** Recently Added |
| `after/11-main.png` | **09** Main |
| `after/34-editor.png` | **13** Recipe Editor *(sibling of 14/15/22)* |
| `after/35-category-v2.png` (+ 35-category.png) | **14** Category Selector |
| `after/36-cuisine.png` | **15** Cuisine Selector |
| `after/37-filter.png` | **12** Filter *(adjacent to 11)* |
| `after/39-mealplan.png` | **29** Meal Plan |
| `after/40-add-menu.png` | **31** Add Menu |
| `after/41-add-section.png` | **32** Add Section Menu |
| `after/43-scope.png` | **19** Scope Filter |
| `after/44-cookbook.png` | **20** Cookbook Populated *(ref for 23)* |
| `after/45-add-recipe.png` | **21** Add Recipe Menu *(adjacent to 22)* |
| `w02p.png` / `w07_1.png` / `tree.png` | early / overview |

### D. `/tmp/figma-evidence`

| Path | LIVE |
|------|------|
| `folders-default.png` / `folders-expanded.png` / `folders-menu-open.png` | **07** Folders *(adjacent)* |
| `folders-accordion-set.png` / `folder-menu-component.png` | components |

### E. Canonical symlinks

`/tmp/cookapp-figma-audit/refs-canonical/` — preferred ref per LIVE # (use these paths in the table when present).

### F. Secondary (not under the 4 roots, but used as preferred ref)

| Path | LIVE |
|------|------|
| `/tmp/cursor/artifacts/w07_back_filter_glass_after.png` | **11** Discover chrome |
| `/tmp/cursor/artifacts/w06_pantry_more_glass_final.png` | **25** Groceries |
| `/tmp/cursor/artifacts/w08_cart_glass_after.png` | **29** cart chrome |
| `/tmp/cursor/artifacts/w02_back_addmore_glass_after.png` | **01/20/23** chrome family |
| `/tmp/cookapp-figma-audit/01-groceries.png` | **24** Groceries / Empty |
| `/tmp/cookapp-audit/settings-cooking/import-share.png` | **46** |
| `/tmp/cookapp-audit/settings-cooking/special-thanks.png` | **48** |
| `/tmp/cookapp-43-48/return-cur.png` | **23** LIVE crop (agent QA) |

**Caveat:** Aside from the **3 JPGs in assets/**, no pestle.MP4 / IMG_432x native stills on this VM. Local refs are best available targets.

---

## Checklist (broken LIVE only)

| # | Name | frameId | ref_path | status | notes |
|---|------|---------|----------|--------|-------|
| 03 | Meal Plan Prompt | `116:18239` | — | PENDING | No strong still. Rebuild prompt/sheet chrome; strip orphan scrap text. |
| 04 | Cooking Steps | `116:18290` | `/tmp/cookapp-qa/cooking-final.png` | PENDING | ≈ref; polish Dual Capsule glassY **52→~56**; Back+Next geometry. |
| 05 | Timer Form | `116:18318` | `/tmp/cookapp-qa/timer-final.png` | PENDING | ≈ref; glassY polish; picker selection band; Start green. |
| 06 | Recipe Menu | `116:18396` | `/tmp/cursor/artifacts/w03_back_more_glass_after.png` | PENDING | Weak ref (inherits Detail). Menu overlay vs host Detail. |
| 08 | Recently Added | `119:12665` | `/tmp/cookapp-shots/after/10-recent.png` | DONE | Single Beef @ y188; glassY **62** (header60+lead2); MSE≈2.5 vs `10-recent`. |
| 09 | Main | `119:12726` | `/tmp/cookapp-shots/after/11-main.png` | DONE | Single Beef @ y188; glassY **62**; MSE≈1.1 vs `11-main`. |
| 11 | Discover | `130:14331` | `/tmp/cursor/artifacts/w07_back_filter_glass_after.png` | DONE | Back+Filter glassY **62**; title 34@y58; feed matches w07; MSE≈1.7. |
| 13 | Recipe Editor | `119:12180` | `/tmp/cookapp-shots/after/34-editor.png` + `w07_1` | DONE | Close+Complete glassY **62**; Checkmark Primary on Complete (w07 family; `34-editor` blank circle superseded); MSE≈1.5. |
| 14 | Category Selector | `119:12208` | `/tmp/cookapp-shots/after/35-category-v2.png` | DONE | Host y **−90** (was −110 over-clip); sheet@360 · Add/Done@382; glass host Complete@62; MSE≈3.7. |
| 15 | Cuisine Selector | `119:12241` | `/tmp/cookapp-shots/after/36-cuisine.png` | DONE | Host y **−90**; French Selected=True; sheet chrome synced to 14; MSE≈2.1. |
| 18 | Search Results | `115:18812` | `/home/ubuntu/.cursor/projects/workspace/assets/1117D566-7D24-408A-A510-B9C4C2633CE5_L0_001.jpg` | DONE | **USER** — carrot badge · ghost type cleared · list-btn **r=14** (match Enter Scope Button; was conflict r=28). |
| 19 | Scope Filter | `119:12608` | `/tmp/cookapp-shots/after/43-scope.png` | PENDING | LIVE empty host under Include; REF **populated** sections. |
| 22 | New Recipe | `119:13349` | `/tmp/cookapp-shots/after/34-editor.png` | PENDING | Weak — match **13** editor nav chrome (Close+Check). |
| 23 | Cookbook Return | `119:13397` | `/tmp/cookapp-shots/after/44-cookbook.png` | DONE | **Unobscured** — MSE `196:25740` final @ **(0, 6000)** below tree (not x=15168); 0 overlap with any White phone. Grid/photos synced vs 20/`44-cookbook`. |
| 24 | Groceries / Empty | `115:18686` | `/tmp/cookapp-figma-audit/01-groceries.png` | DONE | Empty Y **560** (ref≈561); title 34/#00bd56@118; Pantry+More glassY **62**; MAE≈**0.56**. |
| 25 | Groceries | `115:18854` | `/tmp/cursor/artifacts/w06_pantry_more_glass_final.png` | DONE | Rows h66; Pantry+More glassY **62**; vs w06 GM MAE≈**3.46**. |
| 26 | List Menu | `119:11940` | inherits **25** | DONE | Scrim + menu@170,120 (Custom/Share/New Item); host = 25. |
| 27 | Custom List | `119:12010` | inherits **25** | DONE | Items `#1c1c1e`; New Item `#00bd56`; More glassY **62**; title 家庭. |
| 28 | New Item | `119:12120` | inherits **25** / `final-ni` | DONE | Sheet@**611** surface `#F2F2F7`; green title + Add pill; grabber. |
| 29 | Meal Plan | `122:13366` | `/tmp/cookapp-shots/after/39-mealplan.png` | DONE | Inline black 17@75; cart glassY **62**; dates 164…; Sunday hidden. |
| 30 | Meal Plan Inline | `119:12354` | inherits **29** / `after/39-mealplan.png` | DONE | Synced Inline chrome + list rhythm to 29. |
| 31 | Add Menu | `119:12435` | `/tmp/cookapp-shots/after/40-add-menu.png` | DONE | Icon↔text gap **14**; icons 24²; host Inline; vs 40-add-menu. |
| 32 | Add Section Menu | `119:12521` | `/tmp/cookapp-shots/after/41-add-section.png` | DONE | Timer 24²; row gap **14**; Manage Times green; vs 41-add-section. |
| 33 | Settings | `117:9975` | `/tmp/g23-fix/ref-settings.png` | DONE | Title@118; Close glassY **62**; Pestle Pro + group gaps ≈ref scaled. |
| 34 | General | `117:10081` | `/tmp/batch-c-shots/general.png` | DONE | Content +54 → first group@**200** (cleared title overlap); Back glassY **62**. |
| 35 | App Icon | `117:10131` | chrome vs General | DONE | Slots +44 → first@**200**; Light✓/Dark/Sketch; Back glassY **62**. |
| 36 | Markdown | `117:10157` | chrome vs General | DONE | Content@**200**; Example section below Notes (no overlap); Back glassY **62**. |
| 37 | Clipboard Detection | `117:10183` | chrome vs Import/Ack family | DONE | Full permission copy; pill CTAs r=28; glassY **62**; bg `#f2f2f7`. |
| 38 | Experiments | `117:10209` | chrome vs Import group | DONE | Group@160 r=26; toggle rows; hint restack; glassY **62**. |
| 39 | Account | `117:10235` | `docs/ui-screenshots/account-settings.jpg` | DONE | Restacked (no overlap); Active + Manage subscription; MAE≈9.6 vs docs. |
| 40 | Create Account | `117:10279` | Create Account chrome | DONE | Inline nav title; centered body; pill Get started@820; glassY **62**. |
| 41 | Trial / Paywall | `117:10305` | `join-pestle-pro` / paywall docs | DONE | Trial timeline; Continue+US$24.99/year; footer links only (**no Privacy page**); Close glassY **62**. |
| 42 | Join Mailing List | `117:10357` | form chrome vs Import | DONE | Fixed overlap; field `#f2f2f7` + Join CTA; glassY **62**. |
| 43 | Household | `117:10383` | Create Household (recorded partial) | DONE | Body+field restack; **no invent** of existing-household UI; glassY **62**. |
| 44 | Timers | `117:10435` | Timers + glass Add | DONE | Nav `Large/Back/Add`; trailing Add glassY **62**; group@160. |
| 45 | How To Add Recipes | `117:10461` | How-to stack | DONE | Cleared step overlaps; search example + recipe slot restack; glassY **62**. |
| 46 | Import / Share | `196:27930` | `/tmp/cookapp-audit/settings-cooking/import-share.png` | DONE | Verified vs import-share; MAE≈**1.69**; glassY **62**. |
| 47 | Acknowledgements | `196:28536` | `/tmp/cookapp-qa/ack.png` | DONE | Title-only blank body retained (M18); glassY **62**; MAE≈12 vs qa-ack (chrome). |
| 48 | Special Thanks | `117:10577` | `/tmp/cookapp-audit/settings-cooking/special-thanks.png` | DONE | Centered names + gray thanks; restack; MAE≈11 vs special-thanks. |
| 49 | What's New | `117:10603` | `/tmp/cookapp-qa/whatsnew.png` | DONE | Verified feature list + Continue; MAE≈**5.83**; glassY **62**. |

**Count:** 41 rows · **08/09/11/13/14/15 + 24–36 + 37–49 = DONE** · remaining earlier rows `PENDING`

### Groceries → mid-Settings 24–36 verify (2026-09-17T14:40Z · agent batch-24-36)

| # | glassY | key fix | mae vs preferred | status |
|---|--------|---------|------------------|--------|
| 24 | 62 | emptyY 450→**560** | **~0.56** | DONE |
| 25 | 62 | row rhythm / w06 | **~3.46** | DONE |
| 26 | 62 | list menu overlay | host inherit | DONE |
| 27 | 62 | item+#New Item colors | chrome unify | DONE |
| 28 | 62 | sheet@611 `#F2F2F7` | ~8.2 vs final-ni | DONE |
| 29 | 62 | Inline black nav | ~6.1 vs 39-mealplan | DONE |
| 30 | 62 | sync to 29 | chrome unify | DONE |
| 31 | 62 | menu icon gap 14 | ~6.9 vs 40-add-menu | DONE |
| 32 | 62 | Timer 24² + gap 14 | ~6.8 vs 41-add-section | DONE |
| 33 | 62 | Settings groups | ~17 (scale/ref) | DONE |
| 34 | 62 | first group@200 | title clearance | DONE |
| 35 | 62 | slots@200 | chrome unify | DONE |
| 36 | 62 | Example below Notes | chrome unify | DONE |

Evidence: `/workspace/.cursor/walkthrough-artifacts/batch-24-36/` · `/workspace/tmp-verify/batch-24-36-checklist.md` · tree x/y **not** moved

### Settings 37–49 verify (2026-09-17T14:35Z · agent `bc-11c28b9e`)

| # | glassY | key fix | mae vs preferred | status |
|---|--------|---------|------------------|--------|
| 37 | 62 | permission copy + pill CTAs | chrome unify | DONE |
| 38 | 62 | group/hint restack | chrome unify | DONE |
| 39 | 62 | un-overlap + Manage subscription | ~9.6 vs account-settings | DONE |
| 40 | 62 | inline title + Get started pill | chrome unify | DONE |
| 41 | 62 | trial CTA + price footer (no Privacy page) | chrome unify | DONE |
| 42 | 62 | email field + Join visible | chrome unify | DONE |
| 43 | 62 | create-household field (no invent) | chrome unify | DONE |
| 44 | 62 | Trailing=Add glass | chrome unify | DONE |
| 45 | 62 | how-to step stack | chrome unify | DONE |
| 46 | 62 | verified Import rows | **~1.69** | DONE |
| 47 | 62 | blank body kept (M18) | ~12 vs ack | DONE |
| 48 | 62 | gray thanks restack | ~11 vs special-thanks | DONE |
| 49 | 62 | verified What's New | **~5.83** | DONE |

Evidence: `/workspace/tmp-verify/settings-37-49/{live,ref,cmp,docs}/` · policy **glassY=62** · **No Privacy invent**

### Batch B+C verify (2026-09-17T14:25Z · agent `bc-66843953`)

| # | glassY | key fix | mse vs ref | status |
|---|--------|---------|------------|--------|
| 08 | 62 | 1× Beef card | ~2.5 | DONE |
| 09 | 62 | 1× Beef card | ~1.1 | DONE |
| 11 | 62 | w07 Back+Filter | ~1.7 | DONE |
| 13 | 62 | Complete ✓ | ~1.5 | DONE |
| 14 | host Complete 62 · sheet Done 382 | host −110→**−90** | ~3.7 | DONE |
| 15 | same as 14 | host −90 · French on | ~2.1 | DONE |

Evidence: `/tmp/p0815-fix/{live,after,diff,ref}/`

---

## Page 23 · cover / z-order inventory (`119:13397`)

**Target:** `23 · Cookbook Return` · INSTANCE · abs `(14288, 168)` · `440×956` · section child index **z=42** · `clipsContent=true`  
**Inner:** `W02 Cookbook` → main `115:8012` White Screen / W02 Cookbook · 16:44  
**Neighbors:** `22 New Recipe` @ x=13648 (dx −640) · no spill from 22 into 23.

### What is covering it (external)

| Node | id | type | abs box | cover of 23 | z vs 23 | Fix |
|------|-----|------|---------|-------------|---------|-----|
| **Missing Source Evidence** | `196:25740` | SECTION | **`(0, 6000)`** · `1200×1136` *(was conflict: `(0,6000)` vs `x=15168`)* | **0%** — clear of all White tree phones incl. 23 | Page-level sibling of White Theme section | **RESOLVED** — final position **below tree `(0, 6000)`**. Do **not** move phone `119:13397`. |
| White Theme · Interaction Tree | `113:7937` | SECTION | parent | 100% (parent) | n/a | ignore |

**Sibling phone overlaps:** **none** (no later section-child phones overlap abs bounds).  
**Labels:** `209:16132` Label/23 + `209:16133` Source/23 sit **above** frame (y=56/84) — not covering content.

### What is “covering” it (internal — content fail, not canvas stack)

| Layer | ids (sample) | Issue | Fix |
|-------|--------------|-------|-----|
| Recipe Grid Cards ×5 | `…180:13053` … `…180:13109` | IMAGE fills restored *(sibling fix-18-23)* | keep synced to **20** / `44-cookbook` |
| Image Overlay rects ×5 | `…180:12895` etc. | intentional title scrim opacity **0.2** over card bottoms | keep; only meaningful after photos exist |
| Title Overlay texts ×5 | `…180:12896` etc. | title text on cards | keep; sync copy to populated cookbook |

### Verdict / fix needed for 23

1. **P0 canvas:** ~~Relocate MSE~~ **DONE** — `196:25740` @ **`(0, 6000)`** below tree; 0 overlap with `119:13397` / White phones.  
2. **P0 content:** Sync internals to Cookbook Populated family (**20** / `44-cookbook`) — real photo cards *(sibling fix-18-23)*.  
3. Do not change tree x/y of `119:13397`.

---

## Parallel fix batches (for siblings)

**Rules:** disjoint page sets · content-only · no tree x/y · claim one batch per agent.

### Batch A — Cooking cluster · pages **03–06**
| # | frameId | Focus |
|---|---------|-------|
| 03 | `116:18239` | Rebuild Meal Plan Prompt (no strong ref) |
| 04 | `116:18290` | Match `cooking-final.png` · glassY polish |
| 05 | `116:18318` | Match `timer-final.png` |
| 06 | `116:18396` | Recipe Menu overlay vs Detail host |

### Batch B — Folders branch bodies · pages **08, 09, 11**
| # | frameId | Focus |
|---|---------|-------|
| 08 | `119:12665` | Body → 1 Beef card (`10-recent`) |
| 09 | `119:12726` | Body → 1 Beef card (`11-main`) |
| 11 | `130:14331` | Discover chrome vs w07 |

### Batch C — Editor sheets + New Recipe · pages **14, 15, 22**
| # | frameId | Focus |
|---|---------|-------|
| 14 | `119:12208` | Host clip · sheet = `35-category-v2` |
| 15 | `119:12241` | Host clip · French = `36-cuisine` |
| 22 | `119:13349` | Match editor nav (Close+Check) like 13 |

### Batch D — Search Results + Scope · pages **18, 19** *(USER-critical)*
| # | frameId | Focus |
|---|---------|-------|
| 18 | `115:18812` | **DONE** — USER jpg content + list-btn **r=14** (Enter match; conflict r=28 resolved) |
| 19 | `119:12608` | Populated host per `43-scope` |

### Batch E — Cookbook Return unobscure · page **23** *(blocker)*
| # | frameId | Focus |
|---|---------|-------|
| 23 | `119:13397` | **DONE** — MSE `196:25740` @ **(0, 6000)** below tree · photos/grid = 20 / `44-cookbook` |

### Batch F — Groceries row · pages **24–28**
| # | frameId | Focus |
|---|---------|-------|
| 24 | `115:18686` | Empty vs `01-groceries` |
| 25 | `115:18854` | w06 GM row padding |
| 26 | `119:11940` | List Menu on host |
| 27 | `119:12010` | Custom List chrome |
| 28 | `119:12120` | New Item sheet |

### Batch G — Meal Plan row · pages **29–32**
| # | frameId | Focus |
|---|---------|-------|
| 29 | `122:13366` | Centered **black** nav per `39-mealplan` |
| 30 | `119:12354` | Sync to 29 |
| 31 | `119:12435` | Menu vs `40-add-menu` |
| 32 | `119:12521` | M23 icons · `41-add-section` |

### Batch H — Settings mid · pages **33–40**
| # | frameId | Focus |
|---|---------|-------|
| 33–40 | `117:9975`…`117:10279` | UI detail pass; chrome unify; weak refs — structure/spacing only until stills land |

### Batch I — Settings late · pages **41–45**
| # | frameId | Focus |
|---|---------|-------|
| 41–45 | `117:10305`…`117:10461` | Same as H — paywall/household/timers/howto polish |

### Batch J — Settings end (has refs) · pages **46–49**
| # | frameId | Focus |
|---|---------|-------|
| 46 | `196:27930` | `import-share.png` |
| 47 | `196:28536` | Fill ack body (M18) |
| 48 | `117:10577` | `special-thanks.png` |
| 49 | `117:10603` | `whatsnew.png` |

---

## Launch order (recommended)

1. **Batch E** (23 cover) — canvas obscurity blocks visual QA of Return  
2. **Batch D** (18–19) — USER upload proves Search Results still wrong  
3. **Batch G** (29–32) — Meal Plan chrome class obvious  
4. **Batch B** (08/09/11) — content count fails  
5. **Batch C** (14/15/22) — sheets + New Recipe  
6. **Batch A** (03–06) — cooking cluster polish  
7. **Batch F** (24–28) — groceries  
8. **Batch J** then **H/I** — settings with refs first, weak-ref mid last  

**Safe parallelism:** A ∥ B ∥ C ∥ D ∥ F ∥ G ∥ J (and H∥I after J starts). **E** can run alone or ahead of all (only touches MSE section + 23 internals).

---

## Artifacts

| Path | Role |
|------|------|
| `/tmp/cookapp-figma-audit/PAGE-FIX-CHECKLIST.md` | This checklist |
| `/tmp/cookapp-figma-audit/final-table.md` | LIVE # → name → frameId |
| `/tmp/cookapp-figma-audit/refs-canonical/` | Preferred ref symlinks |
| `/tmp/cookapp-figma-audit/FULL-MISMATCH.md` | Prior mismatch detail |
