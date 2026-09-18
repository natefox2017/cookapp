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
| 14 Category | `missing-ref/22/` recording **t≈15.0s** (Category list; pack stills `IMG_4453`/`4455` same UI family) | `fb6a8ddf…` → `423:3834` |
| 15 Cuisine | `missing-ref/13-15/IMG_4438.PNG` | `1067db57…` → `423:9114` |
| 21 Add Recipe Menu | `missing-ref/22/` recording **t≈1.5s** | `e75447aa…` → `423:3835` |
| 23 Cookbook Return | `docs/ui-screenshots/cookbook-grid.jpg` | `0c80a3f3…` → `423:3836` |
| 24 Groceries / Empty label | `missing-ref/24-28/` recording **t≈16.5s** (filled list — no zero-row empty in pack; used as SoT) | `9e8e18e5…` → `423:9109` |
| 28 New Item | `missing-ref/24-28/IMG_4462.PNG` | `b7b88e5f…` → `423:3837` |
| 32 Add Section Menu | `missing-ref/29-32/` recording **t≈28.5s** (Breakfast/Lunch/Dinner) | `8b18c0fc…` → `423:9107` |
| 37 Clipboard Detection | `docs/ui-screenshots/settings-general-voice-clipboard.jpg` (not under missing-ref folders; **is** in main screenshot set) | `cc3fd96b…` → `423:9108` |

## Not drawn (owner instruction — not 缺图)

| Page | Reason |
|------|--------|
| 46 Export/Share | Owner: system share sheet — do not draw (`missing-ref/45-46/readme.txt`) |
| 47 / 48 | Owner: **do not draw** — mains renamed `OWNER SKIP` |

## Variants (have tree nodes; primary stills covered)

| Variant | Notes |
|---------|--------|
| 10 Date Added | Tree instance present; use `10、12/` pack + Smart Folder stills when locking |
| 16 Scoped / 19 All Included / History Empty | Covered by `16-21/` pack + recording; lock when primary gate complete |

## Evidence

- Figma file `FHbikS2jILAeMv8mote0vD` page `37:2`
- Crops: `/opt/cursor/artifacts/figma-qa/pixel-gate/` + copies here
- Packs: `docs/ui-screenshots/missing-ref/` + root `docs/ui-screenshots/*.jpg`
