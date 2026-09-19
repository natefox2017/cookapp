# UNSTACK — White Theme · Interaction Tree (`113:7937`)

Figma `FHbikS2jILAeMv8mote0vD` · page `Cookapp · Recording Reproduction`  
Agent: implementer UNSTACK · skill `figma-use` · no `get_design_context` · no `resetOverrides()` · did not edit `77:237` or `127:10295`.

## 1. Settings vs Meal Plan collision

| | 29 · Meal Plan `122:13366` | 33 · Settings `117:9975` |
|---|---|---|
| **Before** | x=208 y=6117 h=1738 (bottom **7855**) | x=208 y=7257 h=1706 · overlap **oy=598** |
| **After** | x=208 y=6117 h=1738 (unchanged) | x=208 y=**8175** h=1706 (bottom 9881) |

Row 3 max bottom = **7855**. NAV 4 cluster (`y >= 7100`) shifted by **dy=918** so the row starts at **max(row3 bottoms)+200 = 8055**.

- `NAV 4 · Settings` `209:16089`: y **8055**
- Labels: y **8063** · Sources: y **8091** · frames: y **8175**
- 640-wide columns unchanged (208 + n×640)

`03 filled meal plan` `116:18239` at x=1488 y=168 h=1738 does **not** overlap row 2 (Groceries starts y=4857). Left in place.

Section `113:7937` resized **22640 × 10573** (was 8261; content max bottom 10373 + 200).

## 2. Missing Source Evidence

`196:25740` moved page-level from `(0, 6000)` → **`(-4000, 0)`** (off canvas). No longer covers the tree.

## 3. Stray SOURCE / 44b

Page-level nodes that sat on tree coordinates, not inside `75:24`:

| Node | Action |
|---|---|
| `383:8198` 10 Date Added **COMPONENT** | parent `75:24` · rel **(25200, 200)** · abs (55200, 200) |
| `383:8221` Search SCOPED **COMPONENT** | parent `75:24` · rel **(25840, 200)** |
| `383:8253` 19 All Included **COMPONENT** | parent `75:24` · rel **(26480, 200)** |
| `383:8311` 19 History Empty **COMPONENT** | parent `75:24` · rel **(27120, 200)** |
| `388:8719` **44b · Create Timer INSTANCE** | screen extra on Settings row (not Shared) |
| `388:8761` Label / 44b | with 44b on tree, y = instance−112 |
| `388:8762` Source / 44b | with 44b on tree (same caption pattern as 33–49) |

Shared section `75:24` widened so rel x≥2000 / abs x≥32000 placements sit inside it. `77:237` and `127:10295` untouched.

**44b column:** 44 is x=7248; 45–49 occupy 7888…10448. First free 640 column = **x=11088**.  
Instance y=**8175** (same as 44). Label `388:8761` y=**8063**. Source y=**8091**.

## 4. Duplicate search extras hidden (not deleted)

Formal 16/17/18/19 kept visible at x=9808 / 10448 / 11088 / 11728.

| Id | Name | visible |
|---|---|---|
| `383:8754` | 16 · Search · Scoped | **false** |
| `383:8830` | 19 · Scope · All Included | **false** |
| `383:8921` | 19 · Scope · History Empty | **false** |
| `505:4790` | Label / 16 extra · Search Scoped | **false** |
| `505:4791` | Label / 19 extra · All Included | **false** |
| `505:4792` | Label / 19 extra · History Empty | **false** |

## 5. Same-(x,y) TEXT labels

No TEXT pair shared an (x,y) after the move. **nudged: []**

## Collision list after

**33 vs 29:** empty (ox=440, oy=**0**, collide=false).

**All INSTANCE/FRAME/COMPONENT pairs inside `113:7937`:** **[]** (empty).
