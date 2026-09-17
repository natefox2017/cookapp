# Design tokens — iOS 26

Use semantic system colors. Do not hardcode hex except in a documented token file that maps light and dark.

## Radius
- Capsule / circle for floating buttons
- 20–28pt standalone cards
- Nested shapes use concentric radii, not a random inner 12 inside an outer 28

## Spacing
4pt base. Common: 8, 12, 16, 20, 24, 32. Tight toolbars 8–12. Standard floating controls 16–20.

Padding inside glass controls:
- Icon button 12
- Label button 16 × 10
- Card 20

## Type
- Nav large title: system largeTitle bold
- Body: system body
- Toolbar: callout
- Footnote / secondary for hints
Always test Dynamic Type.

## Borders
Hairline. Light: black @ 8–12%. Dark: white @ 10–14%. Prefer `separator` / `opaqueSeparator`.

## Themes
Ship **light and dark**. Adaptive materials, not inverted palettes. Elevated surfaces get slightly lighter in dark mode, not darker.

## Motion presets
- Morph / glass: bouncy or spring response 0.35–0.45, damping 0.7–0.86
- Chrome: smooth 350ms
- Toggle: snappy
- Never linear for spatial movement
