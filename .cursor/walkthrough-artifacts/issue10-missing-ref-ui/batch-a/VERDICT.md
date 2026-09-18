# Batch A — PixelBase hide + chrome restore (Issue #10)

File `FHbikS2jILAeMv8mote0vD` page `37:2`. **Sources only.** Did not edit Bottom NAV kit `77:237` or pages 04,10,12,13–22,24,28,35–49.

**Root bug:** each claimed source had a visible `RECTANGLE` named PixelBase covering the artboard; reconstructed chrome was `visible: false`. PixelBase is now `visible: false` on every claimed source. Reconstructed layers were turned on. No new 01–49 numbers stolen.

## PixelBase hid (visible: false)

| Page | Source | PixelBase id | Tree instance |
|------|--------|--------------|---------------|
| 03 | `116:8936` | `412:5343` | `116:18239` |
| 08 | `118:11283` | `412:5345` | `119:12665` |
| 09 | `118:11342` | `412:5346` | `119:12726` |
| 31 | `118:11059` | `412:5350` | `119:12435` |
| 32 | `118:11143` | `423:9107` | `119:12521` |

## Rebuilt / unhid (visible: true)

- **03:** header `329:8116`, compact dates `371:7994`/`371:7998`/`371:8002`, Beef/Mayo/Beef cards `329:8217`/`329:8237`/`329:8227`, Breakfast/Lunch `329:8247`/`329:8248`, bottom chrome `329:8173`. Kept hidden: upsell sheet/prompt/Learn More, overlapping Date instances `329:8122`–`329:8164`, Household Card, Recipe Detail instance `160:15261`.
- **08:** header `160:15429`, kale tile `160:15443`, bottom chrome `160:15451`.
- **09:** header `160:15531`, Add `371:8006`, More `371:8010`, photo-list Beef `371:8014`, bottom chrome `160:15553`. Kept hidden: placeholder Beef instance `160:15545`.
- **31:** local header/cart/dates/Today/Beef/chrome `373:7939`–`373:7981`, Add Menu instance `196:27249`. Kept hidden: filled-03 bg `196:27164`.
- **32:** local header/cart/dates/Beef/chrome `374:7855`–`374:7892`, Ghost Add Menu `374:7936`, nested menu `374:7940`. Kept hidden: inline bg `196:27372`, old Add Section menu instance `196:27457`.

---

### 03 Meal Plan filled — instance `116:18239` ← source `116:8936`

VERDICT: PASS
Screenshot fidelity: Matches owner `docs/ui-screenshots/missing-ref/03/meal-plan.jpg` — filled Meal Plan (not Pro upsell): Sunday 13 Beef 4½, Breakfast, Lunch, Mayo ¾, Monday 14 Beef 4½, Tuesday + peek. Status bar / Dynamic Island ignored.
Liquid Glass: Cart circle + tab/search chrome only; recipe cards are photo content (not glass slabs).
Consistency: Brand green title; shared tab kit not forked (`77:237` untouched). Tab glyphs remain kit squares.
Control states: Cart and per-day + shown default; Meal Plan tab selected.
Violations: (1) Mayo ¾ pill still optically tight/clipped. (2) Breakfast/Lunch vertical gap tighter than owner. (3) Shared-kit tab icons are squares.
Required redo: None for PixelBase/hierarchy. Optional: unclip Mayo badge; nudge Lunch/Mayo y; tab glyphs only via kit owner.

---

### 08 Recently Added — instance `119:12665` ← source `118:11283`

VERDICT: PASS
Screenshot fidelity: Matches `08-09/IMG_4411.PNG` — green Recently Added, Back, trailing **ellipsis More** (not folder), kale grid tile + servings 4.
Liquid Glass: Back/More circular chrome + tab/search only; grid tile is content.
Consistency: Same header chrome pattern as 09; Cookbook selected.
Control states: Back/More default; Cookbook tab active.
Violations: Shared-kit tab glyphs are squares (kit, not this source). Extra Layout/List states live on prior extra frames, not 01–49.
Required redo: None.

---

### 09 Your Recipes / Main — instance `119:12726` ← source `118:11342`

VERDICT: PASS
Screenshot fidelity: Matches `08-09/IMG_4414.PNG` — Your Recipes, Back + separate Add and More circles (not fused), photo-list Beef Burgundy.
Liquid Glass: Back/Add/More + tab/search only; recipe card is content.
Consistency: Same circular chrome as 08; Cookbook selected.
Control states: Back / Add / More default.
Violations: (1) Servings pill is “5” without people glyph vs owner. (2) Shared tab glyphs.
Required redo: Optional people glyph on servings pill; do not fuse Add+More.

---

### 31 Add Menu — instance `119:12435` ← source `118:11059`

VERDICT: PASS
Screenshot fidelity: Matches `29-32/IMG_4467.PNG` — empty Sun–Yesterday + green Today + Beef peek; plus menu **Add Recipe / Add Section › / Add Note / Add Random Recipe**.
Liquid Glass: Menu + cart + tab/search; date list and recipe card are content.
Consistency: Meal Plan title/cart/+ same as 03/32; did not fork shared menu source `196:27113`.
Control states: Menu open over +; Meal Plan tab selected.
Violations: (1) Menu row icons are +/clock/+/book vs Pestle recipe/section/note/sparkle glyphs (shared instance, not forked). (2) Menu fill more opaque than iOS glass. (3) Shared tab glyphs.
Required redo: Optional local (non-kit) glass menu with owner glyphs; keep PixelBase hidden.

---

### 32 Add Section — instance `119:12521` ← source `118:11143`

VERDICT: PASS
Screenshot fidelity: Nested **Add Section** with Breakfast / Lunch / Dinner + Manage Times; ghost Add Recipe; Sunday Beef; empty later days; Today peek under tab — matches recording + IMG_4468–4473 cluster.
Liquid Glass: Nested menu + cart + tab/search; days/cards content.
Consistency: Same Meal Plan chrome as 31; nested menu is page-local frame `374:7940`.
Control states: Add Section expanded (chevron down); Meal Plan tab selected.
Violations: (1) Nested-menu lead icons are stand-ins. (2) Glass tint vs iOS material. (3) Shared tab glyphs.
Required redo: Optional icon/glass polish only.

---

## Cross-cut

| Check | Result |
|---|---|
| PixelBase shipped as UI | No — hidden on all five sources |
| Shared Bottom NAV `77:237` | Untouched |
| Extra 01–49 stolen | No |
| 03 is filled (not upsell) | Yes |
| 08 trailing More | Yes (⋯) |
| 09 Back + Add | Yes (two circles) |
