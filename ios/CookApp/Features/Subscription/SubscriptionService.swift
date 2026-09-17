import Foundation

struct SubscriptionEntitlement: Equatable, Sendable {
    let id: String
    let isActive: Bool
}

protocol SubscriptionService: AnyObject {
    var entitlements: [SubscriptionEntitlement] { get }
    func configure(userID: String?) async
    func purchase(packageID: String) async throws
    func restorePurchases() async throws
    func refreshEntitlements() async throws
    func isProActive() -> Bool
}
