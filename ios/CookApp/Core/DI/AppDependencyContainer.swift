import Observation
import SwiftUI

@Observable
@MainActor
final class AppDependencyContainer {
    let config: AppConfiguration
    let themeController: ThemeController
    let networkClient: any NetworkClient
    let authService: SupabaseAuthService
    let subscriptionService: any SubscriptionService
    let monitoring: any MonitoringService

    init(
        config: AppConfiguration,
        themeController: ThemeController,
        networkClient: any NetworkClient,
        authService: SupabaseAuthService,
        subscriptionService: any SubscriptionService,
        monitoring: any MonitoringService
    ) {
        self.config = config
        self.themeController = themeController
        self.networkClient = networkClient
        self.authService = authService
        self.subscriptionService = subscriptionService
        self.monitoring = monitoring
    }

    static func bootstrap() -> AppDependencyContainer {
        let config = AppConfiguration.fromBundle()
        let monitoring = ConsoleMonitoringService()
        let network = URLSessionNetworkClient(baseURL: config.supabaseURL)
        let auth = SupabaseAuthService(config: config, monitoring: monitoring)
        let subscription = RevenueCatSubscriptionService(
            config: config,
            monitoring: monitoring,
            supabase: auth.supabaseClient
        )

        return AppDependencyContainer(
            config: config,
            themeController: ThemeController(),
            networkClient: network,
            authService: auth,
            subscriptionService: subscription,
            monitoring: monitoring
        )
    }

    func start() async {
        monitoring.configure(environment: config.environment)
        await authService.restoreSession()
        await subscriptionService.configure(userID: authService.currentUser?.id)
    }

    /// Call after successful login so RevenueCat `app_user_id` == Supabase user id.
    func linkPurchasesToCurrentUser() async {
        await subscriptionService.configure(userID: authService.currentUser?.id)
    }
}
