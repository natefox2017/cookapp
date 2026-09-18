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

extension View {
    /// Apply shared Liquid Glass chrome for custom floating containers.
    /// Prefer `cookGlass(_:in:)` with an explicit shape. Do not use on content.
    func cookGlassChrome() -> some View {
        cookGlass(
            .regular,
            in: RoundedRectangle(cornerRadius: DesignTokens.Radius.card, style: .continuous)
        )
    }
}
