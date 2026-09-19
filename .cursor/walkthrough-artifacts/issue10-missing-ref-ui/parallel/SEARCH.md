# SEARCH implementer (pages 16–19)

File: `FHbikS2jILAeMv8mote0vD`  
Formal instances only (edit **SOURCE** `mainComponent`):

| Page | Instance | Source |
|------|----------|--------|
| 16 Search ENTER | `115:19051` | `115:8329` |
| 17 Search FOCUSED | `219:6885` | `216:16333` |
| 18 Search RESULTS | `115:18812` | `115:8090` |
| 19 Scope Filter | `119:12608` | `118:11228` |

Stills: `docs/ui-screenshots/missing-ref/16-21/IMG_4441` (history), `IMG_4442` (focused empty), `IMG_4444` (results), `IMG_4445` (scope).

**Not edited:** Bottom NAV set `77:237`; header set `127:10295`. **No** `resetOverrides()`. **No** `get_design_context`.

## Shared: `Glass / Search Scope Button` `665:18839`

54×54, `cornerRadius` 27, **GLASS** (r=27, refraction 0.55) + **DROP_SHADOW** (r=4), fill white **0.62**, hairline stroke 0.5 inside. Glyph: list.bullet (3 dots + 3 lines), not Document/book.

Placed on sources (old opaque RECTANGLE + leftover icons `visible=false`):

| Source | Instance | x,y |
|--------|----------|-----|
| `115:8329` ENTER | `665:18847` | 20, 878 |
| `216:16333` FOCUSED | `665:18855` | 20, 878 |
| `115:8090` RESULTS | `665:18863` | 20, 876 |
| `246:6755` populated (hidden on 19) | `665:18871` | 20, 878 |
| `383:8221` Search SCOPED | `665:18879` | 20, 878 |
| `383:8254` / `383:8312` extra populated | `665:18927` / `665:18935` | 20, 878 |

19 inherits FOCUSED via `473:5597`.

## Green large title lock (x=20, y=72)

Header Large titles already y=72 inside header y=0 (set `127:10295` **untouched**).

Standalone / local frames moved to **y=72**:

| Node | Was | Now |
|------|-----|-----|
| `360:8012` Search FOCUSED | 132 | **72** |
| `543:12053` Search RESULTS (hidden) | 132 | **72** |
| `545:12087` General vector (hidden) | 132 | **72** |
| `373:7940` 42 Add Menu local header | 58 | **72** |
| `374:7856` 43 Add Section local header | 58 | **72** |
| `180:12831` Page=Cookbook (folders flow, not 127:10295) | 58 | **72** |

## 18 result cards (user markup)

- Cropped baked servings (people+count) and baked titles out of photo fills; mayo uses meal-plan hash `71de5555`.
- Vector titles stay inside 197×150 (`clipsContent`); muffin no longer overflows.
- Matches Ingredient = glass pill, carrot + label only.
- Hid extra More `641:9906`. Search bar on 18 has GLASS.
- Independent QA: **PASS**.
