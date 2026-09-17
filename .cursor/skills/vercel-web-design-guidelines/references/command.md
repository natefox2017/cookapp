---
description: Review UI code for Vercel Web Interface Guidelines compliance
---

# Web Interface Guidelines (snapshot)

Prefer fetching https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md before review. This snapshot is a fallback.

## Accessibility
- Icon-only buttons need `aria-label`
- Form controls need a `<label>` or `aria-label`
- Interactive elements need keyboard handlers
- `button` for actions, `a` for navigation
- Images need `alt` (or `alt=""` if decorative)
- Decorative icons need `aria-hidden="true"`
- Async updates need `aria-live="polite"`
- Semantic HTML before ARIA
- Headings hierarchical `h1`–`h6`; skip link for main content

## Focus
- Visible `:focus-visible` ring
- Never `outline: none` without a replacement
- Sticky chrome must not cover focused elements

## Forms
- `autocomplete` + meaningful `name`
- Correct `type` / `inputmode`
- Never block paste
- Labels clickable
- Submit stays enabled until request starts; spinner during request
- Errors inline; focus first error

## Animation
- Honor `prefers-reduced-motion`
- Animate `transform` / `opacity` only
- Never `transition: all`
- Interruptible

## Typography
- `…` not `...`
- Curly quotes
- `tabular-nums` for numeric columns
- `text-wrap: balance` or `pretty` on headings

## Layout / responsive
- `min-w-0` on truncating flex children
- Explicit image width/height
- `env(safe-area-inset-*)` on full-bleed
- Empty states, not broken UI

## Touch
- `touch-action: manipulation`
- Gesture actions need tap/keyboard alternatives
- 44px minimum targets on mobile

## Theming
- `color-scheme` on `html`
- Dark mode designed, not inverted

## Anti-patterns
- `user-scalable=no` / `maximum-scale=1`
- `onPaste` + `preventDefault`
- `outline-none` without focus-visible replacement
- Div/span click navigation
- Icon buttons without names
- Hardcoded date/number formats (use `Intl`)

## Output
Group by file. `file:line` format. Terse. Skip preamble.
