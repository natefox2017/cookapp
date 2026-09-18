import SwiftUI

// MARK: - Tab root

/// Empty / with-recipe / pages 03 & 29–30 share this single business screen.
struct MealPlanHomeView: View {
    @Bindable var navigation: AppNavigationState

    var body: some View {
        RoutePlaceholderView(title: AppTab.mealPlan.title)
            .toolbar {
#if DEBUG
                ToolbarItem(placement: .topBarTrailing) {
                    DebugRouteChromeMenu(tab: .mealPlan, navigation: navigation)
                }
#endif
            }
    }
}

// MARK: - Presentation shells

struct AddToMealPlanShellView: View {
    var body: some View { RoutePlaceholderView(title: AppSheet.addToMealPlan.placeholderTitle) }
}

struct AddSectionMenuShellView: View {
    var body: some View { RoutePlaceholderView(title: AppSheet.addSectionMenu.placeholderTitle) }
}
