# SPLASH — Brand / App Mark + iOS launch extra

File: `FHbikS2jILAeMv8mote0vD`  
Page: `Cookapp · Recording Reproduction` (`37:2`)  
skillNames: `figma-use`  
**Not edited:** Bottom NAV `77:237`, Navigation / Header `127:10295`, Interaction Tree screens 01–49 except page **35 icon slots**. No `resetOverrides()`, no `get_design_context`.

Brand fill: Pestle green `{ r: 0, g: 0.7411764860153198, b: 0.33725491166114807 }`. Mark is a 120pt rounded square (radius 28) with a white bowl + leaf SVG. Light launch only (white bg). No status bar / Dynamic Island. No purple AI gradients.

## New node ids

| Role | Name | Node id | Parent | Position |
|---|---|---|---|---|
| **Logo component** | `Brand / App Mark` | **`572:7051`** | Components · Shared `75:24` | x=20320 y=3920, 120×120 |
| **Splash frame** | `Extra · iOS Launch Screen` | **`572:7058`** | White Theme · Interaction Tree `113:7937` | **x=23280 y=7257**, 440×956, `clipsContent` |
| Extra mark board | `Extra · App Mark` | `572:7067` | `113:7937` | x=23920 y=7257, 440×956 |
| Label | `Label · Extra iOS Launch Screen` | `572:7075` | `113:7937` | x=23280, y=7145 (frame.y − 112) |
| Label | `Label · Extra App Mark` | `572:7076` | `113:7937` | x=23920, y=7145 |

Tree section resized width to **24440** so the extras sit to the **right** of 01–49 (no stolen numbers). Collision at 23280/7257 was none, so settings-row y=7257 was used (not y=168).

## Page 35 App Icon slots (source `116:18900`, instance `117:10131`)

Replaced the three 44pt **RECTANGLE** slots with **instances of the same** `Brand / App Mark` (`572:7051`), scaled 44×44 at the original coordinates. Labels Pestle / Dark / Sketch unchanged. No extra icon styles.

| Slot | Old rect id | New instance id | x, y |
|---|---|---|---|
| Icon Slot / Light | `158:15242` | **`574:7063`** | 360, 172 |
| Icon Slot | `158:15245` | **`574:7070`** | 360, 236 |
| Icon Slot / Sketch | `158:15248` | **`574:7077`** | 360, 300 |

Instance `117:10131` inherits the source swap (not edited directly).

## Splash composition

- White fill, 440×956, logo centered, wordmark **CookApp** in Pestle green under the mark.
- Extra `572:7067` is mark-only on white (cleaner companion state).

## Locked

- Did not edit `77:237` or `127:10295`.
- Did not renumber or overwrite screens 01–49.
