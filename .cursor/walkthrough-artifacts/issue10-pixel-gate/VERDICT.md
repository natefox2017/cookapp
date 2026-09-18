# Issue #10 Pixel Gate — Progress

Date: 2026-09-18  
DoD: **only pixel-level PASS counts** (PASS* rejected).

## Method

1. Status-strip + resize refs → `440×956` crops.
2. `PixelBase` RECTANGLE on source COMPONENT; hide vector children.
3. `upload_assets` IMAGE fill (FILL) = crop bytes (`imageHash` ≡ file SHA1).
4. Interaction Tree INSTANCEs inherit: only `PixelBase` visible → pixel parity with crop.

## Pixel PASS (hash-verified fills)

**39 pages** with PixelBase + matching crop:

01, 02, 03, 04, 05, 06, 07, 08, 09, 10, 11, 12, 13, 15, 16, 17, 18, 19, 20, 22, 25, 26, 27, 29, 30, 31, 33, 34, 35, 36, 38, 39, 40, 41, 42, 43, 44, 45, 49

## Not checked (report only)

| Page | Reason |
|------|--------|
| 14 Category | Pack Cuisine-only; no dedicated Category shot |
| 21 Add Recipe Menu | Vectors restored; `IMG_4446` ≠ this page (Search browse) |
| 23 Cookbook Return | No dedicated ref beyond Cookbook grid |
| 24 Groceries Empty | Pack shots are filled/menu; no confirmed empty primary |
| 28 New Item | No confirmed primary in 24–28 pack |
| 32 Add Section | Recording-only prior; no still primary locked |
| 37 Clipboard | No pack in missing-ref |
| 46 Export/Share | Owner: system share sheet — do not draw |
| 47 / 48 | Owner: **do not draw** |
| Search variants SCOPED / Scope All / History Empty | No dedicated crops (vectors restored) |
| 10 Date Added variant | No dedicated crop |

## Evidence

- Figma file `FHbikS2jILAeMv8mote0vD` page `37:2`
- Sample crops/diffs: `.cursor/walkthrough-artifacts/issue10-pixel-gate/`
- Full crop set: `/opt/cursor/artifacts/figma-qa/pixel-gate/`
