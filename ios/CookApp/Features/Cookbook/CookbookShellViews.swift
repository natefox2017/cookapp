import SwiftUI

// MARK: - Tab root

struct CookbookHomeView: View {
    @Bindable var navigation: AppNavigationState

    var body: some View {
        RoutePlaceholderView(title: AppTab.cookbook.title)
            .toolbar {
#if DEBUG
                ToolbarItem(placement: .topBarTrailing) {
                    Menu("Routes") {
                        ForEach(AppRoute.cookbookPushRoutes, id: \.self) { route in
                            Button(route.placeholderTitle) {
                                navigation.push(route, on: .cookbook)
                            }
                        }
                        Divider()
                        ForEach(AppSheet.cookbookSheets, id: \.self) { sheet in
                            Button(sheet.placeholderTitle) {
                                navigation.present(sheet)
                            }
                        }
                    }
                    .accessibilityIdentifier("debug.routes.cookbook")
                }
#endif
            }
    }
}

// MARK: - Push shells

struct RecipeDetailShellView: View {
    var body: some View { RoutePlaceholderView(title: AppRoute.recipeDetail.placeholderTitle) }
}

struct CookingStepsShellView: View {
    var body: some View { RoutePlaceholderView(title: AppRoute.cookingSteps.placeholderTitle) }
}

struct TimerFormShellView: View {
    var body: some View { RoutePlaceholderView(title: AppRoute.timerForm.placeholderTitle) }
}

struct FoldersShellView: View {
    var body: some View { RoutePlaceholderView(title: AppRoute.folders.placeholderTitle) }
}

/// All Recipes / Recently Added share this route-level shell (states later).
struct RecipeListShellView: View {
    var body: some View { RoutePlaceholderView(title: AppRoute.recipeList.placeholderTitle) }
}

struct SmartFolderShellView: View {
    var body: some View { RoutePlaceholderView(title: AppRoute.smartFolder.placeholderTitle) }
}

struct DiscoverShellView: View {
    var body: some View { RoutePlaceholderView(title: AppRoute.discover.placeholderTitle) }
}

struct RecipeEditorShellView: View {
    var body: some View { RoutePlaceholderView(title: AppRoute.recipeEditor.placeholderTitle) }
}

/// Search enter / focused / results are one screen (pages 16/17/18).
struct SearchShellView: View {
    var body: some View { RoutePlaceholderView(title: AppRoute.search.placeholderTitle) }
}

struct NewRecipeShellView: View {
    var body: some View { RoutePlaceholderView(title: AppRoute.newRecipe.placeholderTitle) }
}

// MARK: - Presentation shells

struct RecipeMenuShellView: View {
    var body: some View { RoutePlaceholderView(title: AppSheet.recipeMenu.placeholderTitle) }
}

struct CategorySelectorShellView: View {
    var body: some View { RoutePlaceholderView(title: AppSheet.categorySelector.placeholderTitle) }
}

struct CuisineSelectorShellView: View {
    var body: some View { RoutePlaceholderView(title: AppSheet.cuisineSelector.placeholderTitle) }
}

struct ScopeFilterShellView: View {
    var body: some View { RoutePlaceholderView(title: AppSheet.scopeFilter.placeholderTitle) }
}

struct AddRecipeMenuShellView: View {
    var body: some View { RoutePlaceholderView(title: AppSheet.addRecipeMenu.placeholderTitle) }
}
