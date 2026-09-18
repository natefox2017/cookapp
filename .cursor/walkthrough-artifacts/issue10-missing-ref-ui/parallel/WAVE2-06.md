# WAVE2-06 · Recipe Menu (MENU-06)

File: `FHbikS2jILAeMv8mote0vD` · page `Cookapp · Recording Reproduction`  
`skillNames: "figma-use"`. No `get_design_context`. No `resetOverrides()`. No edits to Bottom NAV set `77:237` or header set `127:10295`. No `createImageAsync`. No edit to `116:8866` (LONG-02).

| | id |
|--|--|
| Tree instance | `116:18396` · `06 · Recipe Menu` |
| SOURCE | `116:9017` · `White Screen / W03.3 Recipe Menu · 01:44` (440×956, `clipsContent: true`) |
| PixelBase | `410:8038` **hidden** |

Stills: `docs/ui-screenshots/missing-ref/06/IMG_4409.PNG` (menu open) · `IMG_4410.PNG` (header chrome). Ignore status bar / Dynamic Island / keyboard.

Live capture: `WAVE2-06-live.png` (instance `116:18396`).

## Done on source `116:9017`

| Child | id | visible | notes |
|-------|----|---------|--------|
| PixelBase | `410:8038` | **false** | hide on source; tree instance no longer lists PixelBase |
| Recipe Detail | `116:9018` → `116:8866` | true | nested 02 vector under the menu (not edited) |
| Scrim | `116:9060` | false | stills have no heavy dim |
| Navigation / Header | `607:8622` → `275:16344` | true | **y=0**, 440×80. Set `127:10295` not edited. 48pt buttons stay on the set (inner y=16). Trailing CartCalendarMore sits under the menu (IMG_4410 chrome). |
| Bottom Chrome | `607:8654` → `77:101` | true | `x=9` `y=876` (`parentH-80`). Set `77:237` not edited. Cookbook selected. |
| Recipe Menu | `116:9061` → `115:19220` `Menu=Recipe` | **true** | `x=174` `y=16` w=250 h=374. Glass popover. Did not edit Menu Popover set `107:16353`. |

Z-order: PixelBase → Recipe Detail → Scrim → Header → Tabs → **Recipe Menu** (top).

Tree `116:18396` children: Recipe Detail, Header y=0, Bottom Chrome y=876, Recipe Menu.

## Menu IA (existing vector, unhidden)

Edit · Timers · Start Minicook · Visit Source · Share › · Folders › · Reimport · hairline · **Delete** (destructive red). Regular glass + green bloom through Reimport from Start Cooking.

## Chrome lock

- Header instance **y=0** on this phone SOURCE. Did not move buttons inside the set.
- Tabs only on this SOURCE at `x=9` `y=parentH-80`. No nested 64pt wrappers `107:16239/16260/16281/16302`.
- Nested 02 header/tabs were not rewritten on `116:8866`. Instance child walk hit stale ids after LONG-02 edits; 06 uses its own header/tabs on top.

## Residual vs stills (not PixelBase)

- Title/stats sit slightly lower than IMG_4409 because they come from nested 02 layout (hero 350). Menu is the existing 374pt kit, not stretched.
- Cookbook selected glyph is the shared Bottom NAV instance (set not edited).
- Folder+ / Reimport glyphs are kit SVGs on `Menu=Recipe`, not photo-traced Pestle marks.
- Page 06 stays **menu open**. IMG_4410 is the same chrome with menu closed (trailing 48pt cart/calendar/more live on the header instance under the popover).
