import SwiftUI

@main
struct CookAppApp: App {
    @State private var dependencies = AppDependencyContainer.bootstrap()

    var body: some Scene {
        WindowGroup {
            RootView()
                .environment(dependencies)
                .preferredColorScheme(dependencies.themeController.preferredColorScheme)
        }
    }
}
