import AuthenticationServices
import Foundation
import Observation
import Supabase
import UIKit

/// Auth foundation: OAuth providers → Supabase session.
/// Third-party tokens are not persisted; only Supabase session is used.
@Observable
@MainActor
final class SupabaseAuthService: AuthService {
    private(set) var currentUser: AuthUser?

    private let config: AppConfiguration
    private let monitoring: any MonitoringService
    private let client: SupabaseClient
    private let appleSignIn = AppleSignInCoordinator()

    var supabaseClient: SupabaseClient { client }

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
            currentUser = mapUser(session.user)
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
        monitoring.track(event: "auth.sign_in", properties: ["provider": provider.rawValue])
    }

    func signOut() async throws {
        try await client.auth.signOut()
        currentUser = nil
        monitoring.track(event: "auth.sign_out")
    }

    func deleteAccount() async throws {
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
        let apple = try await appleSignIn.signIn()
        let session = try await client.auth.signInWithIdToken(
            credentials: .init(
                provider: .apple,
                idToken: apple.idToken,
                nonce: apple.rawNonce
            )
        )
        currentUser = mapUser(session.user)

        if let fullName = apple.fullName {
            let parts = [fullName.givenName, fullName.middleName, fullName.familyName]
                .compactMap { $0 }
                .filter { !$0.isEmpty }
            if !parts.isEmpty {
                let fullNameString = parts.joined(separator: " ")
                try? await client.auth.update(
                    user: UserAttributes(
                        data: [
                            "full_name": .string(fullNameString),
                            "given_name": .string(fullName.givenName ?? ""),
                            "family_name": .string(fullName.familyName ?? ""),
                        ]
                    )
                )
            }
        }
    }

    private func signInWithGoogle() async throws {
        // Supabase OAuth — Google tokens stay with Supabase; app only keeps session.
        try await client.auth.signInWithOAuth(
            credentials: .init(
                provider: .google,
                redirectTo: URL(string: "cookapp://auth-callback")
            )
        ) { url, _ in
            try await self.openAuthURL(url)
        }

        let session = try await client.auth.session
        currentUser = mapUser(session.user)
    }

    private func openAuthURL(_ url: URL) async throws {
        try await withCheckedThrowingContinuation { (continuation: CheckedContinuation<Void, Error>) in
            let session = ASWebAuthenticationSession(
                url: url,
                callbackURLScheme: "cookapp"
            ) { callbackURL, error in
                if let error {
                    if let authError = error as? ASWebAuthenticationSessionError,
                       authError.code == .canceledLogin {
                        continuation.resume(throwing: AppError.cancelled)
                    } else {
                        continuation.resume(throwing: AppError.network(message: error.localizedDescription))
                    }
                    return
                }

                guard let callbackURL else {
                    continuation.resume(throwing: AppError.unauthorized)
                    return
                }

                Task { @MainActor in
                    do {
                        try await self.client.auth.session(from: callbackURL)
                        continuation.resume()
                    } catch {
                        continuation.resume(throwing: error)
                    }
                }
            }
            session.presentationContextProvider = AuthWebPresentationContext.shared
            session.prefersEphemeralWebBrowserSession = false
            if !session.start() {
                continuation.resume(throwing: AppError.configuration(message: "Unable to start Google auth session."))
            }
        }
    }

    private func mapUser(_ user: User) -> AuthUser {
        AuthUser(id: user.id.uuidString, email: user.email)
    }
}

@MainActor
private final class AuthWebPresentationContext: NSObject, ASWebAuthenticationPresentationContextProviding {
    static let shared = AuthWebPresentationContext()

    func presentationAnchor(for session: ASWebAuthenticationSession) -> ASPresentationAnchor {
        let scenes = UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }
        if let key = scenes.flatMap(\.windows).first(where: \.isKeyWindow) {
            return key
        }
        return scenes.flatMap(\.windows).first ?? ASPresentationAnchor()
    }
}
