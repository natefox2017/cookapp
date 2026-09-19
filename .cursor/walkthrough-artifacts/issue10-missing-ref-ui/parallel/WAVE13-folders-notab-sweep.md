# WAVE13 — Folders no-tab + top Trailing inset; menu tab sweep

Owner: 「顶部图标间距不对，底部也不应该有 tabbar，这种问题你逐个页面排查」on **07 · Folders**.

## 07 Folders / Accordion (`196:25334`)

All variants (`Default`, `FoldersExpanded`, `CategoriesExpanded`, `CuisinesExpanded`, `MenuOpen`):

| Change | Detail |
|---|---|
| Bottom Chrome | `visible=false`, y=2000 (off artboard) — owner override vs Pestle still that includes tab |
| Trailing (`Page=Folders` `180:12845`) | **x=376→372** (20pt right inset; was 16), **y=16** locked |
| Hit / FolderAdd | aligned to Trailing y=16 |

Evidence: `WAVE13-folders-after.png` — no Four Tab / Search; folder+ glass at top-right with 20pt inset.

## Page sweep — hide tab on menu / overlay screens

Same class of bug as 06 Recipe Menu + 07 Folders: chrome on **menu overlays** must not show a tab.

| Screen | Action |
|---|---|
| 07 Folders (all states) | tab off |
| 06 Recipe Menu | already off (WAVE12c) |
| 26 List Menu | tab off (source + tree) |
| 42 Add Menu / 43 Add Section Menu | tab off |
| 08b Layout Menu / 08c Appearance / 08f Sort Menu | tab off |

**Kept** tab on root tab destinations: 01 Cookbook, 02 Recipe Detail, 03/29/30 Meal Plan, 11 Discover, 20/23 Cookbook, 25 Groceries, 08d/e list backdrops, etc.

## Top chrome

Tree audit: only residual `Leading y=12` on 08b Menu Row header instance (cannot override; non-blocking). Folders Trailing inherits **y=16 / x=372** from `Page=Folders`.
