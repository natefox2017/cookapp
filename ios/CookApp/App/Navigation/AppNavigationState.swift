import Observation
import SwiftUI

/// Per-tab `NavigationPath` plus a single presented sheet.
@Observable
@MainActor
final class AppNavigationState {
    var selectedTab: AppTab = .cookbook
    var cookbookPath = NavigationPath()
    var groceriesPath = NavigationPath()
    var mealPlanPath = NavigationPath()
    var settingsPath = NavigationPath()
    var presentedSheet: AppSheet?

    func pathCount(for tab: AppTab) -> Int {
        switch tab {
        case .cookbook: cookbookPath.count
        case .groceries: groceriesPath.count
        case .mealPlan: mealPlanPath.count
        case .settings: settingsPath.count
        }
    }

    func push(_ route: AppRoute, on tab: AppTab? = nil) {
        let target = tab ?? selectedTab
        switch target {
        case .cookbook: cookbookPath.append(route)
        case .groceries: groceriesPath.append(route)
        case .mealPlan: mealPlanPath.append(route)
        case .settings: settingsPath.append(route)
        }
    }

    func pop(on tab: AppTab? = nil) {
        let target = tab ?? selectedTab
        switch target {
        case .cookbook:
            guard !cookbookPath.isEmpty else { return }
            cookbookPath.removeLast()
        case .groceries:
            guard !groceriesPath.isEmpty else { return }
            groceriesPath.removeLast()
        case .mealPlan:
            guard !mealPlanPath.isEmpty else { return }
            mealPlanPath.removeLast()
        case .settings:
            guard !settingsPath.isEmpty else { return }
            settingsPath.removeLast()
        }
    }

    func popToRoot(on tab: AppTab? = nil) {
        let target = tab ?? selectedTab
        switch target {
        case .cookbook: cookbookPath = NavigationPath()
        case .groceries: groceriesPath = NavigationPath()
        case .mealPlan: mealPlanPath = NavigationPath()
        case .settings: settingsPath = NavigationPath()
        }
    }

    func present(_ sheet: AppSheet) {
        presentedSheet = sheet
    }

    func dismissSheet() {
        presentedSheet = nil
    }
}
