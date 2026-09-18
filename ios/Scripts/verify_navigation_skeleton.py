#!/usr/bin/env python3
"""Repeatable Phase 1.5 navigation skeleton checks for Linux CI (no Xcode)."""

from __future__ import annotations

import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parents[2]
IOS = ROOT / "ios"

REQUIRED_FILES = [
    "CookApp/App/Navigation/AppTab.swift",
    "CookApp/App/Navigation/AppRoute.swift",
    "CookApp/App/Navigation/AppSheet.swift",
    "CookApp/App/Navigation/AppNavigationState.swift",
    "CookApp/App/Navigation/AppShellView.swift",
    "CookApp/App/Navigation/RoutePlaceholderView.swift",
    "CookApp/App/Navigation/NavigationDestinationBuilder.swift",
    "CookApp/Features/Cookbook/CookbookShellViews.swift",
    "CookApp/Features/Groceries/GroceriesShellViews.swift",
    "CookApp/Features/MealPlan/MealPlanShellViews.swift",
    "CookApp/Features/Settings/SettingsShellViews.swift",
    "CookAppTests/Navigation/NavigationSkeletonTests.swift",
]

REQUIRED_TYPES = [
    "enum AppTab",
    "enum AppRoute",
    "enum AppSheet",
    "class AppNavigationState",
    "struct AppShellView",
    "struct RoutePlaceholderView",
    "struct CookbookHomeView",
    "struct GroceriesHomeView",
    "struct MealPlanHomeView",
    "struct SettingsHomeView",
    "struct SearchShellView",
    "struct RecipeListShellView",
]

FORBIDDEN_TYPE_PATTERNS = [
    r"\bstruct\s+ShareSheet",
    r"\bstruct\s+Page23",
    r"\bstruct\s+Page37",
    r"\bstruct\s+Page46",
    r"\bstruct\s+Page47",
    r"\bstruct\s+Page48",
    r"\bcase\s+shareSheet\b",
    r"\bcase\s+page23\b",
    r"\bcase\s+page37\b",
    r"\bcase\s+proUpsell\b",
]

# Dedup: must not invent second Search / MealPlan / Groceries home push cases.
FORBIDDEN_DUPLICATE_CASES = [
    r"\bcase\s+searchEnter\b",
    r"\bcase\s+searchFocused\b",
    r"\bcase\s+searchResults\b",
    r"\bcase\s+groceriesEmpty\b",
    r"\bcase\s+groceriesList\b",
    r"\bcase\s+mealPlanEmpty\b",
    r"\bcase\s+mealPlanWithRecipe\b",
    r"\bcase\s+cookbookAlt\b",
]


def fail(msg: str) -> None:
    print(f"FAIL: {msg}", file=sys.stderr)
    raise SystemExit(1)


def main() -> None:
    for rel in REQUIRED_FILES:
        path = IOS / rel
        if not path.is_file():
            fail(f"missing required file: {rel}")

    root_view = (IOS / "CookApp/App/RootView.swift").read_text()
    if "AppShellView()" not in root_view:
        fail("RootView must enter AppShellView when signed in")
    if "signedInHome" in root_view:
        fail("RootView must not keep Phase 1 signedInHome as product IA")

    sources: list[str] = []
    for path in (IOS / "CookApp").rglob("*.swift"):
        sources.append(path.read_text())
    blob = "\n".join(sources)

    for needle in REQUIRED_TYPES:
        if needle not in blob:
            fail(f"missing type declaration: {needle}")

    for pattern in FORBIDDEN_TYPE_PATTERNS + FORBIDDEN_DUPLICATE_CASES:
        if re.search(pattern, blob):
            fail(f"forbidden pattern present: {pattern}")

    # Expected CaseIterable sizes from AppRoute / AppSheet source.
    route_cases = re.findall(r"^\s+case\s+(\w+)", (IOS / "CookApp/App/Navigation/AppRoute.swift").read_text(), re.M)
    sheet_cases = re.findall(r"^\s+case\s+(\w+)", (IOS / "CookApp/App/Navigation/AppSheet.swift").read_text(), re.M)
    tab_cases = re.findall(r"^\s+case\s+(\w+)", (IOS / "CookApp/App/Navigation/AppTab.swift").read_text(), re.M)

    if len(tab_cases) != 4:
        fail(f"expected 4 AppTab cases, got {len(tab_cases)}: {tab_cases}")
    if len(route_cases) != 24:
        fail(f"expected 24 AppRoute cases, got {len(route_cases)}: {route_cases}")
    if len(sheet_cases) != 8:
        fail(f"expected 8 AppSheet cases, got {len(sheet_cases)}: {sheet_cases}")

    # No business service/repository/model under new feature folders.
    for feature in ("Cookbook", "Groceries", "MealPlan", "Settings"):
        feature_dir = IOS / "CookApp/Features" / feature
        for path in feature_dir.rglob("*.swift"):
            text = path.read_text()
            if re.search(r"\b(Repository|Service|ViewModel)\b", text) and "FoundationDiagnostics" not in path.name:
                # Allow FoundationDiagnosticsView name only; reject Service/Repository types in shells.
                if re.search(r"\b(class|struct|protocol)\s+\w*(Repository|Service|ViewModel)\b", text):
                    fail(f"business type not allowed in Phase 1.5: {path.relative_to(IOS)}")

    settings_src = (IOS / "CookApp/Features/Settings/SettingsShellViews.swift").read_text()
    account_match = re.search(
        r"struct AccountShellView: View \{.*?(?=\nstruct |\Z)",
        settings_src,
        re.S,
    )
    if not account_match:
        fail("could not parse AccountShellView")
    account_body = account_match.group(0)
    if "Sign Out" in account_body or "authService" in account_body:
        fail("AccountShellView must not expose Sign Out / AuthService (Phase 1.5 placeholder)")
    if "RoutePlaceholderView" not in account_body:
        fail("AccountShellView must use RoutePlaceholderView")
    if "Sign Out" not in settings_src:
        fail("Debug Foundation Diagnostics must keep Sign Out")

    print("Phase 1.5 navigation skeleton checks OK")
    print(f"  tabs={len(tab_cases)} routes={len(route_cases)} sheets={len(sheet_cases)}")


if __name__ == "__main__":
    main()
