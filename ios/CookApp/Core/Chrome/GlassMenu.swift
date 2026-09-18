import Observation
import SwiftUI

enum GlassMenuPhase: String, Equatable, Sendable, CaseIterable {
    case closed
    case opening
    case open
    case closing

    var isVisible: Bool { self != .closed }

    var highlightsHost: Bool { self != .closed }
}

struct GlassMenuItem: Identifiable, Equatable, Sendable {
    enum Role: Equatable, Sendable {
        case normal
        case destructive
        case separator
    }

    let id: String
    var title: String
    var systemImage: String?
    var role: Role = .normal
    var isDisabled: Bool = false

    static func separator(id: String) -> GlassMenuItem {
        GlassMenuItem(id: id, title: "", role: .separator, isDisabled: true)
    }
}

enum GlassMenuTransition {
    static var duration: TimeInterval { DesignTokens.Motion.menu }

    static func scale(for phase: GlassMenuPhase, reduceMotion: Bool) -> CGFloat {
        if reduceMotion { return 1 }
        switch phase {
        case .closed, .closing: return DesignTokens.Chrome.menuScale
        case .opening, .open: return 1
        }
    }
}

/// Testable presenter for D3 open / close phases.
@Observable
@MainActor
final class GlassMenuPresenter {
    private(set) var phase: GlassMenuPhase = .closed

    var highlightsHost: Bool { phase.highlightsHost }

    func setPhase(_ phase: GlassMenuPhase) {
        self.phase = phase
    }

    func present() {
        guard phase == .closed || phase == .closing else { return }
        phase = .opening
    }

    func markOpen() {
        guard phase == .opening else { return }
        phase = .open
    }

    func dismiss() {
        guard phase == .opening || phase == .open else { return }
        phase = .closing
    }

    func markClosed() {
        guard phase == .closing else { return }
        phase = .closed
    }

    func toggle() {
        if phase.isVisible {
            dismiss()
        } else {
            present()
        }
    }
}

/// D3 — single frosted menu layer anchored to a host button. Items are not glass.
struct GlassMenuButton: View {
    var systemImage: String
    var accessibilityLabel: String
    var items: [GlassMenuItem]
    var onSelect: (GlassMenuItem) -> Void

    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var presenter = GlassMenuPresenter()
    @State private var pressedItemID: String?

    var body: some View {
        GlassHeaderButton(
            systemImage: systemImage,
            accessibilityLabel: accessibilityLabel,
            isMenuHostHighlighted: presenter.highlightsHost,
            action: toggle
        )
        .overlay(alignment: .topTrailing) {
            if presenter.phase.isVisible {
                ZStack(alignment: .topTrailing) {
                    Color.clear
                        .frame(width: 800, height: 1200)
                        .contentShape(Rectangle())
                        .onTapGesture { dismiss() }

                    panel
                        .offset(y: DesignTokens.Chrome.headerButtonSize + DesignTokens.Chrome.menuAnchorGap)
                }
                .allowsHitTesting(true)
            }
        }
        .zIndex(presenter.phase.isVisible ? 20 : 0)
        .accessibilityIdentifier("chrome.menu.\(accessibilityLabel)")
    }

    private var panel: some View {
        VStack(alignment: .leading, spacing: 0) {
            ForEach(items) { item in
                if item.role == .separator {
                    GlassMenuSeparator()
                } else {
                    menuRow(item)
                }
            }
        }
        .frame(minWidth: DesignTokens.Chrome.menuMinWidth)
        .padding(.vertical, DesignTokens.Spacing.xs)
        .cookGlass(
            .regular,
            in: RoundedRectangle(cornerRadius: DesignTokens.Radius.card, style: .continuous)
        )
        .scaleEffect(
            GlassMenuTransition.scale(for: presenter.phase, reduceMotion: reduceMotion),
            anchor: .topTrailing
        )
        .opacity(presenter.phase == .closing || presenter.phase == .closed ? 0 : 1)
    }

    private func menuRow(_ item: GlassMenuItem) -> some View {
        Button {
            guard !item.isDisabled else { return }
            onSelect(item)
            dismiss()
        } label: {
            HStack(spacing: DesignTokens.Chrome.headerIconToLabelGap) {
                if let systemImage = item.systemImage {
                    Image(systemName: systemImage)
                        .frame(width: 20)
                }
                Text(item.title)
                    .font(DesignTokens.Typography.menuItem)
                Spacer(minLength: 0)
            }
            .foregroundStyle(item.role == .destructive ? Color.cookDestructive : Color.cookPrimaryText)
            .padding(.horizontal, DesignTokens.Chrome.menuHorizontalPadding)
            .frame(minHeight: DesignTokens.Chrome.menuItemHeight)
            .contentShape(Rectangle())
            .background {
                if pressedItemID == item.id {
                    Color.primary.opacity(0.08)
                }
            }
            .opacity(item.isDisabled ? DesignTokens.Chrome.disabledOpacity : 1)
        }
        .buttonStyle(.plain)
        .disabled(item.isDisabled)
        .simultaneousGesture(
            DragGesture(minimumDistance: 0)
                .onChanged { _ in
                    if !item.isDisabled { pressedItemID = item.id }
                }
                .onEnded { _ in
                    pressedItemID = nil
                }
        )
        .accessibilityLabel(item.title)
    }

    private func toggle() {
        let animation = Animation.easeInOut(duration: GlassMenuTransition.duration)
        if presenter.phase.isVisible {
            dismiss()
        } else {
            withAnimation(animation) {
                presenter.present()
            }
            Task { @MainActor in
                try? await Task.sleep(for: .seconds(GlassMenuTransition.duration))
                presenter.markOpen()
            }
        }
    }

    private func dismiss() {
        let animation = Animation.easeInOut(duration: GlassMenuTransition.duration)
        withAnimation(animation) {
            presenter.dismiss()
        }
        Task { @MainActor in
            try? await Task.sleep(for: .seconds(GlassMenuTransition.duration))
            presenter.markClosed()
        }
    }
}

private struct GlassMenuSeparator: View {
    var body: some View {
        Rectangle()
            .fill(Color.cookSeparator)
            .frame(height: DesignTokens.Chrome.hairlineWidth)
            .padding(.horizontal, DesignTokens.Chrome.menuHorizontalPadding)
    }
}
