# State and feedback

## Hover
Button scale 1.02; card 1.01 + shadow lift; icon 1.1. Enter <100ms. Exit 150–200ms. Gate hover with `(hover: hover) and (pointer: fine)`.

## Press
Scale 0.97–0.98. Shadow tightens. 120–180ms. Release settles with a short spring.

## Loading
Spinner on the control, or skeleton sweep 1.5–2s. Do not hide the layout. Progress uses transform, not layout width thrash.

## Disabled
Opacity 0.4–0.5, no hover lift, pointer-events none, still focusable if it must explain why.

## Success / error
Success: scale pop + check draw, 300–400ms. Error: 2–3 decreasing horizontal shakes, 300–400ms, no bounce.
