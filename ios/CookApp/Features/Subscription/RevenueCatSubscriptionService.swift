import Foundation
import Observation
import RevenueCat

/// Payment foundation via StoreKit 2 + RevenueCat.
/// Keep subscription logic independent from recipe/business features.
@Observable
@MainActor
final class RevenueCatSubscriptionService: SubscriptionService {
    private(set) var entitlements: [SubscriptionEntitlement] = []

    private let config: AppConfiguration
    private let monitoring: any MonitoringService
    private var didConfigure = false

    init(config: AppConfiguration, monitoring: any MonitoringService) {
        self.config = config
        self.monitoring = monitoring
    }

    func configure(userID: String?) async {
        guard !config.revenueCatAPIKey.hasPrefix("REPLACE_WITH") else {
            monitoring.log(level: .warning, message: "RevenueCat API key placeholder — skip configure.")
            return
        }

        if !didConfigure {
            Purchases.logLevel = config.environment == .debug ? .debug : .warn
            Purchases.configure(withAPIKey: config.revenueCatAPIKey)
            didConfigure = true
        }

        if let userID {
            _ = try? await Purchases.shared.logIn(userID)
        }

        await refreshEntitlementsQuietly()
    }

    func purchase(packageID: String) async throws {
        let offerings = try await Purchases.shared.offerings()
        guard let package = offerings.current?.availablePackages.first(where: { $0.identifier == packageID })
                ?? offerings.current?.availablePackages.first else {
            throw AppError.payment(message: "Package not found: \(packageID)")
        }

        let result = try await Purchases.shared.purchase(package: package)
        mapEntitlements(from: result.customerInfo)
        monitoring.track(event: "subscription.purchase", properties: ["package": packageID])
    }

    func restorePurchases() async throws {
        let info = try await Purchases.shared.restorePurchases()
        mapEntitlements(from: info)
        monitoring.track(event: "subscription.restore")
    }

    func refreshEntitlements() async throws {
        let info = try await Purchases.shared.customerInfo()
        mapEntitlements(from: info)
    }

    func isProActive() -> Bool {
        entitlements.contains { $0.id == "pro" && $0.isActive }
    }

    private func refreshEntitlementsQuietly() async {
        do {
            try await refreshEntitlements()
        } catch {
            monitoring.log(level: .warning, message: "Entitlement refresh failed: \(error.localizedDescription)")
        }
    }

    private func mapEntitlements(from info: CustomerInfo) {
        entitlements = info.entitlements.all.map { key, value in
            SubscriptionEntitlement(id: key, isActive: value.isActive)
        }
    }
}
