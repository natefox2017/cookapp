import SwiftUI
import UIKit

enum CookGlassVariant: String, Equatable, Sendable, CaseIterable {
    /// Tab bar, menus, text-heavy chrome.
    case regular
    /// Small controls over rich media only.
    case clear
}

/// Snapshot of accessibility flags that change chrome material / motion.
struct ChromeAccessibilitySnapshot: Equatable, Sendable {
    var reduceTransparency: Bool
    var reduceMotion: Bool
    var increaseContrast: Bool

    var usesSolidFallback: Bool {
        reduceTransparency || increaseContrast
    }

    var usesStrongerBorder: Bool {
        usesSolidFallback
    }

    var tabSelectionAnimation: Animation? {
        reduceMotion ? nil : .easeInOut(duration: DesignTokens.Motion.tabSelection)
    }

    var pressAnimation: Animation? {
        reduceMotion ? nil : .easeInOut(duration: DesignTokens.Motion.press)
    }

    var menuAnimation: Animation {
        .easeInOut(duration: DesignTokens.Motion.menu)
    }

    var menuUsesScale: Bool {
        !reduceMotion
    }

    var borderWidth: CGFloat {
        usesStrongerBorder ? DesignTokens.Chrome.contrastBorderWidth : DesignTokens.Chrome.hairlineWidth
    }

    var borderOpacity: Double {
        usesStrongerBorder ? DesignTokens.Chrome.contrastBorderOpacity : DesignTokens.Chrome.hairlineOpacity
    }
}

enum CookGlassMaterial: Equatable, Sendable {
    case liquidRegular
    case liquidClear
    case ultraThinMaterial
    case solid
}

enum CookGlassStyle {
    /// Loading must not swap the material — `isLoading` is accepted and ignored.
    static func resolvedMaterial(
        variant: CookGlassVariant,
        accessibility: ChromeAccessibilitySnapshot,
        isLoading: Bool = false,
        prefersSystemLiquidGlass: Bool = true
    ) -> CookGlassMaterial {
        _ = isLoading
        if accessibility.usesSolidFallback {
            return .solid
        }
        if prefersSystemLiquidGlass {
            switch variant {
            case .regular: return .liquidRegular
            case .clear: return .liquidClear
            }
        }
        return .ultraThinMaterial
    }
}

struct CookGlassModifier<S: Shape>: ViewModifier {
    var variant: CookGlassVariant
    var shape: S
    var interactive: Bool
    var isLoading: Bool

    @Environment(\.accessibilityReduceTransparency) private var reduceTransparency
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    private var accessibility: ChromeAccessibilitySnapshot {
        ChromeAccessibilitySnapshot(
            reduceTransparency: reduceTransparency,
            reduceMotion: reduceMotion,
            increaseContrast: UIAccessibility.isDarkerSystemColorsEnabled
        )
    }

    func body(content: Content) -> some View {
        let snapshot = accessibility
        let material = CookGlassStyle.resolvedMaterial(
            variant: variant,
            accessibility: snapshot,
            isLoading: isLoading,
            prefersSystemLiquidGlass: true
        )
        applied(material, to: content, snapshot: snapshot)
    }

    @ViewBuilder
    private func applied(_ material: CookGlassMaterial, to content: Content, snapshot: ChromeAccessibilitySnapshot) -> some View {
        let bordered = content.overlay {
            shape.stroke(
                Color.cookSeparator.opacity(snapshot.borderOpacity),
                lineWidth: snapshot.borderWidth
            )
        }

        switch material {
        case .solid:
            bordered.background {
                shape.fill(Color.cookChromeSolid)
            }
        case .ultraThinMaterial:
            bordered.background {
                shape.fill(.ultraThinMaterial)
            }
        case .liquidRegular, .liquidClear:
            if #available(iOS 26.0, *) {
                bordered.glassEffect(liquidGlass, in: shape)
            } else {
                bordered.background {
                    shape.fill(.ultraThinMaterial)
                }
            }
        }
    }

    @available(iOS 26.0, *)
    private var liquidGlass: Glass {
        let base: Glass = variant == .clear ? .clear : .regular
        return interactive ? base.interactive() : base
    }
}

extension View {
    /// Shared Liquid Glass chrome. Never use on lists, grids, or page backgrounds.
    func cookGlass<S: Shape>(
        _ variant: CookGlassVariant = .regular,
        in shape: S,
        interactive: Bool = true,
        isLoading: Bool = false
    ) -> some View {
        modifier(
            CookGlassModifier(
                variant: variant,
                shape: shape,
                interactive: interactive,
                isLoading: isLoading
            )
        )
    }

    /// Group sibling chrome so glasses can share a container without nesting.
    @ViewBuilder
    func cookGlassCluster(spacing: CGFloat = DesignTokens.Chrome.clusterBlendSpacing) -> some View {
        if #available(iOS 26.0, *) {
            GlassEffectContainer(spacing: spacing) { self }
        } else {
            self
        }
    }
}

struct ChromePressButtonStyle: ButtonStyle {
    var isEnabled: Bool
    var reduceMotion: Bool

    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .background {
                if configuration.isPressed && isEnabled {
                    Color.primary.opacity(DesignTokens.Chrome.pressedFillOpacity)
                }
            }
            .scaleEffect(
                configuration.isPressed && isEnabled
                    ? DesignTokens.Motion.pressScale
                    : 1
            )
            .animation(
                reduceMotion ? nil : .easeInOut(duration: DesignTokens.Motion.press),
                value: configuration.isPressed
            )
    }
}
