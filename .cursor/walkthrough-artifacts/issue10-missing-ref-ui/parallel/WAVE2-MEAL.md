# WAVE2-MEAL — Issue #10 Meal Plan vector reconstruction

File `FHbikS2jILAeMv8mote0vD` · page `Cookapp · Recording Reproduction` · tree `113:7937`.

Implementer: **MEAL only**. Did not edit Bottom NAV set `77:237`, header set `127:10295`, nested wrappers `107:16239/16260/16281/16302`. No `resetOverrides()`, no `get_design_context`, no `figma.create*`, no `createImageAsync`. Other Interaction Tree children were not moved. Extra states 31/32 stay to the right.

## Source ids edited + PixelBase

| Page | Tree instance | SOURCE edited | PixelBase id | PixelBase visible before | PixelBase visible after |
|------|---------------|---------------|--------------|--------------------------|-------------------------|
| 03 filled | `116:18239` (x=1488, y=168) | **`116:8936`** | `412:5343` | **true** | **false** |
| 29 Meal Plan | `122:13366` (x=208, y=6117) | **`115:8250`** | `410:8048` | **true** | **false** |
| 30 Inline | `119:12354` (x=848, y=6117) | **`118:10980`** | `410:8049` | **true** | **false** |

Live instance screenshots after hide: PixelBase off on all three (`px [false,false,false]`).

## Heights

| Node | Before | After | Notes |
|------|--------|-------|-------|
| SOURCE `116:8936` | 440×**1738** | 440×**1738** | Long canvas; Tuesday + empty below. |
| INSTANCE `116:18239` | 440×1738 @ 1488,168 | unchanged | |
| SOURCE `115:8250` | 440×**1738** | 440×**1738** | IMG_4464 + IMG_4465 days on one vector page. |
| INSTANCE `122:13366` | 440×1738 @ 208,6117 | unchanged | Bottom 7855; Settings `117:9975` y=8175 not covered. |
| SOURCE `118:10980` | 440×**956** | 440×**956** | Inline still + remaining empty days. |
| INSTANCE `119:12354` | 440×956 @ 848,6117 | unchanged | |

Page fills: **white** (not grouped gray). Headers **y=0**. Tab instances `x=9`, `y=parent.height-80` (1658 / 1658 / 876). Date set `78:279` not edited (instance text overrides only).

## 03 · SOURCE `116:8936` vs `docs/ui-screenshots/missing-ref/03/meal-plan.jpg`

Unhid existing vectors (PixelBase `412:5343` hidden):

| Id | Layer | Role |
|----|-------|------|
| `329:8116` | Navigation Header | Large / Cart, title Meal Plan, y=0 |
| `329:8122` | Date / Sunday Sep 13 | Empty hidden |
| `329:8217` | Recipe Card / Beef | photo card + 4½ |
| `329:8247` | Breakfast | section |
| `329:8248` | Lunch | y=404 |
| `329:8237` | Recipe Card / Mayo | y=444, ¾ |
| `329:8129` | Date / Monday Sep 14 | Empty hidden |
| `329:8227` | Recipe Card / Beef | |
| `329:8136` | Date / Tuesday Sep 15 | No recipes peek |
| `329:8173` | Bottom Chrome | Meal Plan selected, y=1658 |

Kept hidden: Yesterday/Today/Tomorrow/Sun20 dates, Household Card `329:8165`.

## 29 · SOURCE `115:8250` vs IMG_4464 + IMG_4465 (large title)

| Id | Layer |
|----|-------|
| `147:14557` | Header Large Meal Plan y=0 |
| `147:14592` | Today (Empty hidden) |
| `597:7575` | Recipe Card / Beef (clone of `329:8217`, existing IMAGE fill) |
| `147:14599` | Tomorrow No recipes |
| `147:14606` | Sunday, Sep 20 No recipes |
| `600:12933` | Monday, Sep 21 (Empty hidden) |
| `597:7585` | Dinner |
| `597:7586` | Breakfast |
| `600:12940` | Tuesday, Sep 22 |
| `600:12947`–`600:12975` | Wed 23–Sun 27 No recipes |
| `600:12982` | Monday, Sep 28 No recipes (instance Empty override; not Date-set edit) |
| `147:14613` | Bottom Chrome y=1658 |

Hidden: Sun13/Mon14/Tue15/Yesterday, Household `277:14098`, PixelBase.

## 30 · SOURCE `118:10980` vs IMG_4465 (inline)

| Id | Layer |
|----|-------|
| `147:14640` | Header Inline / Cart y=0 |
| `604:8631` | Tap to return to today (local text; header set untouched) |
| `147:14668` | Monday, Sep 21 |
| `604:8632` | Breakfast |
| `283:12547` | Tuesday, Sep 22 |
| `604:8633`–`604:8661` | Wed 23–Sun 27 |
| `604:8668` | Monday, Sep 28 No recipes |
| `147:14696` | Bottom Chrome y=876 |

Hidden: Yesterday/Today/Tomorrow/Fri18/Sat19/Sun20, Beef card `277:14150`, PixelBase.

## Residual vs stills

1. Shared Date Row + is 28pt mint circle vs slightly larger owner + — kit, Date set not forked.
2. Shared tab glyphs remain kit squares (`77:237` not edited).
3. 03 Breakfast/Lunch vertical gap still a few px tighter than `meal-plan.jpg`; Lunch/Mayo nudged to y=404/444.
4. Servings pills use existing card vectors; Mayo ¾ can read tight at thumbnail scale.
5. Recipe photos are **existing card IMAGE fills**, not full-bleed PixelBase / not `createImageAsync`.
6. 31 add-menu (IMG_4467) and 32 Add Section are other instances; grocery sheet IMG_4466/4473 and Add Note keyboard IMG_4471 ignored (not 03/29/30).
7. One title per page (Large on 03/29, Inline + subtitle on 30).

## Constraints honored

- Liquid Glass only on cart + floating tab/search; recipe cards stay content.
- 随机化 = vectors unhidden/rebuilt; PixelBase hidden on sources.
- `$fig.instance(id).moveTo(source)` used for extra days (`append` of instance handles threw).
