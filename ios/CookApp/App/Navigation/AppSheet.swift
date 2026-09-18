import Foundation

/// Sheet / modal presentations (Phase 1.5).
///
/// Page 46 (system Share Sheet) is not modeled. Pages 47/48 are excluded.
enum AppSheet: String, CaseIterable, Identifiable, Hashable, Sendable {
    // Cookbook
    case recipeMenu
    case categorySelector
    case cuisineSelector
    case scopeFilter
    case addRecipeMenu

    // Groceries
    case groceryListMenu

    // Meal Plan
    case addToMealPlan
    case addSectionMenu

    var id: String { rawValue }

    var placeholderTitle: String {
        switch self {
        case .recipeMenu: "Recipe Menu"
        case .categorySelector: "Category Selector"
        case .cuisineSelector: "Cuisine Selector"
        case .scopeFilter: "Scope Filter"
        case .addRecipeMenu: "Add Recipe Menu"
        case .groceryListMenu: "Grocery List Menu"
        case .addToMealPlan: "Add to Meal Plan"
        case .addSectionMenu: "Add Section Menu"
        }
    }

    var owningTab: AppTab {
        switch self {
        case .recipeMenu, .categorySelector, .cuisineSelector, .scopeFilter, .addRecipeMenu:
            .cookbook
        case .groceryListMenu:
            .groceries
        case .addToMealPlan, .addSectionMenu:
            .mealPlan
        }
    }
}

extension AppSheet {
    static var cookbookSheets: [AppSheet] {
        allCases.filter { $0.owningTab == .cookbook }
    }

    static var groceriesSheets: [AppSheet] {
        allCases.filter { $0.owningTab == .groceries }
    }

    static var mealPlanSheets: [AppSheet] {
        allCases.filter { $0.owningTab == .mealPlan }
    }

    static func sheets(for tab: AppTab) -> [AppSheet] {
        switch tab {
        case .cookbook: cookbookSheets
        case .groceries: groceriesSheets
        case .mealPlan: mealPlanSheets
        case .settings: []
        }
    }
}
