# Independent QA — Issue #10 missing-ref

## 2026-09-18 layout + long-page redo (owner: overlapping titles, 02/04c/41 screenshot-only)

Figma file `FHbikS2jILAeMv8mote0vD`, page `Cookapp · Recording Reproduction`, section `113:7937` White Theme · Interaction Tree.

### Title overlap

Extra states were stacked on the same x as 23 / 08c / 08f / 08d / 08e. Captions now sit on unique columns (640 grid). No two Label/Source texts share the same (x, y).

| Frame | x |
|---|---|
| 23 Cookbook Return | 14288 |
| 08b Layout | 14928 |
| 08c Appearance | 15568 |
| 08d List | 16208 |
| 08e Photo List | 16848 |
| 08f Sort | 17488 |
| 04b Timers | 18128 |
| 04c Ingredients | 18768 |
| 04d Step 2 | 19408 |
| 10 extra Date Added | 20048 |
| 16 extra Search Scoped | 20688 |
| 19 extra All Included | 21328 |
| 19 extra History Empty | 21968 |

Section size **22640 × 8261**. Groceries / Meal Plan / Settings rows shifted down by **3640** so the long 02 (h=3878) and 13 (h=4611) strips do not cover them.

### Long pages (vector, not PixelBase)

- **02 Recipe Detail** source `116:8866` / instance `116:18195`: PixelBase off. Stitched from `docs/ui-screenshots/missing-ref/02/IMG_4396–4402`. Height **3878**. Hero + Start Cooking + full 18 ingredients (green qty) + Marinate / Brown / Slow-cook + Description + Nutrition + bottom chrome.
- **04c Cooking Ingredients** `402:9340`: PixelBase `458:3821` off. Ingredients Sheet `402:9342` visible (IMG_4406). Unchecked circles, green quantities, check CTA.
- **41 Trial / Paywall** source `116:19068` / instance `117:10305`: PixelBase off; hero, timeline, social proof, Continue CTA, footer links visible. No dedicated 41 still in the pack (38–40 is Experiments / Account / Create Account); this is the reconstructed vector screen, not a screenshot fill.

### Screenshot fills removed on extras

04b/04d sheets unhidden (IMG_4405 empty timers, IMG_4407 step 2/21). 08b–08f PixelBase off, 08 base + menus on. 10/16/19 extra sources PixelBase off.

47 / 48 stay undrawn. Bottom NAV `77:237` not edited. No `resetOverrides()`.

### Independent QA (this redo)

| Page | Verdict |
|---|---|
| 02 Recipe Detail | **PASS** (re-QA after tab overlay + mint GLASS CTA) |
| 04c Ingredients | **PASS** (re-QA after inline green units) |
| 41 Trial / Paywall | **PASS** (vector, not PixelBase) |

## Prior batch (still on file)

22-page independent-compare batch PASS: 04 08 09 10 12 13 14 15 16 17 18 21 22 28 31 32 35 36 38 42 44 45.

Earlier redo PASS: 03 19 24 40 46 49.
