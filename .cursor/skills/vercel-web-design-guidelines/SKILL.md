---
name: vercel-web-design-guidelines
description: Web UI quality review against Vercel Web Interface Guidelines — accessibility, responsive layout, typography, focus, forms, animation, and anti-patterns. Use when reviewing web UI, checking a11y, auditing layout/typography, or when the user mentions vercel-web-design-guidelines or web-design-guidelines.
metadata:
  author: vercel
  version: "1.0.0"
---

# Vercel Web Interface Guidelines

Official skill: [vercel-labs/agent-skills web-design-guidelines](https://github.com/vercel-labs/agent-skills/tree/main/skills/web-design-guidelines).

Before each review, prefer fetching the latest rules:

https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md

If fetch is unavailable, use the snapshot in [references/command.md](references/command.md).

## How it works

1. Load the guidelines (fetch first, snapshot fallback)
2. Read the named files or the current UI diff
3. Check every rule
4. Output terse `file:line` findings, grouped by file

Also verify:

- Responsive: 320 / 768 / 1024 / 1440, plus iOS safe-area insets
- Accessibility: labels, names, keyboard, focus-visible, reduced motion
- Layout: no overflow, min-w-0 on flex children, skip link
- Typography: hierarchy, tabular nums, balanced headings, real quotes/ellipsis

If no files are specified, ask which files to review — unless the current task already has an obvious UI surface.

Pass example:

```text
## src/Button.tsx
✓ pass
```

Fail example:

```text
src/Button.tsx:42 - icon button missing aria-label
src/Button.tsx:55 - animation missing prefers-reduced-motion
```
