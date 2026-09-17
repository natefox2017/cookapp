---
name: ios-design-system
description: iOS app UI using Apple Human Interface Guidelines and iOS 26 Liquid Glass. Covers Navigation, Tab Bar, Sheet, Card, Button, Input, Modal, and Animation. Use when designing or implementing iOS, SwiftUI, iPhone, iPad, glassmorphism, Liquid Glass, or ios-design-system.
---

# iOS Design System

Build and review iOS UI as a native iOS 26 app, not a web dashboard inside a phone frame.

Authoritative references:

- Apple HIG: https://developer.apple.com/design/human-interface-guidelines
- Materials: https://developer.apple.com/design/human-interface-guidelines/materials
- This skill's notes: [references/hig-principles.md](references/hig-principles.md), [references/design-tokens.md](references/design-tokens.md), [references/components.md](references/components.md)
- If the stack is SwiftUI iOS 26+, prefer native `glassEffect` / `GlassEffectContainer` over CSS blur copies

If `DESIGN.md` exists, follow it. Default direction for this repo: iOS 26 / Liquid Glass, light and dark, translucent materials, low-contrast borders, tight spacing, high-quality motion.

## When to load

- Any iOS / SwiftUI / iPhone / iPad screen
- Liquid Glass, glassmorphism, `.glassEffect`, tab bar, sheet, navigation bar
- Figma → iOS (also load the Figma `figma-swiftui` skill when a Figma URL is present)

## Golden rules

1. Glass is chrome, not content. Nav, tab bar, toolbar, FABs, sheets — yes. List rows, hero backgrounds, every card — no.
2. Prefer system containers: `NavigationStack`, `TabView`, `.sheet`, `.searchable`. They are already glass in iOS 26. Do not double-wrap.
3. Maximum two glass layers. Group siblings in `GlassEffectContainer`.
4. Light and dark are first-class. Use semantic colors, not raw hex.
5. Borders are hairline and low-contrast (`separator` / 8–12% white or black), not 1px solid gray slabs.
6. Touch targets ≥ 44pt. SF Symbols only on iOS; for a reference-locked task,
   use one only if its silhouette and optical geometry match the source.
7. Every control implements default / hover (pointer) / active / disabled / loading.
8. Respect Reduce Transparency, Increase Contrast, Reduce Motion, Dynamic Type.

## Decision tree

```
Need a surface?
├─ Navigation / title / back / trailing actions → NavigationStack + toolbar
├─ Root destinations → TabView (≤5 tabs)
├─ Secondary flow, filters, compose → sheet (.medium/.large)
├─ Blocking decision → confirmation dialog or modal
├─ Content grouping → Card (solid or ultra-light, not glass soup)
├─ Action → Button (.glass / .glassProminent / plain)
└─ Data entry → Input (system TextField, labeled, validated)
```

## Implementation notes

SwiftUI iOS 26:

```swift
.buttonStyle(.glassProminent)
.glassEffect(.regular.interactive(), in: .capsule)
GlassEffectContainer(spacing: 16) { ... }
```

Web / React that must feel like iOS: approximate materials with backdrop-filter, saturate, hairline border, and semantic light/dark tokens. Do not fake iOS with shadcn dashboard cards.

## Motion

Use `motion-design` for timing. iOS defaults:

- Push: 350ms, system curve
- Sheet present: spring, damping ~0.86
- Tab switch: cross-fade / morph, no bounce
- Press: scale 0.97, 120ms
- Always honor `prefers-reduced-motion`

## Do not

- Generate ordinary SaaS templates
- Stack glass cards as the entire page
- Use Material Design ripples, FAB+bottom-nav Android hybrids, or Bootstrap forms
- Mix SF Symbols with random SVG icon packs
- For supplied screenshot/recording recreation, improvise a system-style layout:
  load `reference-fidelity.mdc`, retain source-measured geometry, constrain
  repeated rows/nav with Auto Layout, and validate at the native viewport.
