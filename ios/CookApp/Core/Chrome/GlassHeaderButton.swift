import SwiftUI

/// D2 — circular or pill header / control chrome.
struct GlassHeaderButton: View {
    enum ShapeKind: Equatable, Sendable {
        case circle
        case capsule
    }

    var systemImage: String?
    var title: String?
    var accessibilityLabel: String
    var shape: ShapeKind = .circle
    var size: CGFloat = DesignTokens.Chrome.headerButtonSize
    /// Over rich media: clear glass + scrim. Otherwise regular glass.
    var overMedia: Bool = false
    var isDisabled: Bool = false
    var isLoading: Bool = false
    /// Host stays highlighted while its menu is opening / open / closing.
    var isMenuHostHighlighted: Bool = false
    var action: () -> Void

    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var isHovering = false

    private var variant: CookGlassVariant { overMedia ? .clear : .regular }
    private var isEnabled: Bool { !isDisabled && !isLoading }

    var body: some View {
        Group {
            if shape == .circle {
                chromeButton.clipShape(Circle())
            } else {
                chromeButton.clipShape(Capsule())
            }
        }
        .disabled(!isEnabled)
        .accessibilityLabel(accessibilityLabel)
        .accessibilityAddTraits(isMenuHostHighlighted ? .isSelected : [])
        .onHover { hovering in
            isHovering = hovering && isEnabled
        }
    }

    private var chromeButton: some View {
        Button(action: action) {
            labeledChrome
        }
        .buttonStyle(ChromePressButtonStyle(isEnabled: isEnabled, reduceMotion: reduceMotion))
    }

    @ViewBuilder
    private var labeledChrome: some View {
        switch shape {
        case .circle:
            innerLabel
                .frame(width: size, height: size)
                .frame(minWidth: DesignTokens.Chrome.minimumHitTarget, minHeight: DesignTokens.Chrome.minimumHitTarget)
                .contentShape(Circle())
                .background { mediaScrim(Circle()) }
                .background { hoverFill(Circle()) }
                .cookGlass(variant, in: Circle(), interactive: isEnabled, isLoading: isLoading)
                .opacity(isDisabled ? DesignTokens.Chrome.disabledOpacity : 1)
        case .capsule:
            innerLabel
                .padding(.horizontal, DesignTokens.Spacing.md)
                .frame(minWidth: DesignTokens.Chrome.minimumHitTarget, minHeight: DesignTokens.Chrome.minimumHitTarget)
                .frame(height: size)
                .contentShape(Capsule())
                .background { mediaScrim(Capsule()) }
                .background { hoverFill(Capsule()) }
                .cookGlass(variant, in: Capsule(), interactive: isEnabled, isLoading: isLoading)
                .opacity(isDisabled ? DesignTokens.Chrome.disabledOpacity : 1)
        }
    }

    private var innerLabel: some View {
        ZStack {
            foreground
                .opacity(isLoading ? 0 : 1)
            if isLoading {
                ProgressView()
                    .controlSize(.small)
                    .tint(foregroundColor)
            }
        }
    }

    private var foreground: some View {
        HStack(alignment: .firstTextBaseline, spacing: DesignTokens.Chrome.headerIconToLabelGap) {
            if let systemImage {
                Image(systemName: systemImage)
                    .font(DesignTokens.Typography.chromeButton)
                    .symbolRenderingMode(.monochrome)
            }
            if let title {
                Text(title)
                    .font(DesignTokens.Typography.chromeButton)
                    .lineLimit(1)
            }
        }
        .foregroundStyle(foregroundColor)
    }

    private var foregroundColor: Color {
        isMenuHostHighlighted ? Color.cookBrand : Color.cookPrimaryText
    }

    @ViewBuilder
    private func mediaScrim<S: Shape>(_ shape: S) -> some View {
        if overMedia {
            shape.fill(Color.cookMediaScrim.opacity(DesignTokens.Chrome.mediaScrimOpacity))
        }
    }

    @ViewBuilder
    private func hoverFill<S: Shape>(_ shape: S) -> some View {
        if isHovering && isEnabled {
            shape.fill(Color.primary.opacity(DesignTokens.Chrome.hoverLiftOpacity))
        }
    }
}

/// Sibling header buttons — 8pt gap, no overlapping 44pt hit areas.
struct GlassHeaderButtonCluster<Content: View>: View {
    @ViewBuilder var content: () -> Content

    var body: some View {
        HStack(spacing: DesignTokens.Chrome.headerButtonGap) {
            content()
        }
        .cookGlassCluster()
    }
}
