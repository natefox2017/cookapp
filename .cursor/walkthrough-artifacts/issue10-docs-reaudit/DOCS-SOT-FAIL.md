# Docs SoT Re-audit — Issue #10 Acceptance honesty

**Generated:** 2026-09-17T22:50Z  
**Verdict:** **整包未过** — Acceptance row 1 stays **[ ]**; remaining **FAIL = 02** (**11** Discover + **41** Paywall → **PASS***); most prior FAIL pages now **PASS*** (chrome / photo / spacing residual)  
**Figma:** `FHbikS2jILAeMv8mote0vD` · page `37:2` · LIVE map `final-table.md`  
**SoT rule:** prefer `docs/ui-screenshots/*.jpg`; ignore status bar / Dynamic Island / keyboard  
**Evidence sides:** `/tmp/cookapp-figma-audit/reaudit-sides/*-side.png` + `.cursor/walkthrough-artifacts/issue10-docs-reaudit/`  
**MAE JSON:** `/tmp/cookapp-figma-audit/reaudit-mae.json`

**Do not** treat `/tmp/cookapp-shots/after/*`, walkthrough GM crops, or stale `refs-canonical/` as preferred refs for Acceptance.

---

## 0. Re-audit summary (vs prior all-FAIL ledger)

| Class | Count | Pages |
|-------|------:|-------|
| **PASS** | 1 | `43` |
| **PASS*** | 14 | `01`/`20`, `05`, `06`, `07`, `11`, `25`, `26`, `27`, `29`, `30`, `33`, `34`, `39`, `41` |
| **FAIL** | 1 | `02` |
| **MISSING_REF / FIGMA_MISSING** | unchanged | see §6 |

Batches A/B/C/D claimed DONE; independent `get_screenshot` + MAE vs docs **does not** support full Acceptance check. Remaining formal FAIL: **02**. **11** Discover fixed 2026-09-17T23:00Z → **PASS***. **41** Paywall fixed 2026-09-17T23:05Z → **PASS*** (hero PNG + footer dedupe; evidence `issue10-paywall-41/`).

---

## 1. Docs inventory (`/workspace/docs/ui-screenshots/`)

**42 JPGs @ 1320×2868** + `README.md` — unchanged from prior ledger.

---

## 2. Docs → LIVE formal page map

| Docs file | LIVE # | Name | frameId | Role (this re-audit) |
|-----------|-------:|------|---------|----------------------|
| `cookbook-grid.jpg` | **01** / **20** | Cookbook / Cookbook Populated | `115:18732` / `119:13141` | **PASS*** |
| `cookbook-grid-layout-menu-open.jpg` | — | — | — | **FIGMA_MISSING** (overlay) |
| `cookbook-grid-sort-menu-open.jpg` | — | — | — | **FIGMA_MISSING** (overlay) |
| `recipe-detail-beef-bourguignon.jpg` | **02** | Recipe Detail | `116:18195` | **FAIL** |
| `recipe-detail-beef-bourguignon-menu-open.jpg` | **06** | Recipe Menu | `116:18396` | **PASS*** |
| `create-timer.jpg` | **05** | Timer Form | `116:18318` | **PASS*** |
| `add-to-meal-plan.jpg` | ≠03 | day-pick sheet | — | **FIGMA_MISSING** |
| `add-to-meal-plan-with-recipe.jpg` | ≠03 | day-pick w/ recipe | — | **FIGMA_MISSING** |
| `add-to-groceries.jpg` / `-2.jpg` | — | groceries sheet | — | **FIGMA_MISSING** |
| `folders-home-expanded.jpg` | **07** | Folders | `115:19093` | **PASS*** |
| `discover.jpg` | **11** | Discover | `130:14331` | **PASS*** |
| `recipe-filter*.jpg` (5) | ≠12 | Filter full-page | — | **FIGMA_MISSING** |
| `categories-list*.jpg` | ≠14 | Categories full page | — | **FIGMA_MISSING** |
| `groceries-list.jpg` | **25** | Groceries | `115:18854` | **PASS*** |
| `groceries-list-menu-open.jpg` | **26** | List Menu | `119:11940` | **PASS*** |
| `groceries-choose-list-menu-open.jpg` | **27** | Custom List / Choose List | `119:12010` | **PASS*** |
| `pantry.jpg` / `pantry-edit-mode.jpg` | — | Pantry | — | **FIGMA_MISSING** |
| `meal-plan-empty.jpg` | **29** | Meal Plan | `122:13366` | **PASS*** |
| `meal-plan-with-recipe.jpg` | **30** | Meal Plan Inline | `119:12354` | **PASS*** |
| `settings.jpg` (+ `settings-footer.jpg`) | **33** | Settings | `117:9975` | **PASS*** |
| `settings-general.jpg` | **34** | General | `117:10081` | **PASS*** |
| `account-settings.jpg` | **39** | Account | `117:10235` | **PASS*** |
| `join-pestle-pro.jpg` | **41** | Trial / Paywall | `117:10305` | **PASS*** |
| `paywall-*.jpg` | **41** | Paywall alts | `117:10305` | alt compositions |
| `household-settings.jpg` | **43** | Household | `117:10383` | **PASS** |
| `siri-shortcuts.jpg` | — | Siri Shortcuts | — | **FIGMA_MISSING** |

### LIVE pages with **no** docs SoT (MISSING_REF — do not invent)

`03, 04, 08, 09, 10, 12†, 13, 14†, 15, 16–18 (docs), 19, 21, 22, 24, 28, 31, 32, 35, 36, 38, 40, 42, 44–49`

†docs exist but wrong page type for formal LIVE frame.

**Search 16–18:** keep **user-asset PASS**; docs still MISSING_REF — do not regress.

---

## 3. Classification table (fresh LIVE · MAE @ ~440w · status/home cropped)

| # | Name | frameId | Ref | MAE | Class | Remaining deltas (docs = SoT) |
|---|------|---------|-----|----:|-------|-------------------------------|
| **01** | Cookbook | `115:18732` | `cookbook-grid.jpg` | **35.9** | **PASS*** | Grid photos + 6th Kale present. Residual: tab labels/outline icons vs docs fill+active-only; title glyph weight; high MAE partly photo encode |
| **20** | Cookbook Populated | `119:13141` | same | — | **PASS*** | Lockstep with 01 (not re-exported this pass; treat as sibling) |
| **02** | Recipe Detail | `116:18195` | `recipe-detail-*.jpg` | **43.0** | **FAIL** | Overlapping Back / broken Cart+Calendar+More chrome; missing `(Note n)` markers; Start Cooking / hero gap vs docs |
| **05** | Timer Form | `116:18318` | `create-timer.jpg` | **10.4** | **PASS*** | Back/Start capsules · Untitled · segmented presets · Count OFF — structure OK. Residual: top padding / preset chrome / picker highlight |
| **06** | Recipe Menu | `116:18396` | `*-menu-open.jpg` | **37.1** | **PASS*** | 8-item Edit→Delete + red trash present. Residual: host inherits 02; glass blur/scrim; Scale or Convert / Note text on host |
| **07** | Folders | `115:19093` | `folders-home-expanded.jpg` | **9.4** | **PASS*** | Recently Added + expanded Categories/Cuisines + counts. Residual: Folder+ (docs has +) vs plain folder circle; divider length |
| **11** | Discover | `130:14331` | `discover.jpg` | **15.9** | **PASS*** | No Filter; cards **184×408 @ y168/368/568/768 · gap 16** (docs ~15); clean docs crops (cleared fill overrides that baked gaps+nav). Residual: shared tab chrome (outline icons / white glass vs docs translucent) |
| **25** | Groceries | `115:18854` | `groceries-list.jpg` | **14.0** | **PASS*** | List body / Note / green qty match. Residual: tab fill vs outline; search FAB size; bar glass |
| **26** | List Menu | `119:11940` | `groceries-list-menu-open.jpg` | **49.4** | **PASS*** | Choose/Hide/Share/Clear + icons + red Clear. Residual: heavy dim scrim (inflates MAE); menu y; tab chrome |
| **27** | Custom List | `119:12010` | `groceries-choose-list-menu-open.jpg` | **15.7** | **PASS*** | Choose List popover (家庭 / 每日任务 / Groceries / + New List). Residual: trailing ⋯ still visible (docs hides); tab chrome |
| **29** | Meal Plan | `122:13366` | `meal-plan-empty.jpg` | **16.9** | **PASS*** | Past→Today day window + glass-over-food + household **5**. Residual: outline tab icons; row spacing; badge style |
| **30** | Meal Plan Inline | `119:12354` | `meal-plan-with-recipe.jpg` | **42.4** | **PASS*** | Tomorrow Beef card + photo present. Residual: nav labels vs icon-only; Dinner hierarchy; photo encode MAE |
| **33** | Settings | `117:9975` | `settings.jpg` | **11.7** | **PASS*** | Pro=Active; Chrome Extension; How To; Siri mic. Residual: General sun≠gear; How To book≠bookmark; extra Import row |
| **34** | General | `117:10081` | `settings-general.jpg` | **13.6** | **PASS*** | App Icon thumb present; Timers ON; Auto-convert OFF. Residual: App Icon glyph ≠ pestle; search-engine selector chevron |
| **39** | Account | `117:10235` | `account-settings.jpg` | **6.6** | **PASS*** | Divider + green copy control present. Residual: clipboard glyph ≠ overlapping-squares copy |
| **41** | Trial / Paywall | `117:10305` | `join-pestle-pro.jpg` | **25.2** | **PASS*** | Hero PNG fidelity (hero MAE≈8.3) + single footer row. Residual: social laurel vectors / timeline icon fill / docs chrome. Evidence `issue10-paywall-41/` |
| **43** | Household | `117:10383` | `household-settings.jpg` | **5.5** | **PASS** | Existing `ba d` manage (Rename / Owner / Delete) — IA fixed. Minor pill↔rect radius / spacing only |

### Confirmed remaining FAIL count

**1 formal page** still FAIL vs docs:  
`02`

---

## 4. Priority residual queue (single agent)

1. **02** Recipe Detail — repair Back/Cart+/Calendar/More chrome; restore Note markers  
2. Then polish **PASS*** chrome (shared tab icon set: fill vs outline; 01/11/25/29/30)

---

## 5. Acceptance honesty rules (Issue #10)

1. Acceptance row 1 stays **unchecked** until human signs 整包.  
2. Checkboxes: only **PASS** or documented **PASS*** with residual listed — never check remaining **FAIL**.  
3. Search **16–18** user JPG PASS — out of scope for this docs FAIL ledger.  
4. Leave Issue **#10 OPEN**.

---

## 6. Out of scope

- MISSING_REF formal pages (no docs invent)  
- FIGMA_MISSING docs-only states (pantry, siri, layout/sort menus, recipe-filter full page, categories full page, add-to-* sheets)  
- Stale checklist “DONE” rows that used non-docs refs — invalidated for Acceptance

---

## 7. Method notes

- LIVE export: Figma MCP `get_screenshot` @ maxDimension 2048 → 442×958 PNG  
- Docs crop: top ≈120/2868 status · bottom ≈68/2868 home indicator  
- Compare: both resized to width 440; MAE = mean \|RGB\|  
- MAE alone understates structural FAIL when chrome roughly aligns (historical 43); this pass **43** is true structural PASS; **02/11/41** fail structurally despite (or because of) high MAE  
