# CookApp iOS

Swift 6 + SwiftUI. Phase 1 foundation + Phase 1.5 navigation skeleton (Issue #42) + Liquid Glass chrome kit (Issue #87).

## Open locally (macOS)

```bash
brew install xcodegen
cd ios
cp Config/Secrets.example.xcconfig Config/Secrets.xcconfig
xcodegen generate
open CookApp.xcodeproj
```

## Bundle

- Bundle ID: `com.natefox.cookapp`
- Display name: CookApp
- Default AppIcon asset (replace later from Figma)

## Modules

| Path | Role |
|------|------|
| `App/` | Entry + DI bootstrap + root shell |
| `App/Navigation/` | `AppTab` / `AppRoute` / `AppSheet` / `AppNavigationState` / `AppShellView` |
| `Core/Theme` | Design tokens + theme mode (Light/Dark/System) |
| `Core/Chrome` | Shared Liquid Glass chrome kit (D1 tab bar, D2 header buttons, D3 menu) |
| `Core/Config` | Environment configuration |
| `Core/Networking` | URLSession network client |
| `Core/Error` | Shared `AppError` |
| `Core/Monitoring` | Analytics/crash hooks (console stub) |
| `Features/Auth` | Apple/Google → Supabase Auth foundation |
| `Features/Subscription` | StoreKit 2 + RevenueCat foundation |
| `Features/Cookbook` | Screen shells (placeholders only) |
| `Features/Groceries` | Screen shells (placeholders only) |
| `Features/MealPlan` | Screen shells (placeholders only) |
| `Features/Settings` | Screen shells (placeholders only) |

## Dependencies (SPM)

- [supabase-swift](https://github.com/supabase/supabase-swift) ≥ 2.0.0
- [purchases-ios-spm](https://github.com/RevenueCat/purchases-ios-spm) ≥ 5.0.0

## Verify navigation skeleton (Linux / CI)

```bash
python3 ios/Scripts/verify_navigation_skeleton.py
```

**Owner note (2026-09-18):** iOS Build / `xcodebuild` / device runs are **deferred** until a usable test environment is confirmed. Do not treat missing Xcode results as a Phase 1.5 or chrome-kit failure. When Owner re-enables testing:

```bash
xcodegen generate
xcodebuild -scheme CookApp -destination 'platform=iOS Simulator,name=iPhone 16' test
```

## Status

- Phase 1.5 skeleton: **done** — Issue [#42](https://github.com/natefox2017/cookapp/issues/42) / PR [#45](https://github.com/natefox2017/cookapp/pull/45) on `main`
- Liquid Glass chrome kit D1–D3: this PR — Issue [#87](https://github.com/natefox2017/cookapp/issues/87)

## Out of scope

Formal Figma **business** UI, recipe/grocery/meal-plan business logic, business Supabase APIs, mock business data, AI.

Shared Liquid Glass **chrome kit** (floating tab bar, header buttons, frosted menu) is in `Core/Chrome`. Do not apply glass to content-layer lists/grids/page fills.

Owner iOS Build/Test is deferred — Linux CI only runs path + skeleton/chrome structural checks.
