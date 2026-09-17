# Cookapp White Theme · Final Formal Pages (LIVE)

**File:** `FHbikS2jILAeMv8mote0vD` · **Page:** `37:2` Cookapp · Recording Reproduction  
**Section:** `113:7937` White Theme · Interaction Tree  
**Verified live:** 2026-09-17T13:22:00Z  
**Layout:** gap 200 (dx 640) · row gap ~432 (dy varies) · frames 440×956 · Cookbook row y=168  
**Audit:** continuous 01–49 · 4 rows · Search trio adjacent **16 ENTER → 17 FOCUSED → 18 RESULTS**

## 01…49 — name — frameId (LIVE reading order)

| # | Name | frameId |
|---|---|---|
| 01 | Cookbook | `115:18732` |
| 02 | Recipe Detail | `116:18195` |
| 03 | Meal Plan Prompt | `116:18239` |
| 04 | Cooking Steps | `116:18290` |
| 05 | Timer Form | `116:18318` |
| 06 | Recipe Menu | `116:18396` |
| 07 | Folders | `115:19093` |
| 08 | Recently Added | `119:12665` |
| 09 | Main | `119:12726` |
| 10 | New Smart Folder | `184:13555` |
| 11 | Discover | `130:14331` |
| 12 | Filter | `119:12274` |
| 13 | Recipe Editor | `119:12180` |
| 14 | Category Selector | `119:12208` |
| 15 | Cuisine Selector | `119:12241` |
| 16 | Search | `115:19051` |
| 17 | Search Focused | `219:6885` |
| 18 | Search Results | `115:18812` |
| 19 | Scope Filter | `119:12608` |
| 20 | Cookbook Populated | `119:13141` |
| 21 | Add Recipe Menu | `119:13222` |
| 22 | New Recipe | `119:13349` |
| 23 | Cookbook Return | `119:13397` |
| 24 | Groceries / Empty | `115:18686` |
| 25 | Groceries | `115:18854` |
| 26 | List Menu | `119:11940` |
| 27 | Custom List | `119:12010` |
| 28 | New Item | `119:12120` |
| 29 | Meal Plan | `122:13366` |
| 30 | Meal Plan Inline | `119:12354` |
| 31 | Add Menu | `119:12435` |
| 32 | Add Section Menu | `119:12521` |
| 33 | Settings | `117:9975` |
| 34 | General | `117:10081` |
| 35 | App Icon | `117:10131` |
| 36 | Markdown | `117:10157` |
| 37 | Clipboard Detection | `117:10183` |
| 38 | Experiments | `117:10209` |
| 39 | Account | `117:10235` |
| 40 | Create Account | `117:10279` |
| 41 | Trial / Paywall | `117:10305` |
| 42 | Join Mailing List | `117:10357` |
| 43 | Household | `117:10383` |
| 44 | Timers | `117:10435` |
| 45 | How To Add Recipes | `117:10461` |
| 46 | Import / Share | `196:27930` |
| 47 | Acknowledgements | `196:28536` |
| 48 | Special Thanks | `117:10577` |
| 49 | What's New | `117:10603` |

## Row layout (locked · LIVE)

| Row | y | Pages | Count |
|---|---:|---|---:|
| NAV 1 · Cookbook (+ Folders + Discover nested) | 168 | 01–23 | 23 |
| NAV 2 · Groceries | 1337 | 24–28 | 5 |
| NAV 3 · Meal Plan | 2477 | 29–32 | 4 |
| NAV 4 · Settings | 3617 | 33–49 | 17 |

## Search trio (interaction · adjacent)

| State | # | frameId | component | Notes |
|---|---|---|---|---|
| ENTER | 16 | `115:19051` | `115:8329` | headerY **60** · glassY **62** · titleY **118** |
| FOCUSED | 17 | `219:6885` | `216:16333` | next to ENTER · no keyboard/status |
| RESULTS | 18 | `115:18812` | `115:8090` | next to FOCUSED · user-flow end |

Screenshots: `/tmp/cookapp-figma-audit/search-*-final.png`

## Hard audit (LIVE)

| Check | Result |
|-------|--------|
| Phone frames | **49** |
| Continuous 01…49 | **pass** |
| Search Enter → Focused → Results adjacent | **pass** (16→17→18) |
| System UI on Focused | **0** |
| ENTER glassY | **62** |


## Pass notes · 2026-09-17T14:35Z (agent fix 18/19/22/23)

| # | Name | frameId | Status |
|---|---|---|---|
| 18 | Search Results | `115:18812` | **FIXED** — clean food fills + layered frosted Matches Ingredient (carrot) + titles; circular list btn r=28; no burned-in UI |
| 19 | Scope Filter | `119:12608` | **OK** — populated host + Include menu (History/Recently Added/Folders/Categories) frost 0.92 @ y=78; matches 43-scope |
| 22 | New Recipe | `119:13349` | **FIXED** — blank Complete (icon opacity 0); Description+Total Time merged one card; Add Time `#00BD56` |
| 23 | Cookbook Return | `119:13397` | **FIXED** — uncovered; `Missing Source Evidence` (`196:25740`) moved to x=15168 (was overlapping phone) |

Evidence checklist (`196:25740`) M16/M21/M24/M26 + intro updated.
