# Batch C implementation (MCP recovered)

Figma `FHbikS2jILAeMv8mote0vD` / `37:2`. Did **not** edit 07, 12 Following filter, Bottom NAV, or 03/04/08/13/22/24/35.

## Nodes changed

| What | Kind | Id |
|---|---|---|
| 18 Search Results source | edited | `115:8090` |
| 18 instance | inherits | `115:18812` |
| 10 Date Added source | **new component** | `383:8198` |
| 10 · Smart Folder · Date Added | **new instance** x=17328 | `383:8618` |
| 16 Scoped source | **new component** | `383:8221` |
| 16 · Search · Scoped | **new instance** x=17968 | `383:8754` |
| 19 All Included source | **new component** | `383:8253` |
| 19 · Scope · All Included | **new instance** x=18608 | `383:8830` |
| 19 History Empty source | **new component** | `383:8311` |
| 19 · Scope · History Empty | **new instance** x=19248 | `383:8921` |
| Menu=Scope Include All | **new component** | `383:8369` |

Original sources kept: `184:13290` (10), `115:8329` (16), `118:11228` (19), `118:10902` (12).

## Verdicts

### 18 · Search Results `115:18812` ← `115:8090`
**VERDICT: PASS\***  
Screenshot fidelity: Bleed **fixed** (`clipsContent`). Matches Ingredient + carrot in tag. Query `1`. Grid IA matches 4444.  
Residual: some card bitmaps still bake servings/titles (no photo-only hash; no `createImageAsync`). List glyph closer to book than 16 cookbook.  
Liquid Glass: list/search/close chrome only.  
Required redo: swap remaining composite hashes if raw photo hashes appear.

### 10 extra Date Added `383:8618` ← `383:8198` (IMG_4426)
**VERDICT: PASS\***  
Predicate (all green), All Recipes, Date Added + Is Later Than + Sep 18, 2026, 0 Recipes Found, Add Filter list. Calendar on red tile; dismiss X on circle.  
Residual: Cancel still system blue; predicate wraps vs still one line.

### 16 extra Scoped `383:8754` ← `383:8221` (IMG_4446)
**VERDICT: PASS\***  
Recently Added kale, Main/Stew beef pairs, Baking muffin. History hidden.  
Residual: list glyph; grid servings chrome from reused cards.

### 19 extra All Included `383:8830` ← `383:8253` (recording f005)
**VERDICT: PASS\***  
Include: History + Recently Added + Folders + Categories all checked; populated Search behind.

### 19 extra History Empty `383:8921` ← `383:8311` (recording f010)
**VERDICT: PASS\***  
History ✓ only; empty recipes copy; no keyboard.

### 12 Following / 07
**Untouched.**

## Gate
18 FAIL (overflow) **closed**. Extras on tree to the right of Cookbook row (x≥17328). Batch C **PASS\*** with photo-hash residuals.
