# Pixel reconstruct · 43 / 39 / 05 / 07 (post-#85 FAIL)

**DoD:** reconstructed Figma vector/chrome ↔ `docs/ui-screenshots/` ≤~2–4px.  
**Banned:** PixelBase docs JPG fills + hide vectors (MAE≈0 wallpaper).  
**Ignore:** status bar / Dynamic Island / keyboard.  
**Figma:** `FHbikS2jILAeMv8mote0vD` / page `37:2`

## Nodes

| Page | Tree instance | Source COMPONENT | Ref |
|------|---------------|------------------|-----|
| **43** Household | `117:10383` | `116:19140` | `household-settings.jpg` |
| **39** Account | `117:10235` | `116:18996` | `account-settings.jpg` |
| **05** Timer | `116:18318` | `116:8985` | `create-timer.jpg` |
| **07** Folders | `115:19093` | `115:8375` | `folders-home-expanded.jpg` |

## Method (honest)

1. On each **source**: find `PixelBase` (IMAGE fill) → `visible = false` (keep for reference only).
2. Unhide / restore constructed chrome children (vectors, text, glass nav).
3. Rebuild gaps from #82 FAIL (MAE 4.44–10.22) — vector edits only.
4. Live `get_screenshot` of **tree instances** (not wallpaper).
5. Status-stripped MAE @440w via `scripts/mae_compare.py`.
6. Independent QA must PASS before any #10 checklist tick.

## Gaps to close (#82 vector baseline)

### 43 Household
- Rename label casing/size; pill radii ≈24 on Rename + Delete
- Pale mint member bar + square glyph
- Owner card r16; disclaimer centered
- Title AA/weight + Rename↔Owner vertical rhythm ≤2–4px

### 39 Account
- Thin Pestle copy SVG (not heavy glyph)
- Active right inset; card row padding
- Brand green hex align; helper gaps

### 05 Timer
- Single segmented presets (no selected wash)
- Back/Start frosted glass capsules (regular glass)
- Untitled Timer; Count past zero OFF
- Picker fade band + Name separator weight

### 07 Folders
- Recently Added present; Categories expanded
- Card dividers inset correctly
- Bottom NAV Liquid Glass (shared) — bot density vs docs
- Folder+ chrome weight

## Quota note

Education Figma MCP = 200 calls/day. This redo resumes after daily reset; calls budgeted tightly (inspect → mutate → screenshot ×4 → verify).
