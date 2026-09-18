# WAVE2-GROC-A — pages 25 / 26 / 27

Agent: **GROC-A** (implementer). File `FHbikS2jILAeMv8mote0vD` · page `Cookapp · Recording Reproduction` (`37:2`).

**Figma writes this session: blocked** after one successful `use_figma` inspect. Education-plan MCP rate limit on every later `use_figma` / `get_metadata` / `get_screenshot`. Vector unhide **not applied**. Timer `groc-a-figma-quota` queued to resume.

Did **not** call `get_design_context`, `resetOverrides`, `createImageAsync`. Did **not** edit Bottom NAV `77:237` or header set `127:10295`. Did **not** move Interaction Tree frames (`115:18854` / `119:11940` / `119:12010` stay at x=848 / 1488 / 2128, y=4977).

## Still mapping (read `docs/ui-screenshots/missing-ref/24-28/`)

Ignore status bar / Dynamic Island / keyboard.

| File | What it is | Page |
|---|---|---|
| `IMG_4457.PNG` | **Filled** Groceries list (not empty). Pantry + More, green **Groceries**, checkbox rows with green qty, tab Groceries selected | **25** |
| `IMG_4458.PNG` | Same chrome; title **家庭**; glass **List Menu** (Choose List ›, Show Purchased, Share List, Clear red) | **26** |
| `IMG_4459.PNG` | Same **家庭** list; stacked **Choose List** (家庭 / 每日任务 / Groceries / + New List), chevron down | **27** |
| `IMG_4460–4462` | Create list / Share / Pantry new item | GROC-B (not ours) |

Typical “4457 empty=24” is **wrong for this pack**. 24 is empty chrome only (already reconstructed on `115:7966`). 4457 is filled **25**.

## Assigned nodes

| Page | Instance | SOURCE (edit) | PixelBase id | **visible after inspect** |
|---|---|---|---|---|
| 25 Groceries | `115:18854` | `115:8136` White Screen / W06 Groceries · 06:40 | `410:8043` | **true** (IMAGE) |
| 26 List Menu | `119:11940` | `118:10578` White Screen / W06.1 List Menu · 06:44 | `410:8045` | **true** (IMAGE) |
| 27 Custom List | `119:12010` | `118:10650` White Screen / W06.1.1 Custom List · 06:46–06:58 | `410:8047` | **true** (IMAGE) |

Page fill on all three SOURCE components: **white** `#ffffff` (already). Menus: glass (`fill=#ffffff@0.55` on List Menu instance; Choose List panel `#ffffff@0.92`).

## Tree already on SOURCE (all vector siblings **hidden** under PixelBase)

### 25 · `115:8136` 440×956 @10096,80

| Id | Node | Notes |
|---|---|---|
| `410:8043` | PixelBase IMAGE | hide |
| `128:24913` | Navigation Header | main `127:9985` Title=Large Trailing=More · **y=0** · unhide |
| `115:8170` | Bottom Chrome | main `107:16259` Selected=Groceries · **x=9 y=876** (= parentH−80) · unhide, do not restyle set |
| `196:24762` | Pantry | 90×48 @20,62 Kind=Label · unhide; nudge x→16 to match empty-24 `196:24760` |
| `138:13974` / `138:13978` | Ingredient Oil / Bacon | **keep hidden** (not on 4457) |
| `138:13982` … `277:13819` | Garlic → Pepper kit rows | main `135:13983` Groceries Ingredient Row · unhide |

Kit rows (400×66, currently hidden): Garlic `138:13982` @20,196 · Wine `138:13986` @20,248 · Stock `138:13990` @20,300 · Parsley `138:13994` @20,352 · Carrots `138:13998` @20,404 · Butter `138:14002` @20,456 · Beef `138:14006` @20,508 · Salt `138:14010` @20,560 · Tomato `138:14014` @20,612 · Flour `277:13813` @20,664 · Thyme `277:13816` @20,716 · Pepper `277:13819` @20,768.

4457 copy (qty/unit green `#00BD56`/`#00BD57`; notes grey): 3 garlic cloves ( minced) · 750mL/ 25 oz pinot noir… (Note 3) · 3 cups beef stock (low sodium) · 2 tbsp chopped parsley ( for garnish) · 2 large carrots ((~300g/10oz)…) · 50g/3 tbsp unsalted butter · 800g/ 1.6 lb chuck beef… (Note 1) · ¾ tsp salt · 2 tbsp tomato paste · 6 tbsp flour ( plain/all purpose) · 3 sprigs thyme · ½ tsp pepper.

Circular chrome: header More is 48×48 on set `127:10295` — **do not edit set**. Pantry is 48pt-tall pill, not a 48 circle. Tab search circle is 64pt on `77:237` — **do not edit**.

### 26 · `118:10578` 440×956 @12440,80

| Id | Node | Action |
|---|---|---|
| `410:8045` | PixelBase | hide |
| `118:10579` | INSTANCE Groceries → `115:8136` | unhide (inherits 25 vectors) |
| `118:10632` | Scrim `#000@0.18` | **keep hidden** (4458 has no dim) |
| `118:10633` | List Menu 250×202 @170,120 | main `117:10698` Menu=Groceries List · glass 0.55 · unhide |

4458 title/tab label **家庭**. Override nested instance Title (and selected tab label if it is an instance text override) on `118:10579` only — do not change 25 source strings, do not edit `77:237`.

### 27 · `118:10650` 440×956 @12904,80

| Id | Node | Action |
|---|---|---|
| `410:8047` | PixelBase | hide |
| `277:12615` | INSTANCE Groceries → `115:8136` | unhide + 家庭 title override like 26 |
| `277:12695` | Choose List Panel 240×209 @170,100 | unhide; stacked glass; rows 家庭 / 每日任务 / Groceries / + New List already present |

`277:12703` Groceries row fill is currently `#00bd57` — 4459 shows all rows dark; current list is 家庭. Recolor Groceries row to `#1c1c1f` on this panel only.

## Resume mutation (quota recovered)

`use_figma` + `skillNames: "figma-use"`:

1. Hide `410:8043`, `410:8045`, `410:8047`.
2. Unhide 25 chrome + 12 matching ingredient instances; keep Oil/Bacon hidden.
3. Confirm tab `115:8170` `x=9` `y=parent.height-80` (already 876).
4. Unhide 26 nested Groceries + List Menu; leave scrim hidden.
5. Unhide 27 nested Groceries + Choose List Panel.
6. Instance-override titles on `118:10579` / `277:12615` → `家庭`.
7. If kit row characters ≠ 4457, override **instance** text + `setRangeFills` qty green — do not fork a second row kit.
8. Screenshot instances `115:18854`, `119:11940`, `119:12010` (not PixelBase).
9. Update this file PixelBase column to **false**.

## Return (live after inspect only)

```
SOURCE 115:8136  PixelBase 410:8043 visible=true
SOURCE 118:10578 PixelBase 410:8045 visible=true
SOURCE 118:10650 PixelBase 410:8047 visible=true
```
