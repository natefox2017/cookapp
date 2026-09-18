# Issue #10 — missing-ref Figma coordinator (2026-09-18)

Figma `FHbikS2jILAeMv8mote0vD` / `37:2`. Owner pack `docs/ui-screenshots/missing-ref/`.
Ignore status bar / Dynamic Island / keyboard. **47/48 not drawn** (`47-49/readme.txt`).

## Root cause (fixed)

Tree **instances** kept `PixelBase` visible (filled rasters). Hiding it only on sources was not enough. Applied: hide `PixelBase` on **sources + instances**, unhide constructed chrome. Do **not** `resetOverrides()` (it restores PixelBase).

## Live screenshots this pass

| Page | Instance ← source | Live vs owner | Verdict |
|------|-------------------|---------------|---------|
| 03 Meal Plan | `116:18239` ← `116:8936` | Sun13 Beef, Lunch Mayo, Mon14 Beef | **PASS*** |
| 04 Cooking | `116:18290` ← `116:8908` | 1/21, green title, Say Close/Next | **PASS*** (no green phrase fills) |
| 08 Recently Added | `119:12665` ← `118:11283` | Kale + Back/More | **PASS*** |
| 09 Your Recipes | `119:12726` ← `118:11342` | Beef + Back/+ /… | **PASS*** |
| 10 Smart Folder | `184:13555` ← `184:13290` | IMG_4423 filters | **PASS*** |
| 12 Filter | `119:12274` ← `118:10902` | All Foods + RecipeTin Eats | **PASS*** |
| 13 Editor | `119:12180` ← `118:10814` | Tall stitch ingredients→delete | **PASS*** |
| 14 Category | `119:12208` ← `118:10840` | Full list + Search Categories | **PASS*** |
| 15 Cuisine | `119:12241` ← `118:10871` | French ✓ + Search Cuisines | **PASS*** |
| 16 Search | `115:19051` ← `115:8329` | History muffin | **PASS*** |
| 17 Search Focused | `219:6885` ← `216:16333` | Empty body, no keyboard | **PASS*** |
| 18 Results | `115:18812` ← `115:8090` | Query `1` ingredient grid | **PASS*** |
| 19 Scope | `119:12608` ← `118:11228` | Include History ✓ + empty Search | **PASS*** |
| 21 Add Recipe | `119:13222` ← `118:11826` | Cookbook + popover (no still) | **PASS*** |
| 22 New Recipe | `119:13349` ← `118:11949` | Empty form stitch | **PASS*** |
| **24 Empty Groceries** | `115:18686` ← `115:7966` | Pantry/…/New Item, **zero rows** | **PASS** |
| 28 Pantry New Item | `119:12120` ← `118:10756` | IMG_4462 `noq` | **PASS** |
| 31 Add Menu | `119:12435` ← `118:11059` | Add Recipe/Section/Note/Random | **PASS*** |
| 32 Add Section | `119:12521` ← `118:11143` | Breakfast/Lunch/Dinner + Manage Times | **PASS*** |
| 35 App Icon | `117:10131` ← `116:18900` | Color-block icons | **PASS*** |
| 36 Markdown | `117:10157` ← `116:18924` | Long stitch toggles + example | **PASS*** |
| 38 Experiments | `117:10209` ← `116:18972` | IMG_4486 | **PASS** |
| 40 Create Account | `117:10279` ← `116:19044` | No back; Get started + social | **PASS*** |
| 42 Mailing list | `117:10357` ← `116:19116` | IMG_4490 | **PASS** |
| 44 Timers | `117:10435` ← `116:19188` | Empty + glass + | **PASS*** (center caption may be faint) |
| 45 How To | `117:10461` ← `116:19212` | IMG_4495; cookie color block | **PASS*** |
| 46 Export | `196:27930` ← `196:27884` | Alert + trailing X; Household row | **PASS*** (title still Large green; no share sheet) |
| 47 / 48 | — | Not drawn | **PASS** (per readme) |
| 49 What's New | `117:10603` ← `116:19356` | 49.PNG | **PASS*** |

PNG traps: IMG_4424–4425 = 07; IMG_4457 = 25 not 24; IMG_4487 = 39.

## Extras (right of 01–49; not stolen numbers)

28b `395:9346` Create List · 28c `395:9455` Share how-to · 04b–d `402:9328/9340/9387` · 08b–f layout/sort · 10 Date Added `383:8618` · 16 Scoped `383:8754` · 19 extras `383:8830`/`383:8921` · 44b `388:8719`.

Recording `每日任务` still a candidate extra (not 24).

Bottom NAV `77:237` not edited.
