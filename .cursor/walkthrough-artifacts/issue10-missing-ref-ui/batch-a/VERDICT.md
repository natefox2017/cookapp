# Batch A Figma Design QA — claimed pages 03 / 08 / 09 / 31 / 32

File `FHbikS2jILAeMv8mote0vD` page `37:2`. Edited **source components** only (plus page-local overlays on 31/32 and extra 08 interaction frames). Shared kit Bottom NAV `77:237` / Glass Top Button / tab glyphs **not** edited.

Exports: `03-meal-plan-filled.png`, `08-recently-added.png`, `09-your-recipes.png`, `31-add-menu.png`, `32-add-section.png`.

---

## 03 Meal Plan filled — **PASS\*** vs `docs/ui-screenshots/missing-ref/03/meal-plan.jpg`

**Not** Pro upsell. Stack is Sunday (Beef 4½) → Breakfast → Lunch → Mayo ¾ → Monday (Beef 4½) → Tuesday + plus.

| | |
|---|---|
| Screenshot fidelity | PASS\* — hierarchy/copy match owner 03; date rows no longer sit on cards |
| Liquid Glass | PASS — glass on cart + tab/search only |
| Consistency | PASS\* — tab glyphs still shared-kit squares (not edited) |
| Control states | n/a (filled list) |

**Nodes changed:** source `116:8936` (tree instance `116:18239`). Hid upsell + overlapping date instances. Repositioned cards `329:8217`/`329:8237`/`329:8227`. New compact date rows `371:7994`/`371:7998`/`371:8002`. Mayo badge unclipped `329:8237`/`329:8240`.

**Residuals:** tab glyphs (shared kit); ¾ badge still optically tight; frame still 956 (owner 03 is one viewport; 29–32 extra empty days live on 31/32, not merged into incompatible 03 Monday-filled snapshot).

---

## 08 Recently Added — **PASS\*** vs `08-09/IMG_4411.PNG`

Trailing is circular **⋯ More**, not folder. Grid kale tile + title + 4.

**Nodes changed:** source `118:11283` (tree `119:12665`). Kale overlay visibility on instance `160:15443`; tile `196×136`.

**Added interaction frames** (Cookbook row y=168, right of 22; did not steal 10–49):

| Frame | id | vs |
|---|---|---|
| 08b Layout Menu | `374:13328` | IMG_4412 (local Layout menu, Grid checked) |
| 08c Appearance | `374:13410` | IMG_4417 (shared Appearance instance) |
| 08d List | tree append | IMG_4413 |
| 08e Photo List | tree append | IMG_4415 |
| 08f Sort | `374:13502` | IMG_4422 |

**Residuals:** shared tab glyphs; 08c/08f menus still generic vs nested iOS glass; Filter sheet is page 12 (IMG_4421) — not duplicated here.

---

## 09 Your Recipes / Main — **PASS\*** vs `08-09/IMG_4414.PNG`

Same list chrome as 08; title **Your Recipes**; **two** circular + and ⋯ (not fused AddMore pill); photo-list Beef.

**Nodes changed:** source `118:11342` (tree `119:12726`). Hid `160:15545` brown placeholder + instance AddMore `I160:15531;196:23701`. Added `371:8006` Add, `371:8010` More, `371:8014` photo card (image hash from 03 beef).

**Residuals:** servings pill is “5” without people glyph; tab glyphs shared kit.

---

## 31 Add Menu — **PASS\*** vs `29-32/IMG_4467.PNG`

Empty Sun–Yesterday + **Today** (green) + Beef peek; plus menu: Add Recipe / Add Section › / Add Note / Add Random Recipe.

**Nodes changed:** source `118:11059` (tree `119:12435`). Hid filled-03 bg `196:27164`. Local header/dates/card `373:7939`–`373:7978`. Menu `196:27249` → x=155 y=176. Chrome clone `373:7981`.

**Residuals:** menu row icons still +/timer/book vs Pestle glyphs (shared `196:27113` not forked); Tuesday + peeks beside menu; tab glyphs.

---

## 32 Add Section — **PASS\*** vs recording nested menu (`f029`/`f030`)

Sunday Beef + empty later days; ghost **Add Recipe**; nested **Add Section ⌄**, Breakfast, Lunch, Dinner, divider, **Manage Times**.

**Nodes changed:** source `118:11143` (tree `119:12521`). Hid `196:27372` + `196:27457`. Local bg + `374:7936` ghost + `374:7940` nested menu.

**Residuals:** lead icons are text stand-ins not lucide; glass tint vs iOS material; tab glyphs.

---

## Shared kit

Did **not** edit `77:237`, Glass Top Button source, or tab glyphs. 31/32 cart uses instances of Glass Top Button with page-local placement.
