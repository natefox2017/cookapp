# Issue #10 Pixel Gate — Progress

Date: 2026-09-18T10:45Z  
DoD: **only hard pixel-level PASS counts** for Issue completion (PASS* / PixelBase fill rejected as done).

## Canonical status（勿与下文冲突）

→ **`PAGE-STATUS.md`**（镜像：`docs/ui-screenshots/ISSUE10-PAGE-STATUS.md`）

## Correction (owner challenge)

Owner screenshots were already in `docs/ui-screenshots/missing-ref/` (PR #38). Prior 缺图 rows were **mapping errors** — see `REF-MAP.md`.

## Method (intermediate lock)

1. Status-strip (~5.5% top) + resize → `440×956` (tall pages may be taller).
2. `PixelBase` RECTANGLE on source; **only PixelBase visible**.
3. `upload_assets` IMAGE fill; `imageHash` ≡ crop SHA1.
4. Interaction Tree INSTANCEs inherit.

## Status summary

| Layer | Result |
|-------|--------|
| PixelBase lock (primaries 01–45, 49 + variants + 04b–d/08b–f) | **DONE** — `PIXELBASE_LOCKED` |
| Visibility bulk restore | **58/59** `vis=[PixelBase]`; residual **28b** |
| Owner skip | **46 / 47 / 48** — do not draw |
| Hard pixel PASS (Issue DoD) | **NONE** — PR #73 Gate FAIL (fill ≠ page pixel PASS) |

### Unfinished (actionable)

1. **28b** Create Shopping List — Stage wrapper not PixelBase-only  
2. All locked pages still **`HARD_PIXEL_OPEN`** until independent QA hard PASS  
3. Soft gaps: 04d / 19-all-four / 24-empty (weak stills — not 缺图)

### Extras locked

| Node | PixelBase | Source |
|------|-----------|--------|
| 04b Timers | `458:3820` | `04/` recording ~20s |
| 04c Ingredients | `458:3821` | `04/` recording ~26s |
| 04d Cooking Step | `458:3822` | `04/IMG_4405` scroll slice |
| 08b–f | `458:3823–3827` | `08-09/` IMG_* |

Also re-fixed **22** Peek/Chrome/Form overwrite → PixelBase only.

## Evidence

- Figma `FHbikS2jILAeMv8mote0vD` / `37:2`
- `PAGE-STATUS.md` · `REF-MAP.md` · `CHAT-FINDING.md` · crops in this folder
- Active coordination PR: #73
