# Screens 24–36 · Figma vs shot checklist

**File:** `FHbikS2jILAeMv8mote0vD` · **Page:** `37:2`  
**Policy:** tree phone x/y untouched · edit source mains / interiors only  
**Glass:** large-title / cart chrome @ **y=62** (header@60)

| # | Screen | Tree | Source | Figma vs shot | Status | Notes |
|---|--------|------|--------|---------------|--------|-------|
| 24 | Groceries / Empty | `115:18686` | `115:7966` | empty Y 460→**560** (ref≈561); MAE **0.56** | ✅ PASS | Title 34/#00bd56@118; Pantry+More glassY62; + New Item; centered empty copy |
| 25 | Groceries | `115:18854` | `115:8136` | vs w06 GM; MAE **3.46** | ✅ PASS | Rows h66 @194…; tomato peek under chrome matches GM; glassY62 |
| 26 | List Menu | `119:11940` | `118:10578` | menu @170,120; 3 rows | ✅ PASS | Scrim + Custom/Share/New Item; host inherits 25 |
| 27 | Custom List | `119:12010` | `118:10650` | items **#1c1c1e**; New Item **#00bd56** | ✅ PASS | Title 家庭; More glassY62; row rhythm 66 |
| 28 | New Item | `119:12120` | `118:10756` | sheet Y **611**; surface `#F2F2F7` | ✅ PASS | Grabber/title/field/Add raised −65; green title + Add pill |
| 29 | Meal Plan | `122:13366` | `115:8250` | Inline black 17@75; cart@62 | ✅ PASS | Dates 164…; Sunday hidden; vs after/39 |
| 30 | Meal Plan Inline | `119:12354` | `118:10980` | sync w/ 29 | ✅ PASS | Same chrome/list rhythm |
| 31 | Add Menu | `119:12435` | `118:11059` | icon↔text gap **14**; icons 24² | ✅ PASS | vs after/40; Timer on Add Section row |
| 32 | Add Section Menu | `119:12521` | `118:11143` | icon↔text gap **14**; Timer 24² | ✅ PASS | vs after/41; Manage Times green |
| 33 | Settings | `117:9975` | `116:18755` | groups≈ref scaled gaps | ✅ PASS | Title@118; Close glassY62; Pestle Pro + Learn More; row groups |
| 34 | General | `117:10081` | `116:18852` | first group **200** (was 146) | ✅ PASS | Large title clearance; Back glassY62 |
| 35 | App Icon | `117:10131` | `116:18900` | slots **200+** (was 156) | ✅ PASS | Light✓ / Dark / Sketch; Back glassY62 |
| 36 | Markdown | `117:10157` | `116:18924` | content@200; Example below Notes | ✅ PASS | Example label no longer overlaps Notes |

## Fixes applied this pass

1. **24** Empty State `y` 450 → **560** (match ref mid-canvas)
2. **27** Item fills → `#1c1c1e`; New Item → `#00bd56`
3. **28** Sheet cluster `y` −65 → sheet@**611**; fill `#F2F2F7`
4. **34** All non-header content `y` **+54** (first card@200)
5. **35** All non-header content `y` **+44** (first slot@200)
6. **36** Content `y` **+54**; Example section pushed below Notes (+50)
7. **31/32** Menu row `itemSpacing` 12 → **14**; icons locked 24×24
8. Trailing More/Cart/Close forced visible @ glassY **62**

## Evidence

- After shots: `/workspace/.cursor/walkthrough-artifacts/batch-24-36/`
- Side-by-sides: `/tmp/batch-24-36/cmp/*-final.png`
- MAE snapshot: `/tmp/batch-24-36/mae.json`
