# HIG Principles — Liquid Glass

Apple HIG for iOS 26 is organized around **Hierarchy**, **Harmony**, and **Consistency**. Distilled for implementation.

## Hierarchy
Glass belongs to the navigation layer. Content stays solid. Glass should recede until the user looks at it.

## Harmony
Use system components (`NavigationStack`, `TabView`, `Toolbar`, `.searchable`). Match concentric corner radii. Tint semantically, not as brand paint on the material.

## Consistency
The same surface looks the same on iPhone, iPad, and landscape. Do not invent a new glass shape per screen.

## Material
Liquid Glass is a lens: refraction, specular highlights, adaptive shadows, morphing. A CSS `backdrop-filter: blur(12px)` without hairline, saturate, and motion is frosted overlay, not Liquid Glass.

## Where glass belongs

| Layer | Examples | Glass |
| Navigation | Nav bar, tab bar, toolbar, FAB | yes |
| Controls | Buttons, segmented, pickers | usually |
| Sheets | Grabber and chrome | system |
| Content | Rows, article cards, hero media | no |
| Full-screen background | | never |

Test: can the user grab and move this surface? Chrome = glass. Content = not glass.

## Layering
Maximum two stacked glass layers. Glass cannot sample other glass — merge siblings in one container. Always test over photos and scrolling content, never only over a flat fill.

## Accessibility
Reduce Transparency densifies glass. Body text over glass needs 4.5:1. Never use tint as the only differentiator.

Sources: Apple HIG Materials; WWDC 2025 sessions on the new design system and Liquid Glass.
