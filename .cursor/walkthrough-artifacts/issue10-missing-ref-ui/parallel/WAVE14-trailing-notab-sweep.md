# WAVE14 — Top Trailing 20pt lock + Folders/Default harden; page no-tab sweep

Owner: 「顶部图标间距不对，底部也不应该有 tabbar，这种问题你逐个页面排查」on **07 · Folders** (+ same class across Interaction Tree).

## Root causes found

1. **07 Folders `State=Default`** was **442×958** (other variants 440) with **Hit / FolderAdd x=374** while Trailing glass sat at **x=372** — 2px frame + hit mismatch read as wrong top-right spacing.
2. **`Navigation / Header` set `127:10295`**: 48 of 57 right chrome nodes still used **16pt** right inset (`Trailing x=376`); AddMore capsules used **12pt** (`x=328`). Only `Page=Folders` / `Page=Cookbook` already had **20pt**.
3. Tab on Folders / menu overlays was already off from WAVE12–13; re-audited after spacing pass.

## Fixes

### Folders / Accordion `196:25334`

| Variant | Change |
|---|---|
| `State=Default` | resize **442→440**; Hit / FolderAdd **x 374→372**, y=16 |
| All 5 states | Bottom Chrome `visible=false`, y=2000; Hit x=372 |

Tree instance **07 · Folders** `115:19093` now **440** wide, Trailing/Hit inset **20**, no tab.

### Navigation / Header `127:10295`

- **58** right-side Trailing / Top Button moves → **right inset 20** (`x=372` for 48pt; `x=320` for 100pt AddMore).
- **CartCalendarMore** corrected after sweep: Capsule **x=274** + More **x=372** (8pt gap) — capsule must not share the far-right edge with More.

Header inset histogram after: **`{20: 57}`** only.

## Page sweep — no tab on overlay / push screens

Audited phone frames on `Cookapp · Recording Reproduction` → section `White Theme · Interaction Tree`.

| Class | Count | Tab visible |
|---|---|---|
| Should-no-tab (Folders, *Menu*, sheets, cooking, search, settings, etc.) | **52** | **0** |
| Root tab destinations kept (Cookbook / Groceries / Discover / Meal Plan) | 10 | on (expected) |

Explicit no-tab confirms (no `Bottom Chrome` / `Four Tab` nodes, or hidden):  
07 Folders, 06 Recipe Menu, 26 List Menu, 42/43 Add menus, 08b/08c/08f layout/appearance/sort.

## Evidence

- `WAVE14-folders-after.png` — Folders, no tab, folder+ at 20pt inset
- `WAVE14-folders-menuopen.png` — MenuOpen, no tab
- `WAVE14-recipe-menu-notab.png` — Recipe Menu, no tab
- `WAVE14-list-menu.png` — List Menu, no tab

## Note vs Pestle stills

`docs/ui-screenshots/folders-home*.jpg` still show a Pestle tab bar. **Owner override**: Folders (and menu overlays) must **not** show tab chrome in the Interaction Tree.
