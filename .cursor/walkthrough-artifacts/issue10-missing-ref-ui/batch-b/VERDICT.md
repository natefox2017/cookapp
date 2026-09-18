# Batch B — Design QA (independent)

File `FHbikS2jILAeMv8mote0vD` page `37:2`. QA-only: **no** source edits this pass. Bottom NAV `77:237` and pages 03/08/09/10/12/16–21/24/28/31/32/35–49 not in scope.

**Live Figma evidence:** `use_figma` / `get_metadata` / `get_screenshot` all returned Education-plan MCP rate-limit this session. No new Figma export PNGs. Comparison is owner stills in `docs/ui-screenshots/missing-ref/` vs implementer notes in the prior batch-b file (claimed PixelBase hidden; constructed layers rebuilt). Per `ui-qa-agent-gate.mdc`, insufficient live glass/token evidence **fails** any screen that still has documented 1:1 residuals.

**PNG mapping (ignore status bar / Dynamic Island / keyboard):**

| Page | Owner stills | Notes |
|---|---|---|
| 04 | `04/IMG_4404.PNG` | Hero stew peek, dual glass list+timer, voice, **1/21**, green title, instruction, **Say "Close"** / **Say "Next"**. Green: beef / large / 12 hours / 24 hours. |
| 04b | `04/IMG_4405.PNG` | Timers + glass +, empty “No active timers”, photo peek. Extra — keep right of 01–49. |
| 04c | `04/IMG_4406.PNG` | Ingredients checklist; **qty/unit green**. Extra. |
| 04d | `04/IMG_4407.PNG` | **2/21**, **Back** / **Next** (not Say Close), green **beef, carrots**. Extra. |
| 13 | `13-15/IMG_4428–4436.PNG` + MP4 | Tall stitch: X+check, green title, Total Time **3h10m**, cover, red-minus ingredients, full steps, nutrition, Source, Rating, Manage, Delete. |
| 14 | **not** `IMG_4437` | `IMG_4437` = **Manage Fields**. Category full list = `22/IMG_4452` + `IMG_4453` (Alcoholic Beverage→Vegetarian, Search Categories). |
| 15 | `13-15/IMG_4438` + `IMG_4439` | French ✓, Search Cuisines; editor context has **stew photo peek**. Empty New Recipe cuisine = `22/IMG_4454–4455` (no photo peek). |
| 22 | `22/IMG_4448–4455` + MP4 | Empty form stitch + time picker + photo menu + Category/Cuisine sheets. |

Claimed nodes (implementer; not re-verified live):

| Page | Instance | Source |
|---|---|---|
| 04 | `116:18290` | `116:8908` |
| 13 | `119:12180` | `118:10814` |
| 14 | `119:12208` | `118:10840` |
| 15 | `119:12241` | `118:10871` |
| 22 | `119:13349` | `118:11949` |
| 04b | — | `402:9328` |
| 04c | — | `402:9340` |
| 04d | — | `402:9387` |

---

## 04 Cooking Steps — instance `116:18290` ← source `116:8908`

**VERDICT: FAIL**  
Screenshot fidelity: FAIL — owner `IMG_4404` requires green range fills on **beef / large / 12 hours / 24 hours**. Implementer recorded those phrases as unstyled. Height locked 956 vs cooking is one viewport (OK) but highlight miss is 1:1 fail.  
Liquid Glass: claimed dual capsule + voice circle (blur + hairline); content sheet opaque. **Not live-exported this QA.**  
Consistency (shared chrome/tokens): brand green title + 1/21 pill matches 04d pattern.  
Control states: only **default** named on Close/Next/Voice; missing hover / active / disabled / loading.  
Violations:  
1. Instruction text missing Pestle green highlights (`IMG_4404`).  
2. Control-state variants not named on new chrome.  
3. No Figma screenshot this QA to prove PixelBase is still hidden.  
Required redo: `setRangeFills` on those four phrases on source `116:8908`; add named states on Close/Next/Voice; re-export source (not PixelBase) and side-by-side vs `IMG_4404`.

---

## 04b Timers — source `402:9328`

**VERDICT: FAIL**  
Screenshot fidelity: structure claimed (green Timers, glass +, empty copy, photo peek) vs `IMG_4405`; **no live frame**.  
Liquid Glass: + circle chrome only — claimed; unverified.  
Consistency (shared chrome/tokens): extra frame, not 01–49 number — OK if x stays right (`14928` claimed).  
Control states: + needs default/hover/active/disabled/loading.  
Violations:  
1. Insufficient live evidence.  
2. Control states incomplete if only default.  
Required redo: export `402:9328`, confirm stew peek + glass +, named states on +.

---

## 04c Cooking Ingredients — source `402:9340`

**VERDICT: FAIL**  
Screenshot fidelity: FAIL — owner `IMG_4406` greens quantities/units (800g/1.6 lb, 4–5 cm, ~300g/10oz, Note n, …). Implementer: qty not green-tokenized.  
Liquid Glass: check chrome only; list is content (opaque) — correct if true.  
Consistency (shared chrome/tokens): qty green must match grocery/editor ingredient green.  
Control states: circle checks default/hover/active (checked)/disabled.  
Violations:  
1. Quantity/unit/note tokens not green.  
2. No live export.  
Required redo: tokenize ingredient qty green on `402:9340`; export vs `IMG_4406`.

---

## 04d Cooking Step 2/21 — source `402:9387`

**VERDICT: FAIL**  
Screenshot fidelity: FAIL — `IMG_4407` greens **beef, carrots**; implementer: body highlights missing. Footer is **Back / Next**, not Say Close.  
Liquid Glass: same chrome as 04; Next is solid brand green (content CTA, not glass slab) — matches owner.  
Consistency: 2/21 pill must match 1/21.  
Control states: Back default/hover/active/disabled; Next default/hover/active/disabled/loading.  
Violations:  
1. Missing green **beef, carrots**.  
2. No live export.  
Required redo: range-fill those words; export `402:9387` vs `IMG_4407`. Keep frame to the right; do not steal 05–49.

---

## 13 Recipe Editor — instance `119:12180` ← source `118:10814`

**VERDICT: FAIL**  
Screenshot fidelity: FAIL — owner stitch `4428–4436` is a **full** editor: name+desc card, 3h10m, cover photo, **all** red-minus ingredients through parsley, Add Recipe | New Ingredient, ingredient sections, **every** step section (Marinate / Brown / Slow-cook) with full copy, Add New Step Section, Categories, Cuisine, Servings ± 5, Nutrition table (Serving Size through Protein), Source recipetineats, 4/5 stars, Manage Fields, Delete Recipe. Implementer: height 3002 but “step copy condensed vs every 4428–4436 line.” Condensed copy ≠ 1:1.  
Liquid Glass: X + check only; cards opaque — correct intent.  
Consistency: must share cards with 22, minus filled vs empty.  
Control states: minus/plus/Add Recipe/New Ingredient/New Step/Manage/Delete — need full named set, not default-only.  
Violations:  
1. Condensed/omitted step + ingredient lines vs owner stitch.  
2. Grow-height must include Servings + full nutrition + Source + Rating (`4435–4436`), not a shortened tail.  
3. Control states incomplete.  
4. No live export (PixelBase could still win on instance).  
Required redo: expand `118:10814` to full stitch copy; hide PixelBase on source; export long frame vs concatenated `4428–4436` (ignore island).

---

## 14 Category — instance `119:12208` ← source `118:10840`

**VERDICT: FAIL**  
Screenshot fidelity: FAIL vs correct refs `IMG_4452` + `IMG_4453` (full list Alcoholic Beverage → Vegetarian, empty radios, Search Categories, + and check). **Do not** treat `IMG_4437` as this page (`4437` = Manage Fields). Implementer residuals: gray peek (OK for New Recipe context `4452`; **FAIL** if this source is editor-over-stew and peek is gray). List completeness unverified live.  
Liquid Glass: + / check / search capsule — claimed.  
Consistency: same sheet as 15 (title green vs centered black when scrolled — owner uses green **Category** at rest `4452`, black centered **Category** when scrolled `4453`).  
Control states: + / check / radio / search default/hover/active/disabled.  
Violations:  
1. Wrong ref if built from `4437`.  
2. Scrolled header state (`4453`) not claimed as extra (do not steal 01–49; add 14b to the right if needed).  
3. No live export; radios/search unverified.  
Required redo: match `4452` as canonical 14; optionally 14b for `4453` to the right; hide PixelBase; export.

---

## 15 Cuisine — instance `119:12241` ← source `118:10871`

**VERDICT: FAIL**  
Screenshot fidelity: FAIL — `IMG_4438` is **French selected** + stew **photo peek** + green Cuisine + Search Cuisines. Implementer: “French ✓, Western included” but “peek gray.” Gray peek fails editor-context still. `IMG_4439` is scrolled (centered Cuisine, Western visible). Empty-form cuisine (`4454` none selected, `4455` scrolled) is **22** extras, not a substitute for 15.  
Liquid Glass: + / check / search capsule.  
Consistency: radios + search must match 14.  
Control states: radios (unselected / selected / hover / disabled), + / check.  
Violations:  
1. Missing stew photo peek vs `4438`.  
2. Scrolled `4439` not a claimed extra.  
3. No live export.  
Required redo: restore photo peek on `118:10871`; French check; keep Western on list; 15b to the right for `4439` if needed.

---

## 22 New Recipe — instance `119:13349` ← source `118:11949`

**VERDICT: FAIL**  
Screenshot fidelity: FAIL — `IMG_4448` empty form (Name/Description, Add Time, Cover + photo glyph, Ingredients split, red-minus Steps, Add New Step Section). `4449` continues Categories / Cuisine / Manage / Delete. Implementer: cover glyph is **simple rect vs photo icon**. Time picker (`4450`) and Add Photo menu (`4451`) not claimed as extras. Height 1200 may clip `4448+4449` stitch.  
Liquid Glass: X/check only; form cards opaque. Photo menu is transient chrome (glass).  
Consistency: same kit as 13 empty.  
Control states: X/check/plus/minus/CTAs need full named set.  
Violations:  
1. Cover camera glyph not 1:1.  
2. Time-open + photo-menu + Category/Cuisine from empty recipe belong as **22b–22e to the right**, not stolen 14/15 numbers (14/15 stay editor-filled).  
3. PixelBase hide unverified live.  
Required redo: SVG/cover icon on `118:11949`; stitch 4448–4449; extras right of Cookbook for 4450/4451/4452–4455 if 14/15 sources stay editor-peek.

---

## Cross-cut

| Check | Result |
|---|---|
| Screenshot fidelity | **FAIL** (highlights, condensed 13, peek, cover glyph, mapping) |
| Liquid Glass | **FAIL** (intent OK in notes; no live chrome proof this QA) |
| Consistency (shared chrome/tokens) | **FAIL** until 13/22 and 14/15 are exported side-by-side |
| Control states | **FAIL** — default-only; need default/hover/active/disabled/loading on added controls |
| Shared NAV / out-of-claim pages | Assumed untouched (not inspected live) |

**Batch B gate: FAIL.** Do not mark Issue #10 Batch B complete. Re-run this brief after source fixes + live `.screenshot()` of `116:8908`, `118:10814`, `118:10840`, `118:10871`, `118:11949`, `402:9328`, `402:9340`, `402:9387`.

### Screenshot notes for parent

- Owner refs used (not Figma exports): `04/IMG_4404–4407`, `13-15/IMG_4428–4436`, `13-15/IMG_4438–4439`, `22/IMG_4448–4455`.
- `13-15/IMG_4437` = Manage Fields (editor), **not** Category.
- Figma live captures: **none this QA** (MCP rate limit). Prior implementer did not leave export PNGs under `batch-b/`.
