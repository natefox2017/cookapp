import SwiftUI

/// Shared chrome kit previews — states only, no business screens.
#Preview("D1 Floating tab chrome") {
    ZStack {
        Color.cookBackground.ignoresSafeArea()
        VStack {
            Spacer()
            FloatingTabChrome(selectedTab: .constant(.cookbook), onSearch: {})
        }
    }
}

#Preview("D2 Header buttons") {
    GlassHeaderButtonCluster {
        GlassHeaderButton(systemImage: "chevron.left", accessibilityLabel: "Back", action: {})
        GlassHeaderButton(
            systemImage: "ellipsis",
            accessibilityLabel: "More",
            isMenuHostHighlighted: true,
            action: {}
        )
        GlassHeaderButton(
            systemImage: "plus",
            title: "Add",
            accessibilityLabel: "Add",
            shape: .capsule,
            action: {}
        )
        GlassHeaderButton(
            systemImage: "cart",
            accessibilityLabel: "Cart over media",
            overMedia: true,
            action: {}
        )
        GlassHeaderButton(
            systemImage: "heart",
            accessibilityLabel: "Loading",
            isLoading: true,
            action: {}
        )
        GlassHeaderButton(
            systemImage: "trash",
            accessibilityLabel: "Disabled",
            isDisabled: true,
            action: {}
        )
    }
    .padding()
}

#Preview("D3 Glass menu") {
    GlassMenuButton(
        systemImage: "ellipsis",
        accessibilityLabel: "More",
        items: [
            GlassMenuItem(id: "a", title: "New Folder", systemImage: "folder.badge.plus"),
            GlassMenuItem(id: "b", title: "Disabled", isDisabled: true),
            GlassMenuItem(id: "d", title: "Saving", systemImage: "square.and.arrow.down", isLoading: true),
            .separator(id: "s"),
            GlassMenuItem(id: "c", title: "Delete", systemImage: "trash", role: .destructive),
        ],
        overMedia: true,
        onSelect: { _ in }
    )
    .padding()
}
