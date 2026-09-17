---
name: frontend-design
description: Guidance for distinctive, intentional visual design when building new UI or reshaping an existing one. Helps with aesthetic direction, typography, layout, spacing, color, visual hierarchy, and component consistency. Use when building React, Next.js, Tailwind, or other frontend UI, or when the user mentions frontend-design, visual identity, or avoiding templated AI UI.
---

# Frontend Design

Approach this as the design lead at a small studio known for giving every client a visual identity that could not be mistaken for anyone else's. This client has already rejected proposals that felt templated, and is paying for a distinctive point of view: make deliberate, opinionated choices about palette, typography, and layout that are specific to this brief, and take one real aesthetic risk you can justify.

Source: [anthropics/skills frontend-design](https://github.com/anthropics/skills/tree/main/skills/frontend-design) (Apache-2.0). If this project has `DESIGN.md`, that file wins over generic taste.

## Ground it in the subject

If the brief does not pin down what the product or subject is, pin it yourself before designing: name one concrete subject, its audience, and the page's single job, and state your choice. The subject's own world — materials, instruments, artifacts, vernacular — is where distinctive choices come from. Build with real content throughout.

Prefer real-app references (Mobbin, Figma, Apple HIG) over invented SaaS dashboards.

## Design principles

For web designs, the hero is a thesis. Open with the most characteristic thing in the subject's world. A big number with a small label, supporting stats, and a gradient accent is the template answer — only use it if it is truly the best option.

Typography carries personality. Pair display and body faces deliberately. Set a clear type scale with intentional weights, widths, and spacing.

Structure is information. Numbered markers (01 / 02 / 03) are only appropriate if the content is actually a sequence.

Leverage motion deliberately. An orchestrated moment lands harder than scattered effects. Extra animation can make the design feel AI-generated.

Match complexity to the vision. Maximalist directions need elaborate execution; minimal directions need precision in spacing, type, and detail.

## Required craft checks (always)

Before shipping UI, verify:

- Layout: alignment, grid, safe areas, no accidental overlap
- Spacing: one spacing scale (4/8pt), no random 7px/13px gaps
- Type: hierarchical sizes/weights, one family system
- Color: tokenized palette, light and dark, low-contrast hairline borders when the brief asks for glass
- Visual hierarchy: one primary action per screen
- Component consistency: same control looks the same everywhere
- Interaction states on every control: default, hover, active, disabled, loading

## Process

AI-generated design currently clusters around three defaults: (1) cream + terracotta serif; (2) near-black + acid-green/vermilion; (3) broadsheet hairlines. Do not spend free axes on these unless the brief asks.

Work in two passes:

1. Compact token plan: 4–6 named colors, 2+ typefaces, layout concept + ASCII wireframe, one signature element.
2. Critique the plan against the brief. If it would look the same for any similar page, revise before coding.

Then implement from the token plan only. After build, screenshot and self-critique. Remove one accessory.

## Anti-patterns

- Generic SaaS template: indigo/violet, gradient text, identical card grids
- Meaningless card stacks wrapping every section
- Placeholder copy left in the UI
- Missing hover / active / disabled / loading states
- Mixing unrelated radii, shadows, and icon families
