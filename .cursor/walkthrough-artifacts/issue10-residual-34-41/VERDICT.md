# Issue #10 Residual Fix — 34 General / 41 Paywall (2026-09-17)

Evidence:
- Before: `.cursor/walkthrough-artifacts/issue10-residual-34-41/before/`
- After: `.cursor/walkthrough-artifacts/issue10-residual-34-41/after/`
- Side-by-side: `.cursor/walkthrough-artifacts/issue10-residual-34-41/compare/`
- Mirror: `/opt/cursor/artifacts/figma-qa-residual/`

Figma: `FHbikS2jILAeMv8mote0vD` page `37:2`
- 34 instance `117:10081` ← component `116:18852`
- 41 instance `117:10305` ← component `116:19068`

Ignore status bar / Dynamic Island / keyboard.

## Verdicts

| Page | Ref | Verdict | Notes |
|---|---|---|---|
| **34 General** | `settings-general.jpg` | **PASS*** | Notifications+Timers toggles in one card; Auto Convert OFF; App Icon thumb+glyph; Search picker chevrons; section density re-spaced. *App Icon art still simplified vs Pestle photo glyph; Timers dependent tint approximated; header chrome spacing inherits shared Navigation Header. |
| **41 Paywall** | `join-pestle-pro.jpg` | **PASS*** | App Store + laurel “Great Apps Updated for iOS 26” + 5★ social proof; sticky bottom sheet with Continue CTA + Restore/Terms/Privacy/View all plans; timeline lock/bell/card glyphs + connector. *Hero still solid placeholder (no kitchen photo asset); laurel stroke style lighter than Pestle raster. |

## Checklist recommendation
- Check **34** and **41** as PASS* (residuals noted above).
- Leave MISSING_REF / FIGMA_MISSING unchecked (no invented bodies).
- Issue **stays OPEN** for human review of * residuals + MISSING_REF inventory.

## Out of scope
Backend / Admin / MISSING_REF page invention.
