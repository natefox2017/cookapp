# WAVE12 — Recipe Menu: no tab bar

Owner: 「这个页面不应该有 tabbar」 on Recipe Menu (menu-open over Beef Bourguignon).

## Screen

| | |
|---|---|
| Interaction Tree | `116:18396` `06 · Recipe Menu` |
| Source | `116:9017` `White Screen / W03.3 Recipe Menu · 01:44` |
| Ref | `docs/ui-screenshots/missing-ref/06/IMG_4409.PNG` (Pestle still *includes* a tab; **owner override** = no tab) |

## Fix

1. Source `Bottom Chrome` `607:8654` → `visible=false`, moved to **y=2000** (off the 956 artboard) so it cannot paint in-frame.
2. Nested Recipe Detail instance `116:9018` keeps **Bottom Chrome detached** (children = Hero / Start Cooking / Detail Scroll only) — main `116:8866` still has tab at y=876 for screen **02**.
3. `clipsContent=true` on source; tree instance clipped.

## Verify

Live export `WAVE12-recipe-menu-no-tab.png`: glass menu + recipe content; **no** Four Tab / Search Circle at bottom.

Screen **02** Recipe Detail retains Bottom Chrome (matches IMG_4396).
