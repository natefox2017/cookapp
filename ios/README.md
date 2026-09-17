# CookApp iOS

Swift 6 + SwiftUI foundation for Phase 1 (Issue #5).

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
| `Core/Theme` | Design tokens + theme mode (Light/Dark/System) |
| `Core/Config` | Environment configuration |
| `Core/Networking` | URLSession network client |
| `Core/Error` | Shared `AppError` |
| `Core/Monitoring` | Analytics/crash hooks (console stub) |
| `Features/Auth` | Apple/Google → Supabase Auth foundation |
| `Features/Subscription` | StoreKit 2 + RevenueCat foundation |

## Dependencies (SPM)

- [supabase-swift](https://github.com/supabase/supabase-swift) ≥ 2.0.0
- [purchases-ios-spm](https://github.com/RevenueCat/purchases-ios-spm) ≥ 5.0.0

## Out of scope (Phase 1)

Business recipe flows, AI logic, Meal Plan / Pantry / Household UI.
