import Observation
import SwiftUI

enum AppThemeMode: String, CaseIterable, Identifiable, Sendable {
    case system
    case light
    case dark

    var id: String { rawValue }

    var preferredColorScheme: ColorScheme? {
        switch self {
        case .system: nil
        case .light: .light
        case .dark: .dark
        }
    }
}

@Observable
@MainActor
final class ThemeController {
    var mode: AppThemeMode {
        didSet { UserDefaults.standard.set(mode.rawValue, forKey: Self.storageKey) }
    }

    var preferredColorScheme: ColorScheme? { mode.preferredColorScheme }

    private static let storageKey = "cookapp.theme.mode"

    init() {
        if let raw = UserDefaults.standard.string(forKey: Self.storageKey),
           let stored = AppThemeMode(rawValue: raw) {
            mode = stored
        } else {
            mode = .system
        }
    }
}

/// Floating chrome should prefer system materials / future Liquid Glass.
/// Prefer native bars, sheets, and toolbars — they adopt Liquid Glass automatically on iOS 26+.
struct GlassChromeModifier: ViewModifier {
    func body(content: Content) -> some View {
        content
            .background(
                .ultraThinMaterial,
                in: RoundedRectangle(cornerRadius: DesignTokens.Radius.card, style: .continuous)
            )
    }
}

extension View {
    /// Apply translucent chrome for custom floating containers.
    /// Prefer Apple system chrome (tab/toolbar/sheet) when possible.
    func cookGlassChrome() -> some View {
        modifier(GlassChromeModifier())
    }
}
