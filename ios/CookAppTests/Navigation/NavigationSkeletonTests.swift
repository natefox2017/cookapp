import Foundation
@testable import CookApp
import Testing

@Suite("Phase 1.5 navigation catalog")
struct NavigationCatalogTests {
    @Test func fourRootTabsMatchSpec() {
        #expect(AppTab.allCases.map(\.title) == [
            "Cookbook",
            "Groceries",
            "Meal Plan",
            "Settings",
        ])
    }

    @Test func pushRouteCountsMatchSpec() {
        #expect(AppRoute.cookbookPushRoutes.count == 10)
        #expect(AppRoute.groceriesPushRoutes.count == 2)
        #expect(AppRoute.mealPlanPushRoutes.isEmpty)
        #expect(AppRoute.settingsPushRoutes.count == 12)
        #expect(AppRoute.allCases.count == 24)
    }

    @Test func sheetCountsMatchSpec() {
        #expect(AppSheet.cookbookSheets.count == 5)
        #expect(AppSheet.groceriesSheets.count == 1)
        #expect(AppSheet.mealPlanSheets.count == 2)
        #expect(AppSheet.allCases.count == 8)
    }

    @Test func searchIsSingleDeduplicatedRoute() {
        let searchCases = AppRoute.allCases.filter {
            $0.placeholderTitle.localizedCaseInsensitiveContains("search")
        }
        #expect(searchCases == [.search])
    }

    @Test func groceriesHasSingleListScreenRoute() {
        // Empty / list (24/25) share Groceries tab root — not duplicate push routes.
        let groceryListish = AppRoute.allCases.filter {
            $0.placeholderTitle == "Groceries" || $0 == .chooseList || $0 == .newItem
        }
        #expect(groceryListish == [.chooseList, .newItem])
    }

    @Test func mealPlanHasNoDuplicatePushScreens() {
        #expect(AppRoute.mealPlanPushRoutes.isEmpty)
        #expect(AppSheet.mealPlanSheets == [.addToMealPlan, .addSectionMenu])
    }

    @Test func cookbookHasNoDuplicateHomeRoute() {
        // Pages 01/20 share Cookbook tab root — no second Cookbook push route.
        #expect(!AppRoute.allCases.contains { $0.placeholderTitle == "Cookbook" })
    }

    @Test func forbiddenPagesAreNotModeled() {
        let routeTitles = Set(AppRoute.allCases.map(\.placeholderTitle))
        let sheetTitles = Set(AppSheet.allCases.map(\.placeholderTitle))
        let allTitles = routeTitles.union(sheetTitles).union(Set(AppTab.allCases.map(\.title)))

        let forbidden = [
            "Share Sheet",
            "ShareSheet",
            "Page 23",
            "Page 37",
            "Page 46",
            "Page 47",
            "Page 48",
            "Pro Upsell",
        ]
        for name in forbidden {
            #expect(!allTitles.contains(name))
        }

        let rawValues = Set(AppRoute.allCases.map(\.rawValue)).union(AppSheet.allCases.map(\.rawValue))
        for banned in ["shareSheet", "page23", "page37", "page46", "page47", "page48", "proUpsell"] {
            #expect(!rawValues.contains(banned))
        }
    }

    @Test func everyRouteHasNonEmptyPlaceholderTitle() {
        for route in AppRoute.allCases {
            #expect(!route.placeholderTitle.isEmpty)
        }
        for sheet in AppSheet.allCases {
            #expect(!sheet.placeholderTitle.isEmpty)
        }
    }

    @Test func placeholderTitlesAreUniqueAcrossPushAndSheets() {
        let titles = AppRoute.allCases.map(\.placeholderTitle) + AppSheet.allCases.map(\.placeholderTitle)
        #expect(Set(titles).count == titles.count)
    }
}

@Suite("AppNavigationState")
@MainActor
struct AppNavigationStateTests {
    @Test func pushAndPopUpdatePathCount() {
        let state = AppNavigationState()
        #expect(state.pathCount(for: .cookbook) == 0)

        state.push(.recipeDetail, on: .cookbook)
        state.push(.cookingSteps, on: .cookbook)
        #expect(state.pathCount(for: .cookbook) == 2)

        state.pop(on: .cookbook)
        #expect(state.pathCount(for: .cookbook) == 1)

        state.popToRoot(on: .cookbook)
        #expect(state.pathCount(for: .cookbook) == 0)
    }

    @Test func tabsPreserveIndependentNavigationPaths() {
        let state = AppNavigationState()
        state.push(.recipeDetail, on: .cookbook)
        state.push(.search, on: .cookbook)
        state.push(.chooseList, on: .groceries)
        state.push(.account, on: .settings)

        state.selectedTab = .mealPlan
        #expect(state.pathCount(for: .cookbook) == 2)
        #expect(state.pathCount(for: .groceries) == 1)
        #expect(state.pathCount(for: .mealPlan) == 0)
        #expect(state.pathCount(for: .settings) == 1)

        state.popToRoot(on: .groceries)
        #expect(state.pathCount(for: .cookbook) == 2)
        #expect(state.pathCount(for: .groceries) == 0)
        #expect(state.pathCount(for: .settings) == 1)
    }

    @Test func sheetPresentAndDismiss() {
        let state = AppNavigationState()
        #expect(state.presentedSheet == nil)

        state.present(.recipeMenu)
        #expect(state.presentedSheet == .recipeMenu)

        state.dismissSheet()
        #expect(state.presentedSheet == nil)
    }

    @Test func pushDefaultsToSelectedTab() {
        let state = AppNavigationState()
        state.selectedTab = .settings
        state.push(.paywall)
        #expect(state.pathCount(for: .settings) == 1)
        #expect(state.pathCount(for: .cookbook) == 0)
    }

    @Test func popOnEmptyPathIsNoOp() {
        let state = AppNavigationState()
        state.pop(on: .cookbook)
        #expect(state.pathCount(for: .cookbook) == 0)
    }
}
