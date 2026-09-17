import SwiftUI

/// Phase 1 root shell — no business flows.
struct RootView: View {
    @Environment(AppDependencyContainer.self) private var dependencies

    var body: some View {
        NavigationStack {
            ContentUnavailableView(
                "CookApp",
                systemImage: "frying.pan",
                description: Text("Phase 1 foundation scaffold. Business features are intentionally out of scope.")
            )
            .navigationTitle("CookApp")
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
