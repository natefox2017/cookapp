import SwiftUI

/// D1 — floating regular-glass tab capsule + search circle.
struct FloatingTabChrome: View {
    @Binding var selectedTab: AppTab
    var onSearch: () -> Void
    var disabledTabs: Set<AppTab> = []
    var loadingTab: AppTab? = nil
    var isSearchDisabled: Bool = false
    var isSearchLoading: Bool = false

    var body: some View {
        HStack(alignment: .center, spacing: DesignTokens.Chrome.tabToSearchGap) {
            FloatingTabBar(
                selectedTab: $selectedTab,
                disabledTabs: disabledTabs,
                loadingTab: loadingTab
            )
            GlassHeaderButton(
                systemImage: "magnifyingglass",
                accessibilityLabel: "Search",
                size: DesignTokens.Chrome.searchCircleSize,
                isDisabled: isSearchDisabled,
                isLoading: isSearchLoading,
                action: onSearch
            )
            .accessibilityIdentifier("chrome.search")
        }
        .cookGlassCluster(spacing: DesignTokens.Chrome.clusterBlendSpacing)
        .padding(.horizontal, DesignTokens.Chrome.barHorizontalInset)
        .padding(.top, DesignTokens.Chrome.barTopPadding)
        .padding(.bottom, DesignTokens.Chrome.barBottomPadding)
        .accessibilityElement(children: .contain)
        .accessibilityIdentifier("chrome.floatingTabBar")
    }
}

struct FloatingTabBar: View {
    @Binding var selectedTab: AppTab
    var disabledTabs: Set<AppTab> = []
    var loadingTab: AppTab? = nil

    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @Namespace private var tabNamespace
    @State private var hoveredTab: AppTab?

    var body: some View {
        HStack(spacing: DesignTokens.Chrome.tabSlotSpacing) {
            ForEach(AppTab.allCases) { tab in
                tabButton(tab)
            }
        }
        .padding(.horizontal, DesignTokens.Chrome.tabCapsuleHorizontalPadding)
        .padding(.vertical, DesignTokens.Chrome.tabCapsuleVerticalPadding)
        .frame(minHeight: DesignTokens.Chrome.tabBarHeight)
        .cookGlass(
            .regular,
            in: Capsule(),
            interactive: true,
            isLoading: loadingTab != nil
        )
        .accessibilityElement(children: .contain)
        .accessibilityIdentifier("chrome.tabCapsule")
    }

    private func tabButton(_ tab: AppTab) -> some View {
        let isSelected = selectedTab == tab
        let isDisabled = disabledTabs.contains(tab)
        let isLoading = loadingTab == tab
        let isEnabled = !isDisabled && !isLoading

        return Button {
            guard isEnabled else { return }
            withAnimation(
                reduceMotion ? nil : .easeInOut(duration: DesignTokens.Motion.tabSelection)
            ) {
                selectedTab = tab
            }
        } label: {
            VStack(spacing: 2) {
                ZStack {
                    Image(systemName: isSelected ? tab.selectedSystemImage : tab.systemImage)
                        .font(.body.weight(.semibold))
                        .opacity(isLoading ? 0 : 1)
                    if isLoading {
                        ProgressView()
                            .controlSize(.mini)
                    }
                }
                .frame(height: 22)
                Text(tab.title)
                    .font(DesignTokens.Typography.tabLabel)
                    .lineLimit(1)
                    .minimumScaleFactor(0.8)
            }
            .foregroundStyle(isSelected ? Color.cookBrand : Color.cookSecondaryText)
            .frame(maxWidth: .infinity)
            .frame(minHeight: DesignTokens.Chrome.minimumHitTarget)
            .contentShape(Rectangle())
            .background {
                if isSelected {
                    RoundedRectangle(cornerRadius: DesignTokens.Radius.tabSelection, style: .continuous)
                        .fill(Color.cookBrand.opacity(DesignTokens.Chrome.selectedTintOpacity))
                        .matchedGeometryEffect(id: "tabSelection", in: tabNamespace)
                }
            }
            .overlay {
                if hoveredTab == tab && isEnabled && !isSelected {
                    RoundedRectangle(cornerRadius: DesignTokens.Radius.tabSelection, style: .continuous)
                        .fill(Color.primary.opacity(DesignTokens.Chrome.hoverLiftOpacity))
                }
            }
            .opacity(isDisabled ? DesignTokens.Chrome.disabledOpacity : 1)
        }
        .buttonStyle(ChromePressButtonStyle(isEnabled: isEnabled, reduceMotion: reduceMotion))
        .disabled(!isEnabled)
        .onHover { hovering in
            hoveredTab = hovering && isEnabled ? tab : (hoveredTab == tab ? nil : hoveredTab)
        }
        .accessibilityLabel(tab.title)
        .accessibilityAddTraits(isSelected ? [.isButton, .isSelected] : [.isButton])
        .accessibilityIdentifier("chrome.tab.\(tab.rawValue)")
    }
}
