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
        static let tabSelection: CGFloat = 14
    }

    enum Typography {
        static let pageTitle = Font.largeTitle.weight(.bold)
        static let sectionTitle = Font.title2.weight(.semibold)
        static let body = Font.body
        static let meta = Font.subheadline
        static let caption = Font.caption
        static let tabLabel = Font.caption2.weight(.medium)
        static let tabIcon = Font.body.weight(.semibold)
        static let chromeButton = Font.callout.weight(.semibold)
        static let menuItem = Font.body
    }

    /// Shared navigation/control chrome metrics (D1–D3). Content screens must not fork these.
    enum Chrome {
        static let minimumHitTarget: CGFloat = 44
        static let tabBarHeight: CGFloat = 62
        static let searchCircleSize: CGFloat = 60
        static let tabToSearchGap: CGFloat = 8
        static let barHorizontalInset: CGFloat = 16
        static let barTopPadding: CGFloat = 8
        static let barBottomPadding: CGFloat = 8
        static let tabSlotSpacing: CGFloat = 0
        static let tabCapsuleWidth: CGFloat = 308
        static let tabCapsuleMinWidth: CGFloat = 192
        static let tabCapsuleHorizontalPadding: CGFloat = 8
        static let tabCapsuleVerticalPadding: CGFloat = 6
        static let tabIconLabelSpacing: CGFloat = 2
        static let tabIconSlotHeight: CGFloat = 22
        static let headerButtonSize: CGFloat = 44
        static let headerButtonGap: CGFloat = 8
        static let headerIconToLabelGap: CGFloat = 6
        static let menuAnchorGap: CGFloat = 8
        static let menuMinWidth: CGFloat = 220
        static let menuItemHeight: CGFloat = 44
        static let menuHorizontalPadding: CGFloat = 16
        static let menuGlyphWidth: CGFloat = 20
        static let menuMaxHeight: CGFloat = 280
        static let menuDismissExtent: CGFloat = 2000
        static var overlayClearance: CGFloat {
            tabBarHeight + barTopPadding + barBottomPadding
        }
        /// Keep sibling glasses from morphing into one blob at the 8pt gap.
        static let clusterBlendSpacing: CGFloat = 2
        static let hairlineWidth: CGFloat = 1
        static let contrastBorderWidth: CGFloat = 1.5
        static let hairlineOpacity: Double = 0.10
        static let contrastBorderOpacity: Double = 0.36
        static let mediaScrimOpacity: Double = 0.28
        static let disabledOpacity: Double = 0.45
        static let hoverLiftOpacity: Double = 0.06
        static let pressedFillOpacity: Double = 0.08
        static let menuScale: CGFloat = 0.94
    }

    enum Motion {
        static let tabSelection: TimeInterval = 0.25
        static let menu: TimeInterval = 0.2
        static let press: TimeInterval = 0.12
        static let pressScale: CGFloat = 0.97
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
    /// Solid chrome fallback for Reduce Transparency / Increase Contrast (White-first, semantic).
    static let cookChromeSolid = Color(.tertiarySystemBackground)
    /// Selected tab slot fill — light grey, not a brand-green slab.
    static let cookTabSelectionFill = Color(.tertiarySystemFill)
    static let cookMediaScrim = Color.black
}
