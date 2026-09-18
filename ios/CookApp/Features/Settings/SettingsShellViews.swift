import SwiftUI

// MARK: - Tab root

struct SettingsHomeView: View {
    @Bindable var navigation: AppNavigationState
#if DEBUG
    @State private var showFoundationDiagnostics = false
#endif

    var body: some View {
        RoutePlaceholderView(title: AppTab.settings.title)
            .toolbar {
#if DEBUG
                ToolbarItem(placement: .topBarTrailing) {
                    Menu("Routes") {
                        ForEach(AppRoute.settingsPushRoutes, id: \.self) { route in
                            Button(route.placeholderTitle) {
                                navigation.push(route, on: .settings)
                            }
                        }
                        Divider()
                        Button("Foundation Diagnostics") {
                            showFoundationDiagnostics = true
                        }
                    }
                    .accessibilityIdentifier("debug.routes.settings")
                }
#endif
            }
#if DEBUG
            .sheet(isPresented: $showFoundationDiagnostics) {
                FoundationDiagnosticsView()
            }
#endif
    }
}

// MARK: - Push shells

struct GeneralShellView: View {
    var body: some View { RoutePlaceholderView(title: AppRoute.general.placeholderTitle) }
}

struct AppIconShellView: View {
    var body: some View { RoutePlaceholderView(title: AppRoute.appIcon.placeholderTitle) }
}

struct MarkdownShellView: View {
    var body: some View { RoutePlaceholderView(title: AppRoute.markdown.placeholderTitle) }
}

struct ExperimentsShellView: View {
    var body: some View { RoutePlaceholderView(title: AppRoute.experiments.placeholderTitle) }
}

struct AccountShellView: View {
    @Environment(AppDependencyContainer.self) private var dependencies

    var body: some View {
        VStack(spacing: 16) {
            Text(AppRoute.account.placeholderTitle)
                .font(.title2)
            Button("Sign Out", role: .destructive) {
                Task { try? await dependencies.authService.signOut() }
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color(.systemBackground))
        .navigationTitle(AppRoute.account.placeholderTitle)
        .navigationBarTitleDisplayMode(.inline)
        .accessibilityIdentifier("route.placeholder.Account")
    }
}

struct CreateAccountShellView: View {
    var body: some View { RoutePlaceholderView(title: AppRoute.createAccount.placeholderTitle) }
}

struct PaywallShellView: View {
    var body: some View { RoutePlaceholderView(title: AppRoute.paywall.placeholderTitle) }
}

struct JoinMailingListShellView: View {
    var body: some View { RoutePlaceholderView(title: AppRoute.joinMailingList.placeholderTitle) }
}

struct HouseholdShellView: View {
    var body: some View { RoutePlaceholderView(title: AppRoute.household.placeholderTitle) }
}

struct TimersShellView: View {
    var body: some View { RoutePlaceholderView(title: AppRoute.timers.placeholderTitle) }
}

struct HowToAddRecipesShellView: View {
    var body: some View { RoutePlaceholderView(title: AppRoute.howToAddRecipes.placeholderTitle) }
}

struct WhatsNewShellView: View {
    var body: some View { RoutePlaceholderView(title: AppRoute.whatsNew.placeholderTitle) }
}

#if DEBUG
/// Phase 1 Auth/IAP diagnostics — Debug-only, not part of product IA.
struct FoundationDiagnosticsView: View {
    @Environment(AppDependencyContainer.self) private var dependencies
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            List {
                Section("Account") {
                    LabeledContent(
                        "User",
                        value: dependencies.authService.currentUser?.email
                            ?? dependencies.authService.currentUser?.id
                            ?? "—"
                    )
                    Button("Sign Out", role: .destructive) {
                        Task {
                            try? await dependencies.authService.signOut()
                            dismiss()
                        }
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
            .navigationTitle("Foundation Diagnostics")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Close") { dismiss() }
                }
            }
        }
    }
}
#endif
