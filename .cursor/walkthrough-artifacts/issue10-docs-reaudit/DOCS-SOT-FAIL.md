# Docs SoT Re-audit — Issue #10 Acceptance honesty

**Generated:** 2026-09-17T23:15Z  
**Verdict:** **整包未过** — Acceptance row 1 stays **[ ]**; **hard FAIL = 0** formal docs pages; prior structural FAIL **02 / 11 / 41** → **PASS***; remaining work = **PASS*** residuals + MISSING_REF  
**Figma:** `FHbikS2jILAeMv8mote0vD` · page `37:2` · LIVE map `final-table.md`  
**SoT rule:** prefer `docs/ui-screenshots/*.jpg`; ignore status bar / Dynamic Island / keyboard  
**Evidence sides:** `/tmp/cookapp-figma-audit/reaudit-sides/*-side.png` + `.cursor/walkthrough-artifacts/issue10-docs-reaudit/`  
**Post-fix evidence:** `issue10-fail-02/` · Discover re-fix comments · `issue10-paywall-41/`  
**MAE JSON (22:50Z baseline):** `/tmp/cookapp-figma-audit/reaudit-mae.json` (stale for 02/11/41 post-fix MAE)

**Do not** treat `/tmp/cookapp-shots/after/*`, walkthrough GM crops, or stale `refs-canonical/` as preferred refs for Acceptance.

---

## 0. Summary (post structural clear)

| Class | Count | Pages |
|-------|------:|-------|
| **PASS** | 1 | `43` |
| **PASS*** | 15 | `01`/`20`, `02`, `05`, `06`, `07`, `11`, `25`, `26`, `27`, `29`, `30`, `33`, `34`, `39`, `41` |
| **FAIL** | **0** | — |
| **MISSING_REF / FIGMA_MISSING** | unchanged | see §6 |

**Structural FAIL cleared (2026-09-17T23:00–23:12Z):**
- **11** Discover — card gaps + ghost tab → **PASS*** (MAE≈15.9; tab chrome residual)
- **41** Paywall — clean PNG hero + footer dedupe → **PASS*** (hero MAE≈8.3; full≈25.2)
- **02** Recipe Detail — chrome stack + Notes + clean hero → **PASS*** (MAE≈38.6; dark vs light glass residual)

**PASS\* ≠ full pass.** Acceptance row 1 stays unchecked; Issue #10 stays **OPEN**.

---

## 1. Docs inventory (`/workspace/docs/ui-screenshots/`)

**42 JPGs @ 1320×2868** + `README.md` — unchanged from prior ledger.

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

`03, 04, 08, 09, 10, 12†, 13, 14†, 15, 16–18 (docs), 19, 21, 22, 24, 28, 31, 32, 35, 36, 38, 40, 42, 44–49`

†docs exist but wrong page type for formal LIVE frame.

**Search 16–18:** keep **user-asset PASS**; docs still MISSING_REF — do not regress.

---

## 3. Classification table (docs SoT · no hard FAIL)

| # | Name | frameId | Ref | MAE | Class | Residuals (docs = SoT) |
|---|------|---------|-----|----:|-------|------------------------|
| **01** | Cookbook | `115:18732` | `cookbook-grid.jpg` | **35.9**† | **PASS*** | Tab labels/outline icons vs docs fill+active-only; title glyph weight; photo encode |
| **20** | Cookbook Populated | `119:13141` | same | — | **PASS*** | Lockstep with 01 |
| **02** | Recipe Detail | `116:18195` | `recipe-detail-*.jpg` | **≈38.6** | **PASS*** | Dark glass + white icons vs docs light frosted + black; hero crop framing; shared tab chrome |
| **05** | Timer Form | `116:18318` | `create-timer.jpg` | **10.4**† | **PASS*** | Top padding / preset chrome / picker highlight |
| **06** | Recipe Menu | `116:18396` | `*-menu-open.jpg` | **37.1**† | **PASS*** | Glass blur/scrim; Scale or Convert / Note text on host |
| **07** | Folders | `115:19093` | `folders-home-expanded.jpg` | **9.4**† | **PASS*** | Folder+ (docs has +) vs plain folder circle; divider length |
| **11** | Discover | `130:14331` | `discover.jpg` | **≈15.9** | **PASS*** | Shared tab chrome (outline / white glass); card gaps + ghost tab **cleared** |
| **25** | Groceries | `115:18854` | `groceries-list.jpg` | **14.0**† | **PASS*** | Tab fill vs outline; search FAB size; bar glass |
| **26** | List Menu | `119:11940` | `groceries-list-menu-open.jpg` | **49.4**† | **PASS*** | Heavy dim scrim (inflates MAE); menu y; tab chrome |
| **27** | Custom List | `119:12010` | `groceries-choose-list-menu-open.jpg` | **15.7**† | **PASS*** | Trailing ⋯ still visible (docs hides); tab chrome |
| **29** | Meal Plan | `122:13366` | `meal-plan-empty.jpg` | **16.9**† | **PASS*** | Outline tab icons; row spacing; badge style |
| **30** | Meal Plan Inline | `119:12354` | `meal-plan-with-recipe.jpg` | **42.4**† | **PASS*** | Nav labels vs icon-only; Dinner hierarchy; photo encode |
| **33** | Settings | `117:9975` | `settings.jpg` | **11.7**† | **PASS*** | General sun≠gear; How To book≠bookmark; extra Import row |
| **34** | General | `117:10081` | `settings-general.jpg` | **13.6**† | **PASS*** | App Icon glyph ≠ pestle; search-engine selector chevron |
| **39** | Account | `117:10235` | `account-settings.jpg` | **6.6**† | **PASS*** | Clipboard glyph ≠ overlapping-squares copy |
| **41** | Trial / Paywall | `117:10305` | `join-pestle-pro.jpg` | hero **≈8.3** / full **≈25.2** | **PASS*** | Social/laurel + timeline icon fill; phone chrome/margins inflate full MAE |
| **43** | Household | `117:10383` | `household-settings.jpg` | **5.5**† | **PASS** | Minor pill↔rect radius / spacing only |

†22:50Z re-audit MAE (baseline). Post-fix MAE shown for **02 / 11 / 41**.

### Hard FAIL count

**0** formal docs pages. Structural violations on **02 / 11 / 41** cleared; all three remain **PASS*** for residual chrome / photo / material deltas.

---

## 4. Residual queue (no structural FAIL)

Priority for human / polish (not Acceptance blockers as hard FAIL):

1. **Dark vs light glass chrome** — esp. **02** Recipe Detail (intentional dark glass vs docs light frosted)
2. **Shared tab chrome** — fill vs outline icons / glass across **01 / 11 / 25 / 29 / 30** (and siblings)
3. **Cooking AA** — **04** wrap residual (docs MISSING_REF; recording GM)
4. **Ack / Thanks** — **47** M18 blank kept · **48** Special Thanks MAE~11–12
5. Other **PASS*** polish (Folder+, icon art, photo encode, scrim density)

No large Figma redesigns unless a quick win.

---

## 5. Acceptance honesty rules (Issue #10)

1. Acceptance row 1 stays **unchecked** until human signs 整包 — **PASS\* ≠ full pass**.  
2. Checkboxes: only **PASS** or documented **PASS*** with residual listed — never invent PASS for MISSING_REF.  
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
- High MAE alone does not imply structural FAIL when chrome/IA align; structural FAIL requires broken chrome, ghosted nav, corrupted assets, or duplicated strings — those are **cleared** for **02 / 11 / 41**
