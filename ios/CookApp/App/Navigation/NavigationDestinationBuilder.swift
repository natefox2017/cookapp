import SwiftUI

/// Maps `AppRoute` / `AppSheet` to temporary screen shells.
enum NavigationDestinationBuilder {
    @ViewBuilder
    static func view(for route: AppRoute) -> some View {
        switch route {
        case .recipeDetail: RecipeDetailShellView()
        case .cookingSteps: CookingStepsShellView()
        case .timerForm: TimerFormShellView()
        case .folders: FoldersShellView()
        case .recipeList: RecipeListShellView()
        case .smartFolder: SmartFolderShellView()
        case .discover: DiscoverShellView()
        case .recipeEditor: RecipeEditorShellView()
        case .search: SearchShellView()
        case .newRecipe: NewRecipeShellView()
        case .chooseList: ChooseListShellView()
        case .newItem: NewItemShellView()
        case .general: GeneralShellView()
        case .appIcon: AppIconShellView()
        case .markdown: MarkdownShellView()
        case .experiments: ExperimentsShellView()
        case .account: AccountShellView()
        case .createAccount: CreateAccountShellView()
        case .paywall: PaywallShellView()
        case .joinMailingList: JoinMailingListShellView()
        case .household: HouseholdShellView()
        case .timers: TimersShellView()
        case .howToAddRecipes: HowToAddRecipesShellView()
        case .whatsNew: WhatsNewShellView()
        }
    }

    @ViewBuilder
    static func view(for sheet: AppSheet) -> some View {
        switch sheet {
        case .recipeMenu: RecipeMenuShellView()
        case .categorySelector: CategorySelectorShellView()
        case .cuisineSelector: CuisineSelectorShellView()
        case .scopeFilter: ScopeFilterShellView()
        case .addRecipeMenu: AddRecipeMenuShellView()
        case .groceryListMenu: GroceryListMenuShellView()
        case .addToMealPlan: AddToMealPlanShellView()
        case .addSectionMenu: AddSectionMenuShellView()
        }
    }
}
