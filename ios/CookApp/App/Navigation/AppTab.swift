import Foundation

/// Root tabs after sign-in (Phase 1.5 navigation skeleton).
enum AppTab: String, CaseIterable, Identifiable, Hashable, Sendable {
    case cookbook
    case groceries
    case mealPlan
    case settings

    var id: String { rawValue }

    var title: String {
        switch self {
        case .cookbook: "Cookbook"
        case .groceries: "Groceries"
        case .mealPlan: "Meal Plan"
        case .settings: "Settings"
        }
    }

    /// SF Symbol used only for native `TabView` labels (not product chrome).
    var systemImage: String {
        switch self {
        case .cookbook: "book.closed"
        case .groceries: "cart"
        case .mealPlan: "calendar"
        case .settings: "gearshape"
        }
    }
}
