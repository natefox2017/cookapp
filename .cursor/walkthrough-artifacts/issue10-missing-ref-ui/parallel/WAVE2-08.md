# WAVE2-08 · Recently Added extra states (MENU-08)

File: `FHbikS2jILAeMv8mote0vD` · page `Cookapp · Recording Reproduction`  
`skillNames: "figma-use"`. No `get_design_context`. No `resetOverrides()`. No `createImageAsync`.  
**Not edited:** Bottom NAV set `77:237`, header set `127:10295`. Frame **x/y left as unstacked** (640-grid columns).

Stills: `docs/ui-screenshots/missing-ref/08-09/IMG_4411.PNG`–`IMG_4422.PNG` + named Pestle `cookbook-grid-layout-menu-open.jpg` / `cookbook-grid-sort-menu-open.jpg`.  
All / Your / Recently Added share one recipe-list chrome; extras = layout / appearance / sort / list / photo-list. Ignore status bar / Dynamic Island / keyboard.

| Frame | id | x | PixelBase | Vector to show | Still |
|-------|----|---|-----------|----------------|-------|
| 08b Layout Menu | `374:13328` | 14928 | `458:3823` | `08 base` `374:13329` + `Menu=Layout` `374:13390` → `107:16340` | IMG_4412 (Grid ✓) |
| 08c Appearance | `374:13410` | 15568 | `458:3824` | `08 base` `374:13411` + `Menu=Appearance` `374:13472` → `107:16323`; hide `MISSING_REF` `538:6554` | IMG_4417 (Layout / Sort / Filter / Settings) |
| 08d List | `374:13768` | 16208 | `458:3826` | `08 base` `374:13769` + `List row` `374:13831`; keep `Cover kale` hidden | IMG_4413 / 4418 |
| 08e Photo List | `374:13837` | 16848 | `458:3827` | `08 base` `374:13838` + `Kale photo list` `374:13900` (+ Title `374:13902`) | IMG_4415 / 4420 |
| 08f Sort Menu | `374:13502` | 17488 | `458:3825` | `08 base` `374:13503` + `Menu=Sort` `374:13564` (local glass, not PixelBase) | IMG_4422 |

Menus are **regular glass** (nav layer): ~55% white + background blur + hairline; rows are opaque labels, not nested glass. Layout submenu: Photo List / List / Grid (check on Grid for 08b). Appearance root: Layout ›, Sort ›, Filter, Settings. Sort: Name / Date Added ✓ / Date Modified / hairline / Ascending ✓. Search control = **circle** (60pt kit), not a square.

08d/08e overlay a white **ContentMask** over the 08-base grid tile so list / photo-list read without `resetOverrides()` on the instance.

## Mutation status

Inspected via `use_figma` (PixelBase still **visible** on all five). Writes then hit **Figma Education MCP rate limit** (team `我的团队` / student Full; 10/min + 200/day shared with parallel WAVE2 agents). Apply script: `WAVE2-08-APPLY.js`. Retrying until PixelBase is off and glass chrome is on.

## Residual vs stills

- 08 base instance `118:11283` (`White Screen / 10 Recently Added · 02:32`) is shared; not forked per extra.
- `Menu=Layout` / `Menu=Appearance` are kit instances — unhide only, do not edit the Menu Popover set.
- Sort panel is a local frame on 08f; glassify in place (not a screenshot fill).
- IMG_4421 Filter sheet is **not** a MENU-08 extra (out of scope).
