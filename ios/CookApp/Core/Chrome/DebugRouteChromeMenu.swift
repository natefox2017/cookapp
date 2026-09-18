import SwiftUI

#if DEBUG
/// Developer-only route jumper using D2/D3 chrome. Not product IA.
struct DebugRouteChromeMenu: View {
    let tab: AppTab
    @Bindable var navigation: AppNavigationState
    var extraItems: [GlassMenuItem] = []
    var onExtra: ((GlassMenuItem) -> Void)?

    var body: some View {
        GlassMenuButton(
            systemImage: "list.bullet",
            accessibilityLabel: "Debug routes",
            items: items,
            onSelect: select
        )
        .accessibilityIdentifier("debug.routes.\(tab.rawValue)")
    }

    private var items: [GlassMenuItem] {
        var result: [GlassMenuItem] = AppRoute.pushRoutes(for: tab).map { route in
            GlassMenuItem(id: "route.\(route.rawValue)", title: route.placeholderTitle)
        }
        let sheets = AppSheet.sheets(for: tab)
        if !result.isEmpty, !sheets.isEmpty {
            result.append(.separator(id: "sep.sheets"))
        }
        result.append(contentsOf: sheets.map { sheet in
            GlassMenuItem(id: "sheet.\(sheet.rawValue)", title: sheet.placeholderTitle)
        })
        if !extraItems.isEmpty {
            if !result.isEmpty {
                result.append(.separator(id: "sep.extra"))
            }
            result.append(contentsOf: extraItems)
        }
        return result
    }

    private func select(_ item: GlassMenuItem) {
        if item.id.hasPrefix("route.") {
            let raw = String(item.id.dropFirst("route.".count))
            if let route = AppRoute(rawValue: raw) {
                navigation.push(route, on: tab)
            }
            return
        }
        if item.id.hasPrefix("sheet.") {
            let raw = String(item.id.dropFirst("sheet.".count))
            if let sheet = AppSheet(rawValue: raw) {
                navigation.present(sheet)
            }
            return
        }
        onExtra?(item)
    }
}
#endif
