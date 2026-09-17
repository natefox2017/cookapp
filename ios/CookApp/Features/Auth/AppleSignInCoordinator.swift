import AuthenticationServices
import CryptoKit
import Foundation
import UIKit

/// Presents native Sign in with Apple and returns identity token + raw nonce.
@MainActor
final class AppleSignInCoordinator: NSObject {
    private var continuation: CheckedContinuation<AppleSignInResult, Error>?
    private var currentNonce: String?

    struct AppleSignInResult: Sendable {
        let idToken: String
        let rawNonce: String
        let fullName: PersonNameComponents?
        let email: String?
    }

    func signIn() async throws -> AppleSignInResult {
        let rawNonce = Self.randomNonce()
        currentNonce = rawNonce

        return try await withCheckedThrowingContinuation { continuation in
            self.continuation = continuation

            let request = ASAuthorizationAppleIDProvider().createRequest()
            request.requestedScopes = [.fullName, .email]
            request.nonce = Self.sha256(rawNonce)

            let controller = ASAuthorizationController(authorizationRequests: [request])
            controller.delegate = self
            controller.presentationContextProvider = self
            controller.performRequests()
        }
    }

    private func finish(_ result: Result<AppleSignInResult, Error>) {
        continuation?.resume(with: result)
        continuation = nil
        currentNonce = nil
    }

    private static func randomNonce(length: Int = 32) -> String {
        var bytes = [UInt8](repeating: 0, count: length)
        _ = SecRandomCopyBytes(kSecRandomDefault, bytes.count, &bytes)
        let charset = Array("0123456789ABCDEFGHIJKLMNOPQRSTUVXYZabcdefghijklmnopqrstuvwxyz-._")
        return String(bytes.map { charset[Int($0) % charset.count] })
    }

    private static func sha256(_ input: String) -> String {
        let data = Data(input.utf8)
        let hash = SHA256.hash(data: data)
        return hash.map { String(format: "%02x", $0) }.joined()
    }
}

extension AppleSignInCoordinator: ASAuthorizationControllerDelegate {
    nonisolated func authorizationController(
        controller: ASAuthorizationController,
        didCompleteWithAuthorization authorization: ASAuthorization
    ) {
        Task { @MainActor in
            guard
                let credential = authorization.credential as? ASAuthorizationAppleIDCredential,
                let tokenData = credential.identityToken,
                let idToken = String(data: tokenData, encoding: .utf8),
                let nonce = currentNonce
            else {
                finish(.failure(AppError.unauthorized))
                return
            }

            finish(
                .success(
                    AppleSignInResult(
                        idToken: idToken,
                        rawNonce: nonce,
                        fullName: credential.fullName,
                        email: credential.email
                    )
                )
            )
        }
    }

    nonisolated func authorizationController(
        controller: ASAuthorizationController,
        didCompleteWithError error: Error
    ) {
        Task { @MainActor in
            if let authError = error as? ASAuthorizationError, authError.code == .canceled {
                finish(.failure(AppError.cancelled))
            } else {
                finish(.failure(AppError.unauthorized))
            }
        }
    }
}

extension AppleSignInCoordinator: ASAuthorizationControllerPresentationContextProviding {
    nonisolated func presentationAnchor(for controller: ASAuthorizationController) -> ASPresentationAnchor {
        MainActor.assumeIsolated {
            let scenes = UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }
            if let key = scenes.flatMap(\.windows).first(where: \.isKeyWindow) {
                return key
            }
            return scenes.flatMap(\.windows).first ?? ASPresentationAnchor()
        }
    }
}
