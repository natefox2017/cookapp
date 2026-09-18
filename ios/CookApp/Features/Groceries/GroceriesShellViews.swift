import SwiftUI

// MARK: - Tab root

struct GroceriesHomeView: View {
    @Bindable var navigation: AppNavigationState

    var body: some View {
        RoutePlaceholderView(title: AppTab.groceries.title)
            .toolbar {
#if DEBUG
                ToolbarItem(placement: .topBarTrailing) {
                    Menu("Routes") {
                        ForEach(AppRoute.groceriesPushRoutes, id: \.self) { route in
                            Button(route.placeholderTitle) {
                                navigation.push(route, on: .groceries)
                            }
                        }
                        Divider()
                        ForEach(AppSheet.groceriesSheets, id: \.self) { sheet in
                            Button(sheet.placeholderTitle) {
                                navigation.present(sheet)
                            }
                        }
                    }
                    .accessibilityIdentifier("debug.routes.groceries")
                }
#endif
            }
    }
}

// MARK: - Push shells

struct ChooseListShellView: View {
    var body: some View { RoutePlaceholderView(title: AppRoute.chooseList.placeholderTitle) }
}

struct NewItemShellView: View {
    var body: some View { RoutePlaceholderView(title: AppRoute.newItem.placeholderTitle) }
}

// MARK: - Presentation shells

struct GroceryListMenuShellView: View {
    var body: some View { RoutePlaceholderView(title: AppSheet.groceryListMenu.placeholderTitle) }
}
