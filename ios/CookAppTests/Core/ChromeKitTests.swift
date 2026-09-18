import Foundation
@testable import CookApp
import Testing

@Suite("Liquid Glass chrome kit D1–D3")
struct ChromeTokenTests {
    @Test func hitTargetsMeetHIG() {
        #expect(DesignTokens.Chrome.minimumHitTarget >= 44)
        #expect(DesignTokens.Chrome.tabBarHeight >= DesignTokens.Chrome.minimumHitTarget)
        #expect(DesignTokens.Chrome.searchCircleSize >= DesignTokens.Chrome.minimumHitTarget)
        #expect(DesignTokens.Chrome.headerButtonSize >= DesignTokens.Chrome.minimumHitTarget)
        #expect(DesignTokens.Chrome.menuItemHeight >= DesignTokens.Chrome.minimumHitTarget)
    }

    @Test func floatingBarSpacingDoesNotSqueezeSearch() {
        #expect(DesignTokens.Chrome.tabToSearchGap == 8)
        #expect(DesignTokens.Chrome.headerButtonGap == 8)
        #expect(DesignTokens.Chrome.barHorizontalInset >= 16)
        #expect(DesignTokens.Chrome.clusterBlendSpacing < DesignTokens.Chrome.tabToSearchGap)
        #expect(DesignTokens.Chrome.tabCapsuleWidth == 308)
        #expect(DesignTokens.Chrome.searchCircleSize == 60)
        #expect(
            DesignTokens.Chrome.tabCapsuleWidth
                + DesignTokens.Chrome.tabToSearchGap
                + DesignTokens.Chrome.searchCircleSize == 376
        )
        #expect(DesignTokens.Chrome.tabCapsuleMinWidth >= 4 * DesignTokens.Chrome.minimumHitTarget)
        #expect(DesignTokens.Chrome.tabIconSlotHeight == 22)
        #expect(DesignTokens.Chrome.tabIconLabelSpacing == 2)
        #expect(DesignTokens.Chrome.menuGlyphWidth == 20)
        #expect(DesignTokens.Chrome.pressedFillOpacity == 0.08)
        #expect(DesignTokens.Chrome.menuMaxHeight >= DesignTokens.Chrome.menuItemHeight * 8)
    }

    @Test func motionDurationsMatchFreeze() {
        #expect(DesignTokens.Motion.tabSelection == 0.25)
        #expect(DesignTokens.Motion.menu == 0.2)
        #expect(DesignTokens.Motion.press == 0.12)
    }
}

struct ChromeAccessibilityPolicyTests {
    @Test func reduceTransparencyUsesSolidFallback() {
        let snapshot = ChromeAccessibilitySnapshot(
            reduceTransparency: true,
            reduceMotion: false,
            increaseContrast: false
        )
        #expect(snapshot.usesSolidFallback)
        #expect(snapshot.usesStrongerBorder)
        #expect(
            CookGlassStyle.resolvedMaterial(variant: .regular, accessibility: snapshot) == .solid
        )
    }

    @Test func increaseContrastUsesSolidFallback() {
        let snapshot = ChromeAccessibilitySnapshot(
            reduceTransparency: false,
            reduceMotion: false,
            increaseContrast: true
        )
        #expect(snapshot.usesSolidFallback)
        #expect(snapshot.borderWidth == DesignTokens.Chrome.contrastBorderWidth)
    }

    @Test func reduceMotionDropsTabMorphAndMenuScale() {
        let snapshot = ChromeAccessibilitySnapshot(
            reduceTransparency: false,
            reduceMotion: true,
            increaseContrast: false
        )
        #expect(snapshot.tabSelectionAnimation == nil)
        #expect(!snapshot.menuUsesScale)
        #expect(GlassMenuTransition.scale(for: .opening, reduceMotion: true) == 1)
        #expect(snapshot.pressAnimation == nil)
    }

    @Test func loadingDoesNotSwapMaterial() {
        let snapshot = ChromeAccessibilitySnapshot(
            reduceTransparency: false,
            reduceMotion: false,
            increaseContrast: false
        )
        let idle = CookGlassStyle.resolvedMaterial(
            variant: .regular,
            accessibility: snapshot,
            isLoading: false
        )
        let loading = CookGlassStyle.resolvedMaterial(
            variant: .regular,
            accessibility: snapshot,
            isLoading: true
        )
        #expect(idle == loading)
        #expect(idle == .liquidRegular)
        #expect(
            CookGlassStyle.resolvedMaterial(
                variant: .clear,
                accessibility: snapshot,
                isLoading: true
            ) == .liquidClear
        )
    }
}

@MainActor
struct GlassMenuPresenterTests {
    @Test func hostStaysHighlightedWhileMenuVisible() {
        let presenter = GlassMenuPresenter()
        #expect(!presenter.highlightsHost)

        presenter.present()
        #expect(presenter.phase == .opening)
        #expect(presenter.highlightsHost)

        presenter.markOpen()
        #expect(presenter.phase == .open)
        #expect(presenter.highlightsHost)

        presenter.dismiss()
        #expect(presenter.phase == .closing)
        #expect(presenter.highlightsHost)

        presenter.markClosed()
        #expect(presenter.phase == .closed)
        #expect(!presenter.highlightsHost)
    }

    @Test func reduceMotionMenuScaleIsIdentity() {
        #expect(GlassMenuTransition.scale(for: .closed, reduceMotion: false) == DesignTokens.Chrome.menuScale)
        #expect(GlassMenuTransition.scale(for: .open, reduceMotion: false) == 1)
        for phase in GlassMenuPhase.allCases {
            #expect(GlassMenuTransition.scale(for: phase, reduceMotion: true) == 1)
        }
    }

    @Test func menuPanelHugsRowStackUntilCap() {
        let twoRows = [
            GlassMenuItem(id: "a", title: "A"),
            GlassMenuItem(id: "b", title: "B"),
        ]
        #expect(GlassMenuLayout.panelHeight(for: twoRows) == DesignTokens.Chrome.menuItemHeight * 2 + DesignTokens.Spacing.xs * 2)
        #expect(!GlassMenuLayout.needsScroll(for: twoRows))

        let eightPlusSeparator = (1...8).map { GlassMenuItem(id: "\($0)", title: "Item \($0)") }
            + [.separator(id: "s")]
        #expect(GlassMenuLayout.panelHeight(for: eightPlusSeparator) == GlassMenuLayout.idealHeight(for: eightPlusSeparator))
        #expect(!GlassMenuLayout.needsScroll(for: eightPlusSeparator))

        let many = (1...12).map { GlassMenuItem(id: "\($0)", title: "Item \($0)") }
        #expect(GlassMenuLayout.needsScroll(for: many))
        #expect(GlassMenuLayout.panelHeight(for: many) == DesignTokens.Chrome.menuMaxHeight)
    }
}

@MainActor
struct SearchChromeNavigationTests {
    @Test func openSearchUsesCookbookSearchWithoutStacking() {
        let state = AppNavigationState()
        state.push(.recipeDetail, on: .cookbook)
        state.selectedTab = .groceries

        state.openSearch()

        #expect(state.selectedTab == .cookbook)
        #expect(state.pathCount(for: .cookbook) == 1)

        state.openSearch()
        #expect(state.pathCount(for: .cookbook) == 1)
    }
}

struct ChromeVariantTests {
    @Test func regularAndClearAreTheOnlyGlassVariants() {
        #expect(CookGlassVariant.allCases == [.regular, .clear])
    }
}
