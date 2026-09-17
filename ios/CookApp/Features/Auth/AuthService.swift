import Foundation

struct AuthUser: Identifiable, Equatable, Sendable {
    let id: String
    let email: String?
}

enum AuthProvider: String, Sendable {
    case apple
    case google
}

protocol AuthService: AnyObject {
    var currentUser: AuthUser? { get }
    func restoreSession() async
    func signIn(with provider: AuthProvider) async throws
    func signOut() async throws
    func deleteAccount() async throws
    func refreshSessionIfNeeded() async throws
}
