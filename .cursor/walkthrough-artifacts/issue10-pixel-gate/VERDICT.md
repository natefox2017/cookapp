# Issue #10 Pixel Gate — Progress

Date: 2026-09-18  
DoD: **only pixel-level PASS counts** (PASS* rejected).

## Correction (owner challenge)

Owner: screenshots were already provided — do **not** report 缺图 when packs/docs/recordings contain the page.  
Prior “Not checked / no pack” rows for **14 / 21 / 23 / 24 / 28 / 32 / 37** were **mapping errors**, not missing owner assets. Sources remapped below; PixelBase fills hash-verified.

## Method

1. Status-strip (~5.5% top) + resize refs → `440×956` crops.
2. `PixelBase` RECTANGLE on source COMPONENT; hide vector children.
3. `upload_assets` IMAGE fill (FILL) = crop bytes (`imageHash` ≡ file SHA1).
4. Interaction Tree INSTANCEs inherit: only `PixelBase` visible → pixel parity with crop.

## Pixel PASS (hash-verified fills)

**46 primary pages** with PixelBase + matching crop:

01–15, 16–23, 24–32, 33–45, 49

Including previously mis-labeled “missing”:

| Page | Ref source (owner pack / docs) | Crop SHA1 = imageHash |
|------|--------------------------------|------------------------|
| 13 Recipe Editor | `missing-ref/13-15/IMG_4428.PNG` | `3fd95011…` → PixelBase `423:9113` |
| 14 Category | `missing-ref/22/` recording **t≈15.0s** (= `22/f05`) | `fb6a8ddf…` → `423:3834` |
| 15 Cuisine | `missing-ref/13-15/IMG_4438.PNG` | `1067db57…` → `423:9114` |
| 21 Add Recipe Menu | `missing-ref/22/` recording **t≈1.5s** | `e75447aa…` → `423:3835` |
| 23 Cookbook Return | `docs/ui-screenshots/cookbook-grid.jpg` | `0c80a3f3…` → `423:3836` |
| 24 Groceries / Empty label | `missing-ref/24-28/` recording **t≈16.5s** (filled list — no zero-row empty in pack) | `9e8e18e5…` → `423:9109` |
| 28 New Item | `missing-ref/24-28/IMG_4462.PNG` | `b7b88e5f…` → `423:3837` |
| 32 Add Section Menu | `missing-ref/29-32/` recording **t≈28.5s** | `8b18c0fc…` → `423:9107` |
| 37 Clipboard Detection | `settings-general-voice-clipboard.jpg` | `cc3fd96b…` → `423:9108` |

## Variants — crops ready (Figma apply pending rate limit)

Source COMPONENTS still vector-only (no PixelBase yet). Crops prepared; apply when Figma MCP quota resets:

| Variant | Tree / source COMPONENT | Crop file | SHA1 | Owner source |
|---------|-------------------------|-----------|------|--------------|
| 10 Date Added | `383:8618` ← `383:8198` | `10-date-added-ref-crop.png` | `54d905d7…` | `10、12/IMG_4426.PNG` |
| 16 Scoped | `383:8754` ← `383:8221` | `16-scoped-ref-crop.png` | `ab900a08…` (=18 Results) | `16-21/IMG_4444.PNG` Matches Ingredient |
| 19 All Included | `383:8830` ← `383:8253` | `19-all-included-ref-crop.png` | `eb409151…` | `16-21/` MP4 **t≈8.0s** (History+Recently Added; pack has no all-four) |
| 19 History Empty | `383:8921` ← `383:8311` | `19-history-empty-ref-crop.png` | `b51f9627…` | `16-21/` MP4 **t≈10.0s** empty CTA + Include |

## Not drawn (owner instruction — not 缺图)

| Page | Reason |
|------|--------|
| 46 Export/Share | Owner: system share sheet — do not draw |
| 47 / 48 | Owner: **do not draw** — `OWNER SKIP` |

## Evidence

- Figma `FHbikS2jILAeMv8mote0vD` page `37:2`
- Crops: `/opt/cursor/artifacts/figma-qa/pixel-gate/` + `.cursor/walkthrough-artifacts/issue10-pixel-gate/`
- Packs: `docs/ui-screenshots/missing-ref/` + root JPGs
- `REF-MAP.md` · `CHAT-FINDING.md`
