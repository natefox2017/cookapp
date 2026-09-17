import SwiftUI

enum DesignTokens {
    enum Spacing {
        static let xs: CGFloat = 4
        static let sm: CGFloat = 8
        static let md: CGFloat = 16
        static let lg: CGFloat = 24
        static let xl: CGFloat = 32
    }

    enum Radius {
        static let control: CGFloat = 12
        static let card: CGFloat = 16
        static let sheet: CGFloat = 28
        static let pill: CGFloat = 999
    }

    enum Typography {
        static let pageTitle = Font.largeTitle.weight(.bold)
        static let sectionTitle = Font.title2.weight(.semibold)
        static let body = Font.body
        static let meta = Font.subheadline
        static let caption = Font.caption
    }
}

extension Color {
    /// Brand green — Liquid Glass chrome may tint labels/active states with this.
    static let cookBrand = Color("AccentColor")

    static let cookBackground = Color(.systemGroupedBackground)
    static let cookSurface = Color(.secondarySystemGroupedBackground)
    static let cookPrimaryText = Color(.label)
    static let cookSecondaryText = Color(.secondaryLabel)
    static let cookTertiaryText = Color(.tertiaryLabel)
    static let cookDestructive = Color(.systemRed)
    static let cookSeparator = Color(.separator)
}
