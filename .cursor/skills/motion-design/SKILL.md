---
name: motion-design
description: Motion for page transitions, hover, spring animation, loading, and gesture interaction. Covers timing, easing, choreography, and UI-adapted Disney principles. Use when adding animations, micro-interactions, springs, gestures, loading motion, or when the user mentions motion-design.
license: MIT
---

# Motion Design

Source: [LottieFiles/motion-design-skill](https://github.com/LottieFiles/motion-design-skill) (MIT), condensed for this project. Read [patterns/state-feedback.md](patterns/state-feedback.md) and [patterns/gestures-and-springs.md](patterns/gestures-and-springs.md) when implementing.

If `DESIGN.md` exists, use **Premium / iOS** personality: restrained springs, no carnival bounce.

## When to apply

- Page / screen transitions
- Hover and press
- Spring physics
- Loading, success, error
- Gesture (swipe, drag, pinch) with a non-gesture fallback

## 8-step checklist

1. Emotional target
2. Personality (this project: Premium / iOS)
3. Primary property (prefer transform/opacity)
4. Duration from the table
5. Easing: enter = decelerate, exit = accelerate
6. Hero element
7. Secondary motion (shadow, icon) — not decoration-only
8. Never move more than ~1/3 of the viewport without a keyframe

## Duration

| Element | Duration |
| Tooltip / hover | 80–120ms |
| Button press | 120–180ms |
| Icon | 150–250ms |
| Card enter | 200–350ms |
| Modal / sheet | 300–400ms |
| Page transition | 350–600ms |

Hover in <100ms, hover out 150–200ms. Enter longer than exit.

## Springs (defaults)

| Use | Response | Damping |
| Press / toggle | 0.20–0.28 | 0.70–0.85 |
| Sheet / drag return | 0.40 | 0.70–0.86 |
| Page | 0.45–0.55 | 0.90 |
| Playful (avoid unless asked) | 0.35 | 0.55 |

CSS / Motion example:

```js
{ type: "spring", stiffness: 500, damping: 30 } // snappy
{ type: "spring", stiffness: 300, damping: 24 } // sheet
```

Animate `transform` and `opacity` only. Never `transition: all`. Honor `prefers-reduced-motion`.

## Quality gates

- No linear spatial movement
- No opacity-only for important state changes
- Interruptible: user input wins mid-animation
- Loading is a state of the control, not a separate random spinner style per screen
- For a reference-locked recording, reproduce only motion and interaction states
  unambiguously visible in the authorized source; capture the relevant source
  frames at native size before declaring a match.
