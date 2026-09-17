# Design system lock

UI source of truth: [`docs/ui-screenshots/`](ui-screenshots/).  
Hard rules: `.cursor/rules/ui-consistency-lock.mdc`, `ui-fidelity.mdc`, `ui-screenshots.mdc`.

## Goal

**Zero cross-screen UI drift.** Same control = same look everywhere. Each screen = 1:1 with its screenshot.

## Architecture (mandatory)

```
tokens (one file)  →  UI kit components  →  screens
```

- Screens **compose** kit components.
- Screens **must not** redefine colors, radii, type, or tab/button chrome locally.
- Need a new look? Add token + kit variant once; update all call sites.

## Shared chrome inventory

These must be single implementations:

- Floating tab bar + separate search circle
- Circular / pill header icon buttons
- Green page title
- Green primary CTA pill
- Grocery/ingredient row (checkbox + green quantity + notes)
- Recipe image card (servings pill + title scrim)
- Frosted popover / context menu (incl. destructive red)
- Settings grouped list card

## Consistency checklist (every PR that touches UI)

- [ ] No new raw colors/spacing/radii outside the token file
- [ ] No duplicated/forked TabBar, buttons, cards, menus
- [ ] Tab bar & primary green match other tabs
- [ ] Screen matches its `docs/ui-screenshots/` file (side-by-side)
- [ ] Status bar / Dynamic Island / keyboard ignored in comparison
- [ ] Empty and menu states covered when screenshots exist

## Token checklist (measure once, reuse)

| Token | Usage |
|-------|--------|
| Brand green | Page titles, quantities, active tab, primary CTAs |
| Text primary / secondary / tertiary | Titles, body, parenthetical notes |
| Destructive red | Delete |
| Surface white / page grey | Cards, settings, backgrounds |
| Radii | Cards, floating tab, circles, pills |
| Blur / glass | Popovers, translucent hero controls |
| Image scrim | White titles on food photos |

Fill concrete hex/pt values into the token module when the app scaffold lands; keep this doc in sync.
