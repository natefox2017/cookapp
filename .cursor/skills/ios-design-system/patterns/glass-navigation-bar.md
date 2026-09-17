# Pattern — Glass Navigation Bar

Use `NavigationStack`. It is glass by default on iOS 26. Do not add `.glassEffect()` to a custom header.

```swift
NavigationStack {
    ScrollView {
        LazyVStack(spacing: 16) { /* content */ }
            .padding()
    }
    .navigationTitle("Discover")
    .navigationBarTitleDisplayMode(.large)
    .toolbar {
        ToolbarItem(placement: .topBarTrailing) {
            Button("Filter", systemImage: "line.3.horizontal.decrease") { }
        }
    }
}
```

Gotchas:
- Do not rebuild the nav bar as a custom `HStack` with blur
- Do not use `.toolbarBackground(.regularMaterial)` — that is the legacy material
- For a full-bleed image, hide the bar background; items still float as glass
