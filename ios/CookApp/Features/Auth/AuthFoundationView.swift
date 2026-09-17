import SwiftUI

/// Minimal platform auth surface (foundation only — not product marketing UI).
struct AuthFoundationView: View {
    @Environment(AppDependencyContainer.self) private var dependencies
    @State private var isBusy = false
    @State private var errorMessage: String?

    var body: some View {
        VStack(spacing: DesignTokens.Spacing.lg) {
            Text("CookApp")
                .font(DesignTokens.Typography.pageTitle)
                .foregroundStyle(Color.cookBrand)

            Text("Sign in to enable sync, restore, and subscriptions.")
                .font(DesignTokens.Typography.meta)
                .foregroundStyle(Color.cookSecondaryText)
                .multilineTextAlignment(.center)

            Button {
                Task { await signIn(.apple) }
            } label: {
                Label("Sign in with Apple", systemImage: "apple.logo")
                    .frame(maxWidth: .infinity)
            }
            .buttonStyle(.borderedProminent)
            .tint(.primary)
            .disabled(isBusy)

            Button {
                Task { await signIn(.google) }
            } label: {
                Text("Continue with Google")
                    .frame(maxWidth: .infinity)
            }
            .buttonStyle(.borderedProminent)
            .tint(Color.cookBrand)
            .disabled(isBusy)

            if let errorMessage {
                Text(errorMessage)
                    .font(DesignTokens.Typography.caption)
                    .foregroundStyle(Color.cookDestructive)
            }
        }
        .padding(DesignTokens.Spacing.lg)
    }

    private func signIn(_ provider: AuthProvider) async {
        isBusy = true
        errorMessage = nil
        defer { isBusy = false }
        do {
            try await dependencies.authService.signIn(with: provider)
            await dependencies.linkPurchasesToCurrentUser()
        } catch let error as AppError where error == .cancelled {
            // User cancelled.
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}
