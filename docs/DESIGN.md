# Design tokens & fidelity

UI source of truth: [`docs/ui-screenshots/`](ui-screenshots/).  
Fidelity process: `.cursor/rules/ui-fidelity.mdc`.

## How we hit 1:1

1. **One screenshot → one screen state** — implement against the named file, including `*-menu-open` / empty variants.
2. **Tokens first** — extract shared color, type, radius, spacing, blur into theme variables; screens consume tokens only.
3. **No invention** — if it is not in the screenshot, it does not ship.
4. **Visual QA gate** — side-by-side (or overlay) vs screenshot at phone width; ignore status bar, Dynamic Island, keyboard.
5. **Fix until match** — structure, spacing (~2–4px), type roles, green accent, control shapes must pass before merge.

## Token checklist (extract from screenshots)

| Token | Where it appears |
|-------|------------------|
| Brand green | Page titles, quantities, active tab, primary CTAs (`Start Cooking`, `Add N`) |
| Text primary / secondary / tertiary | Titles, body, notes in parentheses |
| Destructive red | Delete actions |
| Surface white / page grey | Lists, settings cards, backgrounds |
| Radii | Recipe cards, floating tab bar, circular icon buttons, pills |
| Floating tab + search circle | Bottom chrome on main tabs |
| Image scrim | White title text on food photography |
| Glass / blur | Popovers, translucent header buttons on heroes |

Update this file with concrete hex / pt values once measured from implementation or design tooling.
