import SwiftUI

/// Phase 1.5 root: Auth when signed out; AppShell when signed in.
struct RootView: View {
    @Environment(AppDependencyContainer.self) private var dependencies

    var body: some View {
        Group {
            if dependencies.authService.currentUser == nil {
                AuthFoundationView()
            } else {
                AppShellView()
            }
        }
        .tint(Color.cookBrand)
        .task {
            await dependencies.start()
        }
    }
}

#Preview {
    RootView()
        .environment(AppDependencyContainer.bootstrap())
}
