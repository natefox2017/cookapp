---
name: design-critique
description: UI/UX audit of existing pages and components. Checks alignment, spacing, type hierarchy, icon rules, color consistency, interaction states, and match to a reference design. Use when asked to review UI, critique a screen, design QA, compare to Figma/Mobbin/Apple, or run design-critique.
---

# Design Critique

Read-only review. Do not change product code unless the user asks to implement the fixes. Produce a structured critique with file/component evidence.

If `DESIGN.md` exists, it is the project design standard. Also load `frontend-design`, `ios-design-system`, `motion-design`, and `vercel-web-design-guidelines` when those surfaces apply.

## Workflow

1. Identify stack, screens, tokens, and component library.
2. Capture real UI when possible (browser screenshot, simulator, Figma frame). A layout screenshot beats guessing from CSS.
3. If a reference exists (Figma, Mobbin, Apple HIG, DESIGN.md), compare against it first.
4. Score the required checks below.
5. Output the report. Do not ask unnecessary questions — evaluate what is in the codebase and screenshots.

## Required checks

Every review must cover:

### Alignment
- Elements snap to a consistent grid / safe area
- Text baselines, icon optical centers, trailing actions line up
- No 1–3px accidental offsets

### Spacing
- One spacing scale (prefer 4/8pt)
- Equal gaps between sibling items
- Padding inside similar components matches

### Type hierarchy
- Distinct display / title / body / caption roles
- Size ratio between heading levels ≥ 1.2
- Weights used for emphasis, not everywhere
- Line length and line-height remain readable

### Icon rules
- One icon family (SF Symbols on iOS, one set on web)
- Optical size matches text
- Icon-only controls have accessible names
- Icons are not mixed outline/filled without meaning

### Color consistency
- Colors come from tokens, not one-off hex
- Semantic colors are stable (error is always error)
- Light and dark both designed, not inverted
- Hairline borders stay low-contrast when the system is glass

### Interaction states
Every interactive component must have: **default, hover, active, disabled, loading**. Flag any missing state. Also check empty, error, success, and focus-visible.

### Reference match
If a Figma / Mobbin / Apple / DESIGN.md reference exists:
- Layout structure matches
- Hierarchy matches
- Spacing rhythm matches
- Do not pixel-diff decorative noise; do flag missing chrome, wrong component, or SaaS-template drift

If the task is a supplied recording/screenshot recreation, load
`.cursor/rules/reference-fidelity.mdc` and audit every authorized source at its
native viewport. Require a per-screen measurement spec and exact-size evidence.
Review side-by-side first, then by overlay/pixel-diff or guides. Treat any
visible image-crop, margin, baseline, control, icon, or icon-label-center-axis
offset as a failure. Confirm the source-matching vector asset and reject blank
or generic substitute icons. Do not approve invented states or flows.

## Report format

```markdown
# Design Critique

## Summary
[2–3 sentences. The one thing to fix first.]

## Scores (1–5)
| Check | Score | Notes |
| Alignment |  |
| Spacing |  |
| Type hierarchy |  |
| Icons |  |
| Color |  |
| Interaction states |  |
| Reference match |  |

## Critical
1. [file/component] — [issue] → [exact change]

## High
1. ...

## Medium
1. ...

## Strengths
1. ...

## Missing states
| Component | default | hover | active | disabled | loading |
```

Every finding names a file, component, or screenshot region and a concrete replacement. "Improve spacing" is not a finding.
