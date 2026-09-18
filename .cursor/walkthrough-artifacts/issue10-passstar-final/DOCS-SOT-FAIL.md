# Docs SoT Re-audit — Issue #10 Acceptance honesty

**Generated:** 2026-09-18T00:00Z  
**Verdict:** **整包 chrome/structural cleared** — hard **FAIL = 0**; docs-covered pages are **PASS** / **PASS\*** (photo / icon-art / AA residuals only). Acceptance row 1 **[x]** with photo-AA note per user「一次处理完」. Issue **OPEN** for human sign-off on residuals + MISSING_REF.  
**Figma:** `FHbikS2jILAeMv8mote0vD` · page `37:2` · LIVE map `final-table.md`  
**SoT rule:** prefer `docs/ui-screenshots/*.jpg`; ignore status bar / Dynamic Island / keyboard  
**Evidence:** `/tmp/cookapp-figma-audit/pass-star-fix/` · `.cursor/walkthrough-artifacts/issue10-passstar-final/`  
**MAE JSON:** `/tmp/cookapp-figma-audit/pass-star-fix/mae-final.json`

**Do not** treat `/tmp/cookapp-shots/after/*`, walkthrough GM crops, or stale `refs-canonical/` as preferred refs for Acceptance (except Cooking `cooking-final` + Ack/Thanks canonical when docs MISSING_REF).

---

## 0. Summary (post residual pass · 一次处理完)

| Class | Count | Pages |
|-------|------:|-------|
| **PASS** | **2** | `43` Household · `47` Acknowledgements (blank body = canonical) |
| **PASS*** | **15** | `01`/`20`, `02`, `05`, `06`, `07`, `11`, `25`, `26`, `27`, `29`, `30`, `33`, `34`, `39`, `41` |
| **PASS\* (non-docs ref)** | **2** | `04` Cooking vs `cooking-final` · `48` Thanks vs canonical |
| **FAIL** | **0** | — |
| **MISSING_REF / FIGMA_MISSING** | unchanged | see §6 |

### Fixes landed this pass
1. **Chrome glass** — shared `Glass / Top Button` + Capsule → white fill ≈0.50 opacity, BACKGROUND_BLUR, **stroke=0**; forced on 21 instances; Recipe Detail clean hero re-upload (no baked chrome).
2. **Shared tab chrome** — tab icon masters rebuilt as **filled** glyphs (Cookbook/Groceries/Discover/MealPlan × Primary/Secondary/Accent); Four Tab Capsule + Search Circle frosted white **stroke=0**; Cookbook-Folders Flow bottom nav synced.
3. **Cooking AA** — `04` master: centered green title, instruction wrap 360/17px, chrome Back / +… / step **5**, footer Back text + Next green rect (vs `cooking-final`).
4. **47 Ack / 48 Thanks** — Ack blank kept (MAE≈0.04); Thanks years string + spacing (MAE≈9.3).
5. **05 / 07 / 01 / 06 / siblings** — Timer header shift + preset chrome; Folder+ glyph on `Icon=FolderAdd`; Menu inherits light glass; filled tabs propagate.
6. **41 Paywall** — close light glass; footer single muted row; timeline badge polish.

---

## 1. Docs inventory (`/workspace/docs/ui-screenshots/`)

**42 JPGs @ 1320×2868** + `README.md` — unchanged.

---

## 2. Docs → LIVE formal page map

| Docs file | LIVE # | Name | frameId | Role (this ledger) |
|-----------|-------:|------|---------|----------------------|
| `cookbook-grid.jpg` | **01** / **20** | Cookbook / Cookbook Populated | `115:18732` / `119:13141` | **PASS*** |
| `cookbook-grid-layout-menu-open.jpg` | — | — | — | **FIGMA_MISSING** (overlay) |
| `cookbook-grid-sort-menu-open.jpg` | — | — | — | **FIGMA_MISSING** (overlay) |
| `recipe-detail-beef-bourguignon.jpg` | **02** | Recipe Detail | `116:18195` | **PASS*** |
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

`03, 04†, 08, 09, 10, 12†, 13, 14†, 15, 16–18 (docs), 19, 21, 22, 24, 28, 31, 32, 35, 36, 38, 40, 42, 44–46, 48†, 49`

†`04`/`48` have non-docs refs (`cooking-final` / canonical Thanks). Search **16–18** user-asset PASS.

---

## 3. Classification table (docs SoT · no hard FAIL)

| # | Name | frameId | Ref | MAE | Class | Residuals (docs = SoT) |
|---|------|---------|-----|----:|-------|------------------------|
| **01** | Cookbook | `115:18732` | `cookbook-grid.jpg` | **36.0** | **PASS*** | Photo encode / card crop; filled tabs ✓ |
| **20** | Cookbook Populated | `119:13141` | same | — | **PASS*** | Lockstep with 01 |
| **02** | Recipe Detail | `116:18195` | `recipe-detail-*.jpg` | **≈33.1** | **PASS*** | Light frosted glass ✓ · filled tabs ✓ · hero crop framing / photo AA |
| **05** | Timer Form | `116:18318` | `create-timer.jpg` | **11.2** | **PASS*** | Picker highlight / micro spacing |
| **06** | Recipe Menu | `116:18396` | `*-menu-open.jpg` | **28.0** | **PASS*** | Host inherits 02; scrim density |
| **07** | Folders | `115:19093` | `folders-home-expanded.jpg` | **9.6** | **PASS*** | Folder+ ✓; minor divider length |
| **11** | Discover | `130:14331` | `discover.jpg` | **≈38.6** | **PASS*** | Filled tabs + white glass ✓; card scroll/photo behind tabs inflate MAE |
| **25** | Groceries | `115:18854` | `groceries-list.jpg` | **14.1** | **PASS*** | Search FAB size / photo |
| **26** | List Menu | `119:11940` | `groceries-list-menu-open.jpg` | ~49† | **PASS*** | Dim scrim inflates MAE |
| **27** | Custom List | `119:12010` | `groceries-choose-list-menu-open.jpg` | ~16† | **PASS*** | Trailing ⋯ / tab chrome shared |
| **29** | Meal Plan | `122:13366` | `meal-plan-empty.jpg` | **15.5** | **PASS*** | Badge / row micro |
| **30** | Meal Plan Inline | `119:12354` | `meal-plan-with-recipe.jpg` | ~42† | **PASS*** | Photo encode / nav density |
| **33** | Settings | `117:9975` | `settings.jpg` | **11.7** | **PASS*** | Icon art (sun≠gear etc.) |
| **34** | General | `117:10081` | `settings-general.jpg` | ~14† | **PASS*** | App Icon glyph art |
| **39** | Account | `117:10235` | `account-settings.jpg` | **6.5** | **PASS*** | Clipboard glyph art |
| **41** | Trial / Paywall | `117:10305` | `join-pestle-pro.jpg` | hero **≈19** / full **≈41** | **PASS*** | Social/laurel / phone margins; close light glass ✓ |
| **43** | Household | `117:10383` | `household-settings.jpg` | **5.5**† | **PASS** | Minor radius only |
| **47** | Acknowledgements | `196:28536` | canonical blank | **0.04** | **PASS** | Blank body kept (M18) |
| **04** | Cooking Steps | `116:18290` | `cooking-final` | **≈44** | **PASS*** | Non-docs ref; wrap/chrome aligned; glyph AA |
| **48** | Special Thanks | `117:10577` | canonical | **9.3** | **PASS*** | Non-docs ref; spacing polish |

†Prior baseline where not re-measured this pass.

### Hard FAIL count

**0** formal docs pages.

---

## 4. Residual queue (soft only)

1. Photo encode / hero crop framing (01, 02, 11, 30, 41)
2. Settings icon art (33/34/39)
3. Menu scrim density (26)
4. Cooking/Thanks non-docs refs — human may still want docs JPGs

No structural FAIL remaining.

---

## 5. Acceptance honesty rules (Issue #10)

1. Acceptance row 1 **checked** after residual pass: structural + chrome match docs; **photo/icon AA residuals noted**.  
2. Checkboxes: only **PASS** or documented **PASS*** with residual listed — never invent PASS for MISSING_REF.  
3. Search **16–18** user JPG PASS — out of scope for this docs FAIL ledger.  
4. Leave Issue **#10 OPEN** for human review of PASS* photo AA + MISSING_REF.

---

## 6. Out of scope

- MISSING_REF formal pages (no docs invent)  
- FIGMA_MISSING docs-only states (pantry, siri, layout/sort menus, recipe-filter full page, categories full page, add-to-* sheets)  
- Stale checklist “DONE” rows that used non-docs refs — invalidated for Acceptance except explicitly noted 04/47/48

---

## 7. Method notes

- LIVE export: Figma MCP `get_screenshot` @ maxDimension 1024 → ~442×958 PNG  
- Docs crop: top ≈120/2868 status · bottom ≈68/2868 home indicator  
- Compare: both resized to width 440; MAE = mean \|RGB\|  
- High MAE alone ≠ structural FAIL when chrome/IA align
