import Foundation

struct SubscriptionEntitlement: Equatable, Sendable {
    let id: String
    let isActive: Bool
}

struct ServerSubscription: Equatable, Sendable {
    let userID: String
    let status: String
    let productID: String?
    let entitlementID: String?
    let expiresAt: Date?
    let willRenew: Bool?

    var isProActive: Bool {
        (status == "active" || status == "trialing") &&
            (expiresAt == nil || (expiresAt ?? .distantPast) > Date())
    }
}

protocol SubscriptionService: AnyObject {
    var entitlements: [SubscriptionEntitlement] { get }
    var serverSubscription: ServerSubscription? { get }

    func configure(userID: String?) async
    func purchase(packageID: String) async throws
    func restorePurchases() async throws
    func refreshEntitlements() async throws
    func refreshServerSubscription() async throws
    func isProActive() -> Bool
}
