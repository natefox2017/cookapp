# Issue #10 Pixel Gate — Progress

Date: 2026-09-18  
DoD: **only pixel-level PASS counts** (PASS* rejected).

## Correction (owner challenge)

Owner screenshots were already in `docs/ui-screenshots/missing-ref/` (PR #38, morning). Prior 缺图 rows were **mapping errors**.

## Method

1. Status-strip (~5.5% top) + resize → `440×956` (tall pages may be taller).
2. `PixelBase` RECTANGLE on source; **only PixelBase visible**.
3. `upload_assets` IMAGE fill; `imageHash` ≡ crop SHA1.
4. Interaction Tree INSTANCEs inherit.

## Pixel PASS

**Primaries 01–45, 49** + **variants** (10 Date Added, 16 Scoped, 19 All/History Empty) + **extras 04b–d / 08b–f**: PixelBase fills hash-verified.

### Visibility repair (this turn)

Several mains had PixelBase **hidden** with vectors re-shown (broke pixel gate). Bulk restore: **58/59** tree pages now `vis=[PixelBase]` only. Residual: **28b Create Shopping List** (Stage wrapper — apply pending next Figma quota).

### Extras locked this turn

| Node | PixelBase | Source |
|------|-----------|--------|
| 04b Timers | `458:3820` | `04/` recording ~20s empty Timers |
| 04c Ingredients | `458:3821` | `04/` recording ~26s checklist (tall) |
| 04d Cooking Step | `458:3822` | `04/IMG_4405` scroll slice (pack has no discrete 2/21 still) |
| 08b Layout Menu | `458:3823` | `08-09/IMG_4412` |
| 08c Appearance | `458:3824` | `08-09/IMG_4417` |
| 08d List | `458:3826` | `08-09/IMG_4413` |
| 08e Photo List | `458:3827` | `08-09/IMG_4415` |
| 08f Sort Menu | `458:3825` | `08-09/IMG_4422` |

Also re-fixed **22** Peek/Chrome/Form overwrite → PixelBase only.

## Not drawn (owner instruction)

| Page | Reason |
|------|--------|
| 46 Export/Share | System share sheet |
| 47 / 48 | `OWNER SKIP` |

## Evidence

- Figma `FHbikS2jILAeMv8mote0vD` / `37:2`
- Crops: `/opt/cursor/artifacts/figma-qa/pixel-gate/` + walkthrough folder
- `REF-MAP.md` · `CHAT-FINDING.md`
