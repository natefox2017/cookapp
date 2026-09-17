# Component specs

Every component below must ship **default, hover (pointer), active, disabled, loading**.

## Navigation
- Use `NavigationStack` / large title that collapses into glass on scroll
- Back is system chevron + previous title
- Trailing actions: 1–2, SF Symbols, 44pt
- Do not draw a custom opaque bar unless HIG requires an exception
- Search uses `.searchable`, not a fake card search box in the hero

## Tab Bar
- 3–5 destinations, label + SF Symbol
- Selected state is filled symbol + tint, not a heavy pill unless system provides it
- iOS 26 may minimize on scroll — do not fight it
- Tab content is a stack, not nested extra tab bars

## Sheet
- `.sheet` with detents `.medium` / `.large` as needed
- Grabber visible. Swipe to dismiss.
- Sheet chrome is system glass; sheet **content** is solid
- Avoid stacking sheets more than one level

## Card
- Content grouping only. Not a layout strategy for the whole app
- Solid or ultra-light fill, hairline separator, 20–28 radius
- Do not glass every card
- One primary action max inside a card

## Button
- Primary: prominent glass / filled
- Secondary: regular glass or bordered
- Tertiary: plain
- Destructive: red tint, never the most prominent on a form unless it is the task
- Press scale ~0.97. Spinner replaces label in loading. Disabled opacity 0.4–0.5, not greyed hex soup

## Input
- System text field, always a visible label (not placeholder-only)
- Keyboard type matches content
- Error is inline, under the field
- Clear button when appropriate
- Disabled and loading (skeleton or disabled + spinner) required

## Modal
- Use confirmationDialog / alert for short decisions
- Full modal for complex flows, with a clear dismiss
- Dimmed backdrop, tap outside dismisses when non-destructive
- Focus moves into the modal; restore on dismiss

## Animation
- Push/pop: system navigation transition
- Sheet: spring present, faster dismiss
- Tab: no page-curl, no bounce
- Gesture: swipe-back, sheet drag, list swipe actions — all must have a tap alternative
- Loading: spinner or skeleton, never a blocking blank canvas
- Honor Reduce Motion: cross-fade instead of large travel
