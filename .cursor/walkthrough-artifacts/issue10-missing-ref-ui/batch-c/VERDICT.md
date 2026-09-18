# Batch C — Design QA (Issue #10)

Figma `FHbikS2jILAeMv8mote0vD` page `37:2` (`Cookapp · Recording Reproduction`).

Inspected assigned **instances** and **source components** via `$fig` / Plugin API. **No writes landed** after inspect: Figma MCP Education daily tool-call limit. Bottom NAV `77:237` not edited. Page **07** not overwritten. Did not edit 03, 04, 08, 09, 13–15, 22, 24, 28, 31, 32, 35–49.

**ROOT BUG confirmed:** instances 10 / 12 / 16 / 17 / 18 / 19 / 21 currently expose only a visible `PixelBase` rectangle. Real chrome exists on each source, all `visible: false`.

## Node ids

| Page | Instance | Source | PixelBase (visible) |
|---|---|---|---|
| 10 New Smart Folder | `184:13555` | `184:13290` | `412:5347` |
| 12 Filter (Following) | `119:12274` | `118:10902` | `410:8040` |
| 16 Search | `115:19051` | `115:8329` | `410:13337` |
| 17 Search Focused | `219:6885` | `216:16333` | `410:13340` |
| 18 Search Results | `115:18812` | `115:8090` | `410:13336` |
| 19 Scope Filter | `119:12608` | `118:11228` | `410:13338` |
| 21 Add Recipe Menu | `119:13222` | `118:11826` | `423:3835` |

### Existing extras (right of Cookbook row; keep)

| Extra | Instance | Source | x |
|---|---|---|---|
| 10 Date Added | `383:8618` | `383:8198` | 17328 |
| 16 Scoped | `383:8754` | `383:8221` | 17968 |
| 19 All Included | `383:8830` | `383:8253` | 18608 |
| 19 History Empty | `383:8921` | `383:8311` | 19248 |
| Menu=Scope Include All | — | `383:8369` | — |

Optional 12b / 07b Create Folder clone **not created** (rate limit). Do not steal 12.

---

### 10 · New Smart Folder `184:13555` ← `184:13290`

**VERDICT: FAIL**  
Screenshot fidelity: Instance children = PixelBase only. Source already has Cancel `209:16187`, Confirm `209:16189`, Folder Name “Folder Name” `184:13302`, All Recipes `184:13303`, “6 Recipes Found” `184:13313`, Add Filter `184:13314`, Ingredients→Name filter instances, Support Note `184:13410` — all hidden.  
Liquid Glass: Cancel/check exist as instances but not shown.  
Consistency: N/A until overlay removed.  
Control states: N/A.  
Violations: (1) `412:5347` PixelBase visible. (2) Real UI `visible: false`.  
Required redo: On **source** `184:13290` set PixelBase `visible: false`; unhide Cancel, Confirm, folder chrome, All Recipes, recipes-found pill, Add Filter rows, footer. Do not restyle 07.

---

### 12 · Filter `119:12274` ← `118:10902`

**VERDICT: FAIL**  
Screenshot fidelity: PixelBase only. This source is **Following / Source Filter**, not Folders/Create Folder. Hidden layers: Navigation Header `160:25748`, All Foods `160:25755` + label “All Foods”, Following header, RecipeTin Eats / Nagi, selected check. IMG_4424–4425 stay page **07** overlay — not applied.  
Liquid Glass: header/complete control hidden.  
Consistency: Must remain Following filter, not Smart Folder.  
Control states: N/A.  
Violations: (1) PixelBase `410:8040` visible. (2) Following UI hidden.  
Required redo: Hide PixelBase; unhide existing Following layers on `118:10902`. Optional extra **12b/07b** Create Folder clone at x≥17328 only — do not rename 12.

---

### 16 · Search `115:19051` ← `115:8329`

**VERDICT: FAIL** vs IMG_4441  
Screenshot fidelity: PixelBase only. Hidden: Navigation Header `161:15328`, History `360:8005`, Clear `360:8006`, History Card muffin `360:8007` (“Cheesy Zucchini Muffins”), list + Search bar. Empty State `216:16279` (“You don't have any recipes yet!”) must **stay hidden** (4441 is History, not empty).  
Liquid Glass: list circle + search pill exist, hidden.  
Consistency: Brand green Search title is in header instance, not visible.  
Control states: N/A.  
Violations: (1) PixelBase `410:13337`. (2) History UI hidden.  
Required redo: Hide PixelBase; unhide header, History/Clear, muffin card, list+search chrome; keep Empty State hidden.

---

### 17 · Search Focused `219:6885` ← `216:16333`

**VERDICT: FAIL** vs IMG_4442  
Screenshot fidelity: PixelBase only. Hidden: Title “Search” `360:8012`, More `360:13312`, List Button, Search Bar + placeholder. Empty State `216:16334` and keyboard/caret must **not** be shown (no keyboard in still). Close-on-search `219:16074` is on 4444, not 4442.  
Liquid Glass: more + search chrome hidden.  
Consistency: Green Search title not visible.  
Control states: N/A.  
Violations: (1) PixelBase `410:13340`. (2) Empty focused Search chrome hidden.  
Required redo: Hide PixelBase; unhide Title, More, list+search bar+placeholder; keep Empty State, Caret, Close hidden.

---

### 18 · Search Results `115:18812` ← `115:8090`

**VERDICT: FAIL** vs IMG_4444 (canvas still overlay)  
Screenshot fidelity: Instance = PixelBase. Source already has 6 result cards with “Matches Ingredient”, titles matching 4444, query `1` `216:16418`, list/search/clear/close — all hidden.  
Liquid Glass: chrome hidden.  
Consistency: Carrot tags live on cards.  
Control states: N/A.  
Violations: (1) PixelBase `410:13336` visible. (2) Grid + query chrome hidden.  
Required redo: Hide PixelBase; unhide cards + list/search/query `1`/clear/close. Keep `clipsContent` on source if already set.

---

### 19 · Scope Filter `119:12608` ← `118:11228`

**VERDICT: FAIL** vs IMG_4445  
Screenshot fidelity: PixelBase only. Hidden: Background / Search Populated `246:6755` (populated recipe grid — **wrong** for 4445) and Scope Menu `196:27558`. Still wants **empty Search** behind Include menu with History checked. Empty History extra already exists: `383:8921` ← `383:8311`.  
Liquid Glass: menu hidden.  
Consistency: Extra All Included `383:8830` is the all-checked variant; do not overwrite 19 with that.  
Control states: N/A.  
Violations: (1) PixelBase `410:13338`. (2) Menu hidden. (3) If unhidden blindly, populated background ≠ 4445 empty body.  
Required redo: Hide PixelBase; unhide Scope Menu; show empty Search chrome behind (hide populated grid inside `246:6755`, or reuse empty Search layers). Do not steal History Empty extra number.

---

### 21 · Add Recipe Menu `119:13222` ← `118:11826`

**VERDICT: FAIL** (no still in pack; overlay only)  
Screenshot fidelity: PixelBase only. Hidden (do not invent): W02 Cookbook `147:24794`, Scrim `147:24874`, Add Recipe Popover `147:24875`.  
Liquid Glass: popover hidden.  
Consistency: Cookbook instance under overlay.  
Control states: N/A.  
Violations: (1) PixelBase `423:3835`. (2) Cookbook + popover hidden.  
Required redo: Hide PixelBase; unhide Cookbook, Scrim, Add Recipe Popover only.

---

### Extras (polish-only this batch)

| Extra | VERDICT | Notes |
|---|---|---|
| Date Added `383:8618` | **PASS\*** (structure present, no PixelBase in instance tree) | Keep; not re-QA’d live (MCP blocked). Residual from prior: Cancel system blue, predicate wrap. |
| Scoped `383:8754` | **PASS\*** | Keep. |
| All Included `383:8830` | **PASS\*** | Keep. |
| History Empty `383:8921` | **PASS\*** | Keep; closer to 4445 empty-behind than 19 source populated bg. |

---

## Gate

**Batch C assigned pages 10, 12, 16, 17, 18, 19, 21: FAIL** — PixelBase still the only visible child on each instance.

Required redo (when MCP quota recovers), **sources only**:

1. `$fig.get('<PixelBase id>').set({ visible: false })` on each source listed above.  
2. Unhide real siblings; **do not** unhide Empty State on 16/17; **do not** show keyboard; **do not** unhide populated Search grid as 19’s 4445 background.  
3. Re-screenshot instances; then PASS/FAIL again.

Blocked this run: Figma MCP Education daily limit after inspect (`use_figma` ×2 succeeded; subsequent `use_figma` / `get_screenshot` rejected).
