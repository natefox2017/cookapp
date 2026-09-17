# DESIGN.md

Project UI constraints for every agent. Read this before generating or changing UI. Then load the matching skill in `.cursor/skills/`.

## Skills to load

| Task | Skill |
| New web / React / Next / Tailwind UI | `frontend-design` |
| Review an existing screen | `design-critique` |
| iOS / SwiftUI / iPhone UI | `ios-design-system` |
| Motion, hover, spring, gesture, loading | `motion-design` |
| Web a11y / responsive / typography audit | `vercel-web-design-guidelines` |

Prefer real references: Mobbin, Figma, Apple Design. When a task supplies an authoritative recording or screenshots, those authorized source files override all other visual references.

项目 UI 必须遵循：
- 优先参考真实 App（Mobbin/Figma/Apple Design）
- 禁止生成普通 SaaS 模板风格
- 禁止无意义 Card 堆叠
- 所有页面必须保持 Design System 一致
- 产品组件必须定义：
  - default
  - hover
  - active
  - disabled
  - loading 状态
- 严格录屏/截图复刻只绘制来源可见或需求明确要求的状态；未展示的状态必须标记为未知，不得虚构视觉或交互。

设计方向：
- iOS 26 / Liquid Glass
- 黑白双主题
- 半透明材质
- 低对比边框
- 精细间距
- 高质量动画

## Tokens (start here)

- Color: semantic light/dark pair, not one-off hex. Hairline borders at 8–14% contrast.
- Type: one family system (iOS: SF Pro). Clear display / title / body / caption roles.
- Space: 4pt base (8 / 12 / 16 / 20 / 24 / 32).
- Radius: concentric. Cards 20–28. Capsule for floating chrome.
- Material: glass on navigation chrome only. Content stays solid.
- Motion: springs, 120–180ms press, 350ms push, reduce-motion cross-fade.

## Reference-locked fidelity

For a supplied screenshot or recording recreation, the authorized source list is the sole basis for visual decisions. Do not blend it with prior Figma work, libraries, product assumptions, or invented states.

Before build, record a per-screen measurement spec: viewport/artboard and safe area; content insets and vertical anchors; every image box’s x/y/w/h, aspect ratio, radius, and crop focal point; text baseline, size, weight, line height, and wrap; icon/control box, optical center, stroke/weight; and color, mask, opacity, blur, and shadow. Treat each visible state as its own spec.

Build repeated rows and navigation with Auto Layout/constraints and reusable instances. Do not hand-position repeated elements. Use the matching vector asset; use an SF Symbol only when its silhouette, weight, and geometry visibly match. Every icon and its label must declare the same center axis; blank or substitute icon slots fail review.

Keep source references separate from the reproduction. Keep the reproduction as one compact grid; never modify an explicitly protected page.

## Done means

- Matches DESIGN.md + the loaded skill
- Light and dark both checked
- Missing states are bugs
- For reference-locked work: capture at the exact native viewport (never a zoomed-out canvas), compare side-by-side with every source, then overlay/pixel-diff or guide-check each source. Any visible offset in image, icon, control, text baseline, or margin is a failure until corrected.
- Define and verify default, pressed, selected, empty, loading, and disabled states when they are visible or required. Do not invent unobserved states, screens, labels, or prototype flows.
- Report only verified evidence and residual differences; never claim “1:1”, “complete”, or “Liquid Glass compliant” without that evidence.
