# WAVE2-02 — LONG page · Recipe Detail

File: `FHbikS2jILAeMv8mote0vD`  
Page: `Cookapp · Recording Reproduction`  
Agent: implementer LONG-02 · skill `figma-use`  
**Not edited:** Bottom NAV set `77:237` · header set `127:10295` · PixelBase `410:8036` (kept hidden)  
Never `resetOverrides()` · never `get_design_context` · never `createImageAsync` · never nested NAV wrappers `107:16239/16260/16281/16302`.

Stills: `docs/ui-screenshots/missing-ref/02/IMG_4396.PNG`–`IMG_4402.PNG` (+ MP4). Status bar / Dynamic Island / keyboard ignored.

| | Id | Size / pos |
|---|---|---|
| INSTANCE | `116:18195` `02 · Recipe Detail` | x=848 y=168 w=440 **h=3878** |
| SOURCE | `116:8866` `White Screen / W03 Recipe Detail · 00:12` | w=440 **h=3878** |
| PixelBase | `410:8036` | **visible=false** (unchanged) |

## Polish (this SOURCE only)

| Issue | Before | After |
|---|---|---|
| Wrong background | SOURCE fill `#F2F2F7` `{r:0.949,g:0.949,b:0.969}` | **White** `{r:1,g:1,b:1}` |
| Duplicate title | Leftover `142:14191` Recipe Title (hidden) + body `508:5798` | Leftover stays **hidden**; **one** visible title `508:5798` “Beef Bourguignon (Beef Burgundy)” in Detail Scroll |
| Chrome spacing | Header instance `142:14178` **y=16** (buttons in set already y=16 → chrome sat at 32) | Header **x=0 y=0** on SOURCE; instance inherits y=0. Did not edit `127:10295`. |
| Tab | already last child | Bottom Chrome `142:14219` **x=9 y=3798** (`parent.height-80`) last child on SOURCE **and** instance |
| Green qty | quantity prefixes not range-painted | 18 ingredient lines `508:5814`–`508:5865`: qty prefix Pestle green `{r:0,g:0.741,b:0.337}` |

Header variant on this instance (unchanged, not the set): `Title=None`, `Leading=Back`, `Trailing=CartCalendarMore`. Glass buttons remain y=16 **inside** the header source.

## Must-have checklist

- [x] Hero `151:15679` 440×350
- [x] Start Cooking CTA `116:8904` (112, 286, 216×64)
- [x] Full ingredients card (18 rows) + green qty
- [x] Marinate beef / Brown beef and vegetables / Slow-cook
- [x] Description + Nutrition
- [x] Bottom Chrome last child at x=9 y=3798
- [x] White SOURCE fill
- [x] One visible title
- [x] PixelBase hidden
- [x] Detail Scroll `508:5797` y=360 h=3518 (grouped content; cards stay white)

## Constraints

- Edited **only** SOURCE `116:8866` (instance `116:18195` follows).
- Did not edit `77:237`, `127:10295`, or PixelBase geometry.
- Did not call `resetOverrides`.
- Tab not moved on nested 64pt NAV wrappers.

Post-mutate header metadata: `142:14178` **x=0 y=0** w=440 h=80; inner Glass buttons still y=16 (set, not edited). Capture: `WAVE2-02-instance.png` / `WAVE2-02-top.png`.

## Returns (post-mutate `use_figma`)

```
srcFill { r:1, g:1, b:1 }
headerY 0 / instHeaderY 0
chrome { x:9, y:3798, last: Bottom Chrome }
instChrome { x:9, y:3798 }
dupTitle false / bodyTitle true / pb false
qtyDone 18 prefixes: 800g, 2, 16, 1, 3, 750mL, 3 tbsp, ¾ tsp, ½ tsp, 200g, 150g, 50g/3 tbsp, 3, 2 tbsp, 6 tbsp, 3 cups, ¼ tsp, 2 tbsp
```
