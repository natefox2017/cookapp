# Gestures and springs

## Page transitions
- iOS push: incoming from trailing edge, outgoing slightly left, 350ms
- Modal/sheet: from bottom, spring, dismiss faster than present
- Tab: cross-fade or morph shared chrome, no slide-the-world
- Shared-element: one `layoutId` / matched geometry, not two competing slides

## Gesture
- Swipe-back, sheet pull-down, list swipe actions
- Drag must be interruptible and rubber-band
- Every gesture needs tap/click and keyboard equivalent
- `touch-action: manipulation` on web; 44pt hit target

## Spring recipe
```swift
withAnimation(.spring(response: 0.4, dampingFraction: 0.86)) { }
```

```tsx
<motion.button
  whileHover={{ scale: 1.02 }}
  whileTap={{ scale: 0.97 }}
  transition={{ type: "spring", stiffness: 500, damping: 30 }}
/>
```

Reduce Motion: replace travel with 120ms opacity cross-fade.
