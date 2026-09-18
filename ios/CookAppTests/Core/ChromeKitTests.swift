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
