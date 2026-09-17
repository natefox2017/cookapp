import SwiftUI

/// Phase 1 root shell — auth + subscription foundation only.
struct RootView: View {
    @Environment(AppDependencyContainer.self) private var dependencies

    var body: some View {
        Group {
            if dependencies.authService.currentUser == nil {
                AuthFoundationView()
            } else {
                signedInHome
            }
        }
        .tint(Color.cookBrand)
        .task {
            await dependencies.start()
        }
    }

    private var signedInHome: some View {
        NavigationStack {
            List {
                Section("Account") {
                    LabeledContent("User", value: dependencies.authService.currentUser?.email ?? dependencies.authService.currentUser?.id ?? "—")
                    Button("Sign Out", role: .destructive) {
                        Task { try? await dependencies.authService.signOut() }
                    }
                }

                Section("Subscription") {
                    LabeledContent(
                        "Pro",
                        value: dependencies.subscriptionService.isProActive() ? "Active" : "Inactive"
                    )
                    if let server = dependencies.subscriptionService.serverSubscription {
                        LabeledContent("Server status", value: server.status)
                        if let product = server.productID {
                            LabeledContent("Product", value: product)
                        }
                    }
                    Button("Refresh entitlements") {
                        Task {
                            try? await dependencies.subscriptionService.refreshEntitlements()
                            try? await dependencies.subscriptionService.refreshServerSubscription()
                        }
                    }
                    Button("Restore purchases") {
                        Task { try? await dependencies.subscriptionService.restorePurchases() }
                    }
                    Button("Purchase current offering") {
                        Task { try? await dependencies.subscriptionService.purchase(packageID: "") }
                    }
                }
            }
            .navigationTitle("CookApp")
        }
    }
}

#Preview {
    RootView()
        .environment(AppDependencyContainer.bootstrap())
}
