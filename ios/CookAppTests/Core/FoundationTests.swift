import Foundation
@testable import CookApp
import Testing

struct AppErrorTests {
    @Test func networkErrorExposesMessage() {
        let error = AppError.network(message: "offline")
        #expect(error.errorDescription == "offline")
    }

    @Test func unauthorizedHasFriendlyCopy() {
        #expect(AppError.unauthorized.errorDescription == "Please sign in again.")
    }
}

struct DesignTokenTests {
    @Test func spacingScaleIsStable() {
        #expect(DesignTokens.Spacing.md == 16)
        #expect(DesignTokens.Radius.card == 16)
    }
}

struct ThemeModeTests {
    @Test func systemHasNoForcedScheme() {
        #expect(AppThemeMode.system.preferredColorScheme == nil)
        #expect(AppThemeMode.dark.preferredColorScheme == .dark)
    }
}

struct ServerSubscriptionTests {
    @Test func activeWithoutExpiryIsPro() {
        let sub = ServerSubscription(
            userID: "u",
            status: "active",
            productID: "pro_monthly",
            entitlementID: "pro",
            expiresAt: nil,
            willRenew: true
        )
        #expect(sub.isProActive)
    }

    @Test func expiredStatusIsNotPro() {
        let sub = ServerSubscription(
            userID: "u",
            status: "expired",
            productID: "pro_monthly",
            entitlementID: "pro",
            expiresAt: Date().addingTimeInterval(3600),
            willRenew: false
        )
        #expect(!sub.isProActive)
    }
}
