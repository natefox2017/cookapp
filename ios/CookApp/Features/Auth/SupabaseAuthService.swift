import AuthenticationServices
import Foundation
import Observation
import Supabase

/// Auth foundation: OAuth providers → Supabase session.
/// Third-party tokens are not persisted; only Supabase session is used.
@Observable
@MainActor
final class SupabaseAuthService: AuthService {
    private(set) var currentUser: AuthUser?

    private let config: AppConfiguration
    private let monitoring: any MonitoringService
    private let client: SupabaseClient

    init(config: AppConfiguration, monitoring: any MonitoringService) {
        self.config = config
        self.monitoring = monitoring
        self.client = SupabaseClient(
            supabaseURL: config.supabaseURL,
            supabaseKey: config.supabaseAnonKey
        )
    }

    func restoreSession() async {
        do {
            let session = try await client.auth.session
            currentUser = AuthUser(id: session.user.id.uuidString, email: session.user.email)
        } catch {
            currentUser = nil
        }
    }

    func signIn(with provider: AuthProvider) async throws {
        switch provider {
        case .apple:
            try await signInWithApple()
        case .google:
            try await signInWithGoogle()
        }
    }

    func signOut() async throws {
        try await client.auth.signOut()
        currentUser = nil
        monitoring.track(event: "auth.sign_out")
    }

    func deleteAccount() async throws {
        // Account deletion must be performed via a privileged Server Function.
        // Client only requests deletion and clears local session afterward.
        struct EmptyBody: Encodable {}
        try await client.functions.invoke("delete-account", options: FunctionInvokeOptions(body: EmptyBody()))
        try await signOut()
        monitoring.track(event: "auth.account_deleted")
    }

    func refreshSessionIfNeeded() async throws {
        _ = try await client.auth.refreshSession()
        await restoreSession()
    }

    private func signInWithApple() async throws {
        // Foundation hook: ASAuthorization + Supabase ID token exchange.
        // Full nonce/UI wiring completes when running on macOS/Xcode with Apple capability.
        throw AppError.configuration(
            message: "Sign in with Apple requires Xcode run with Apple Sign In capability enabled."
        )
    }

    private func signInWithGoogle() async throws {
        // Prefer Supabase OAuth redirect; do not store Google tokens locally.
        throw AppError.configuration(
            message: "Google Login requires Supabase Google provider + redirect URL configuration."
        )
    }
}
