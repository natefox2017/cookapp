import SwiftUI

/// Signed-in root: four tabs, each with an independent `NavigationStack`,
/// plus shared Liquid Glass floating tab chrome (D1) and search circle (D2).
struct AppShellView: View {
    @State private var navigation = AppNavigationState()

    var body: some View {
        @Bindable var navigation = navigation
        TabView(selection: $navigation.selectedTab) {
            tabStack(for: .cookbook) {
                CookbookHomeView(navigation: navigation)
            }

            tabStack(for: .groceries) {
                GroceriesHomeView(navigation: navigation)
            }

            tabStack(for: .mealPlan) {
                MealPlanHomeView(navigation: navigation)
            }

            tabStack(for: .settings) {
                SettingsHomeView(navigation: navigation)
            }
        }
        .toolbar(.hidden, for: .tabBar)
        .safeAreaInset(edge: .bottom, spacing: 0) {
            FloatingTabChrome(
                selectedTab: $navigation.selectedTab,
                onSearch: { navigation.openSearch() }
            )
        }
        .sheet(item: $navigation.presentedSheet) { sheet in
            NavigationStack {
                NavigationDestinationBuilder.view(for: sheet)
                    .toolbar {
                        ToolbarItem(placement: .cancellationAction) {
                            Button("Close") {
                                navigation.dismissSheet()
                            }
                        }
                    }
            }
        }
    }

    @ViewBuilder
    private func tabStack<Content: View>(
        for tab: AppTab,
        @ViewBuilder root: () -> Content
    ) -> some View {
        NavigationStack(path: pathBinding(for: tab)) {
            root()
                .navigationDestination(for: AppRoute.self) { route in
                    NavigationDestinationBuilder.view(for: route)
                }
                .toolbar(.hidden, for: .tabBar)
        }
        .tabItem {
            Label(tab.title, systemImage: tab.systemImage)
        }
        .tag(tab)
        .toolbar(.hidden, for: .tabBar)
    }

    private func pathBinding(for tab: AppTab) -> Binding<NavigationPath> {
        switch tab {
        case .cookbook:
            Binding(
                get: { navigation.cookbookPath },
                set: { navigation.cookbookPath = $0 }
            )
        case .groceries:
            Binding(
                get: { navigation.groceriesPath },
                set: { navigation.groceriesPath = $0 }
            )
        case .mealPlan:
            Binding(
                get: { navigation.mealPlanPath },
                set: { navigation.mealPlanPath = $0 }
            )
        case .settings:
            Binding(
                get: { navigation.settingsPath },
                set: { navigation.settingsPath = $0 }
            )
        }
    }
}

#Preview {
    AppShellView()
        .environment(AppDependencyContainer.bootstrap())
}
