# Issue #10 — missing-ref Figma redo (2026-09-18)

Figma `FHbikS2jILAeMv8mote0vD` / `37:2`. Refs: `docs/ui-screenshots/missing-ref/`.
Ignore status bar / Dynamic Island / keyboard.

## Owner list this pass

03 04 08 09 10 12 13 14 15 16 17 18 19 21 22 24 28 31 32 35 36 38 40 42 44 45 46 47 48 49

47/48: folder `47-49/readme.txt` — **do not draw**; keep existing Acknowledgements / Thanks.

## Root cause (independent inspect)

Almost every tree instance’s **visible** child is a full-bleed `PixelBase` rectangle (baked screenshot). Constructed chrome sits underneath with `visible: false`.

Independent live export therefore showed:

- **24** filled Groceries (IMG_4457 / page 25) instead of empty
- **46** fused nav `X Household Settings ba d` instead of centered Settings + trailing X (IMG_4496)

04 / 22 already had PixelBase hidden so constructed layers showed.

## Agent split (parallel, disjoint sources)

| Agent | Pages | Sources (edit only these) |
|-------|--------|---------------------------|
| A | 03 08 09 31 32 | `116:8936` `118:11283` `118:11342` `118:11059` `118:11143` |
| B | 04 13 14 15 22 | `116:8908` `118:10814` `118:10840` `118:10871` `118:11949` |
| C | 10 12 16 17 18 19 21 | `184:13290` `118:10902` `115:8329` `216:16333` `115:8090` `118:11228` `118:11826` |
| D | 24 28 (+28b/c extras) | `115:7966` `118:10756` |
| E | 35 36 38 40 42 44 45 46 49 | `116:18900` `116:18924` `116:18972` `116:19044` `116:19116` `116:19188` `116:19212` `196:27884` `116:19356` |

Shared Bottom NAV `77:237` — **untouched**. Extra states stay to the **right** of the 01–49 grid.

PNG traps: `10、12/IMG_4424–4425` = 07 Create Folder, not 12. `24-28/IMG_4457` = 25 filled, not 24 empty. `38-40/IMG_4487` = 39 Account, not 40.

Per-batch files: `batch-a/` … `batch-e/VERDICT.md`. This file is coordinator SoT; batch files may lag until agents finish.
