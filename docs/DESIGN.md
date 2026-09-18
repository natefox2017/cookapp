# Design system lock

Hard rules (always on):

| Rule | File |
|------|------|
| Screenshots over recordings; ignore status bar / Dynamic Island / keyboard | `.cursor/rules/ui-screenshots.mdc` |
| 1:1 screenshot fidelity | `.cursor/rules/ui-fidelity.mdc` |
| One token file + one UI kit; no per-screen forks | `.cursor/rules/ui-consistency-lock.mdc` |
| iOS 26 Liquid Glass materials | `.cursor/rules/liquid-glass.mdc` |
| Separate QA agent must PASS or UI is rejected/redone | `.cursor/rules/ui-qa-agent-gate.mdc` |

Screenshots: [`docs/ui-screenshots/`](ui-screenshots/).  
QA brief template: [`docs/ui-qa-brief.md`](ui-qa-brief.md).

## Goal

**Zero cross-screen drift** + **1:1 screenshot match** + **Liquid Glass chrome** + **automated reject/redo on FAIL**.

## Architecture (mandatory)

```
tokens (one file)  →  UI kit components  →  screens
                                    ↘
                              UI QA agent (PASS required)
```

- Screens **compose** kit components; no local visual constants.
- Floating chrome uses **Liquid Glass** (regular / clear per rules); content layer does not.
- Formal visual acceptance is **White-only**. Theme mode hooks (system/light/dark) exist; do not invent a formal Dark theme until Owner opens that work.
- Every control: default / hover / active / disabled / loading.

## Shared chrome inventory

Single implementations only:

- Floating tab bar + search circle (regular glass)
- Circular / pill header buttons (regular or clear over media)
- Green page title + green primary CTA
- Grocery/ingredient row (checkbox + green quantity)
- Recipe image card (servings pill + title scrim) — content, not glass fill
- Frosted popover / context menu
- Settings grouped list card — standard surface, not Liquid Glass slab

## Liquid Glass (summary)

- Glass = navigation/control layer only (tab bar, toolbars, menus, sheets, hero overlay buttons).
- Not for lists, grids, page backgrounds, or glass-on-glass stacks.
- Prefer system blur/vibrancy semantics; low-contrast borders; content readable through chrome.
- Brand green tints accents/labels — does not replace glass with opaque green slabs.
- Honor Reduce Transparency / Reduce Motion / Increase Contrast with solid legible fallbacks.

## Consistency checklist (every UI PR)

- [ ] Tokens + kit only; no forked TabBar/buttons/menus
- [ ] Screenshot side-by-side PASS (device chrome ignored)
- [ ] Liquid Glass only on allowed chrome; White-only formal pass (no invented Dark theme)
- [ ] Control states complete
- [ ] **UI QA agent VERDICT: PASS** attached / recorded in PR notes

## Token checklist

Concrete values live in `ios/CookApp/Core/Theme/DesignTokens.swift` (one file).

| Token | Usage | Value |
|-------|--------|--------|
| Brand green | Titles, quantities, active tab, primary CTAs | `Color.cookBrand` (`AccentColor`) |
| Text primary / secondary / tertiary | Titles, body, notes | `label` / `secondaryLabel` / `tertiaryLabel` |
| Destructive red | Delete | `systemRed` |
| Surface / page | Content layer backgrounds | `secondarySystemGroupedBackground` / `systemGroupedBackground` |
| Glass regular / clear | Floating chrome only | iOS 26 `Glass.regular` / `.clear`; fallback `ultraThinMaterial` |
| Chrome solid fallback | Reduce Transparency / Increase Contrast | `cookChromeSolid` + stronger separator |
| Tab bar height / search circle | D1 | 62 / 60, gap 8, insets 16 |
| Hit target | All chrome controls | ≥44 |
| Header button / gap | D2 | 44 / 8 |
| Radii | Cards, tab selection, pills | 16 / 14 / capsule |
| Motion | Tab morph / menu / press | 0.25s ease / 0.2s / 0.12s; Reduce Motion = instant or fade-only |
