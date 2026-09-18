# Why FAIL happened (told, not silent)

Stopping after FAIL without saying why and without patching is **not** the correct loop. Reasons for the remaining FAILs:

1. **04 Cooking** — greens were applied but the sheet was short, so Close/Next sat as inset pills with white below; some captures still looked like recipe-detail 1/23. Sheet is now pinned to the footer with **1/21**.
2. **13 Editor** — steps/nutrition were expanded; ingredients still skipped salt/pepper/tomato/flour/parsley vs IMG_4429–4430. Those rows are now on source `118:10814`.
3. **22 New Recipe** — hollow cover icon; solid green confirm; cuisine ring. Cover landscape mark, glass check, utensils-ish cuisine icon applied on `118:11949`.
4. **31 Add Menu** — empty week was correct; peek still had a title overlay (owner is photo + **4½** only); menu was opaque. Title hidden, 4½ pill added, glass + green bloom on the menu.

21 / 32 PixelBase FAILs were **stale screenshots** from before hiding filled bases — current instances are Cookbook+popover and nested Add Section.

Re-QA in flight for 04 / 13 / 22 / 31. Pack is not complete until those PASS. 47/48 stay undrawn.
