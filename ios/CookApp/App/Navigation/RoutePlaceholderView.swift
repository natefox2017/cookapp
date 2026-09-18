import SwiftUI

/// Temporary development placeholder for Phase 1.5 route verification.
///
/// Delete when implementing formal UI — do not layer product UI on top of this view.
struct RoutePlaceholderView: View {
    let title: String

    var body: some View {
        Text(title)
            .font(.title2)
            .multilineTextAlignment(.center)
            .padding()
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .background(Color(.systemBackground))
            .navigationTitle(title)
            .navigationBarTitleDisplayMode(.inline)
            .accessibilityIdentifier("route.placeholder.\(title)")
    }
}

#Preview {
    NavigationStack {
        RoutePlaceholderView(title: "Example")
    }
}
