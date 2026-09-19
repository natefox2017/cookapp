# WAVE12c — Recipe Menu no-tab (hard split)

Owner re-reported tab bar on `06 · Recipe Menu` (same still). Live export of the Interaction Tree instance already had no tab; owner chrome matched **vector** Bottom Chrome (green-square Cookbook), not Pestle PixelBase.

## Root cause

Nested backdrop was an instance of full Recipe Detail `116:8866`, which owns `Bottom Chrome` at y=876 (first-viewport sticky for screen **02**). Even with instance detach, that coupling was unsafe.

## Fix

1. New component `687:9957` `White Screen / W03 Recipe Detail · Menu Backdrop (no tab)` — clone of Recipe Detail **without** Bottom Chrome / PixelBase; legacy duplicate text layers hidden (content stays in Detail Scroll).
2. Menu source `116:9017` nested Recipe Detail → instance of `687:9957`.
3. Tree instance `116:18396` nested → same backdrop.
4. Removed menu source `Bottom Chrome` node + PixelBase image entirely.
5. Screen **02** keeps `116:8866` Bottom Chrome at y=876 (IMG_4396).

## Evidence

`WAVE12c-menu-no-tab.png` — glass menu + ingredients to the bottom edge; no Four Tab / Search Circle.
