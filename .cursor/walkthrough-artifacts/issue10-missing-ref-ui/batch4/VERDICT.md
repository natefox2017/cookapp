# Issue #10 — missing-ref batch 4 (2026-09-18)

Figma `FHbikS2jILAeMv8mote0vD` / `37:2`. Refs: `docs/ui-screenshots/missing-ref/16-21/`. Ignore status bar / Dynamic Island / keyboard.

## This pass (Search cluster)

| Page | Node | Ref | Verdict | Notes |
|------|------|-----|---------|-------|
| **16** Search ENTER | `115:19051` ← `115:8329` | `IMG_4441.PNG` | **PASS*** | History + Clear + zucchini card + More + bottom list/search. *Servings badge glyph simplified; photo crop. MAE≈14.8 |
| **17** Search Focused | `219:6885` ← `216:16333` | `IMG_4442.PNG` | **PASS*** | Empty body + Search title/More + list + search pill (no keyboard). MAE≈2.0 |
| **18** Search Results | `115:18812` ← `115:8090` | `IMG_4444.PNG` | **PASS*** | Query `1` + 6 Matches Ingredient cards (Beef×3 / Zucchini / Mayo / Kale). *Photo encode / badge art. MAE≈37.4 |
| **19** Scope Filter | `119:12608` ← `118:11228` | `IMG_4445.PNG` | **PASS*** | Include menu; History ✓ only; empty Search chrome. MAE≈5.1 |
| **21** Add Recipe Menu | `119:13222` ← `118:11826` | formal Cookbook + menu | **PASS*** | New Recipe / Import Recipe / How to Add Recipes glass menu. **Owner `IMG_4446.PNG` is Search section-browse (list mode), not Add Recipe Menu** — not used as 1:1 ref. |

Independent QA: see `QA-VERDICT.md` → **VERDICT PASS** (all PASS*).

## Still open (next batches)

**12** Following filter (Figma has Following UI; pack still lacks dedicated Following shot) · **13** Editor long · **14** Category (pack Cuisine-only; Cuisine≠Category) · Search list-browse (`IMG_4446`) as formal page if needed · **24/28** Groceries · **45/46** How To / Import · **04** long stitch · **06** if still needed · FIGMA_MISSING pantry/filter/etc. · **47/48 skip (Owner)**.

Evidence: `batch4/figma/` · `batch4/sides/` · `batch4/refs/` · `mae.json`.
