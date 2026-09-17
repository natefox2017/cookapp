import Foundation
import Observation
import RevenueCat
import Supabase

/// Payment foundation via StoreKit 2 + RevenueCat.
/// Receipt validation is RevenueCat's job; Supabase stores server entitlements via webhook.
@Observable
@MainActor
final class RevenueCatSubscriptionService: SubscriptionService {
    private(set) var entitlements: [SubscriptionEntitlement] = []
    private(set) var serverSubscription: ServerSubscription?

    private let config: AppConfiguration
    private let monitoring: any MonitoringService
    private let supabase: SupabaseClient
    private var didConfigure = false

    init(config: AppConfiguration, monitoring: any MonitoringService, supabase: SupabaseClient) {
        self.config = config
        self.monitoring = monitoring
        self.supabase = supabase
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
            // Critical: app_user_id must be Supabase user UUID so webhook can resolve the row.
            _ = try? await Purchases.shared.logIn(userID)
        }

        await refreshEntitlementsQuietly()
        try? await refreshServerSubscription()
    }

    func purchase(packageID: String) async throws {
        try ensureConfigured()
        let offerings = try await Purchases.shared.offerings()
        guard let package = offerings.current?.availablePackages.first(where: { $0.identifier == packageID })
                ?? offerings.current?.availablePackages.first else {
            throw AppError.payment(message: "Package not found: \(packageID)")
        }

        let result = try await Purchases.shared.purchase(package: package)
        if result.userCancelled {
            throw AppError.cancelled
        }

        mapEntitlements(from: result.customerInfo)
        monitoring.track(event: "subscription.purchase", properties: ["package": packageID])

        // Webhook is source of truth; poll briefly for eventual consistency.
        await waitForServerSync(timeoutSeconds: 8)
    }

    func restorePurchases() async throws {
        try ensureConfigured()
        let info = try await Purchases.shared.restorePurchases()
        mapEntitlements(from: info)
        monitoring.track(event: "subscription.restore")
        await waitForServerSync(timeoutSeconds: 8)
    }

    func refreshEntitlements() async throws {
        try ensureConfigured()
        let info = try await Purchases.shared.customerInfo()
        mapEntitlements(from: info)
    }

    func refreshServerSubscription() async throws {
        struct Row: Decodable {
            let user_id: UUID
            let status: String
            let product_id: String?
            let entitlement_id: String?
            let expires_at: Date?
            let will_renew: Bool?
        }

        let rows: [Row] = try await supabase
            .from("subscriptions")
            .select()
            .limit(1)
            .execute()
            .value

        guard let row = rows.first else {
            serverSubscription = nil
            return
        }

        serverSubscription = ServerSubscription(
            userID: row.user_id.uuidString,
            status: row.status,
            productID: row.product_id,
            entitlementID: row.entitlement_id,
            expiresAt: row.expires_at,
            willRenew: row.will_renew
        )
    }

    func isProActive() -> Bool {
        if let serverSubscription, serverSubscription.isProActive {
            return true
        }
        // Client cache while webhook catches up.
        return entitlements.contains { $0.id == "pro" && $0.isActive }
    }

    private func ensureConfigured() throws {
        guard didConfigure else {
            throw AppError.configuration(message: "RevenueCat is not configured. Set COOKAPP_REVENUECAT_API_KEY.")
        }
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

    private func waitForServerSync(timeoutSeconds: Double) async {
        let deadline = Date().addingTimeInterval(timeoutSeconds)
        while Date() < deadline {
            try? await refreshServerSubscription()
            if serverSubscription?.isProActive == true || isProActive() && serverSubscription != nil {
                return
            }
            try? await Task.sleep(nanoseconds: 800_000_000)
        }
        try? await refreshServerSubscription()
    }
}
