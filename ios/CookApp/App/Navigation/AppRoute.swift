import Foundation

/// Push destinations for `NavigationStack` (Phase 1.5).
///
/// Tab roots are not routes. Deduplicated business screens share one case
/// (Search 16/17/18, Groceries 24/25, Meal Plan 03/29/30, Cookbook 01/20).
/// Forbidden / undefined pages (23, 37, 46, 47, 48) are intentionally absent.
enum AppRoute: String, CaseIterable, Hashable, Sendable {
    // MARK: Cookbook
    case recipeDetail
    case cookingSteps
    case timerForm
    case folders
    case recipeList
    case smartFolder
    case discover
    case recipeEditor
    case search
    case newRecipe

    // MARK: Groceries
    case chooseList
    case newItem

    // MARK: Settings
    case general
    case appIcon
    case markdown
    case experiments
    case account
    case createAccount
    case paywall
    case joinMailingList
    case household
    case timers
    case howToAddRecipes
    case whatsNew

    /// Developer-facing title used by the temporary placeholder.
    var placeholderTitle: String {
        switch self {
        case .recipeDetail: "Recipe Detail"
        case .cookingSteps: "Cooking Steps"
        case .timerForm: "Timer Form"
        case .folders: "Folders"
        case .recipeList: "Recipe List"
        case .smartFolder: "Smart Folder"
        case .discover: "Discover"
        case .recipeEditor: "Recipe Editor"
        case .search: "Search"
        case .newRecipe: "New Recipe"
        case .chooseList: "Choose List"
        case .newItem: "New Item"
        case .general: "General"
        case .appIcon: "App Icon"
        case .markdown: "Markdown"
        case .experiments: "Experiments"
        case .account: "Account"
        case .createAccount: "Create Account"
        case .paywall: "Paywall"
        case .joinMailingList: "Join Mailing List"
        case .household: "Household"
        case .timers: "Timers"
        case .howToAddRecipes: "How To Add Recipes"
        case .whatsNew: "What's New"
        }
    }

    var owningTab: AppTab {
        switch self {
        case .recipeDetail, .cookingSteps, .timerForm, .folders, .recipeList,
             .smartFolder, .discover, .recipeEditor, .search, .newRecipe:
            .cookbook
        case .chooseList, .newItem:
            .groceries
        case .general, .appIcon, .markdown, .experiments, .account, .createAccount,
             .paywall, .joinMailingList, .household, .timers, .howToAddRecipes, .whatsNew:
            .settings
        }
    }
}

extension AppRoute {
    static var cookbookPushRoutes: [AppRoute] {
        allCases.filter { $0.owningTab == .cookbook }
    }

    static var groceriesPushRoutes: [AppRoute] {
        allCases.filter { $0.owningTab == .groceries }
    }

    static var settingsPushRoutes: [AppRoute] {
        allCases.filter { $0.owningTab == .settings }
    }

    /// Meal Plan has no push routes in Phase 1.5 (root + presentations only).
    static var mealPlanPushRoutes: [AppRoute] {
        allCases.filter { $0.owningTab == .mealPlan }
    }
}
