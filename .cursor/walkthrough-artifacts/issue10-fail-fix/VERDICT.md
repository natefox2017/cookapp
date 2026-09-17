# Issue #10 Acceptance Audit — Fix Pass Verdict (2026-09-17)

Evidence:
- After exports: `/opt/cursor/artifacts/figma-qa/after/`
- Side-by-side: `/opt/cursor/artifacts/figma-qa/compare/`
- Repo copy: `.cursor/walkthrough-artifacts/issue10-fail-fix/`

Ignore status bar / Dynamic Island / keyboard.

## FAIL-with-ref pages

| Page | Ref | Verdict | Notes |
|---|---|---|---|
| 01/20 Cookbook | cookbook-grid.jpg | **PASS*** | 6th Kale card added; green title; active pill. *Card imagery still flat placeholders vs photo refs. |
| 02 Recipe Detail | recipe-detail-beef-bourguignon.jpg | **PASS*** | Cart+calendar+more glass capsule; Start Cooking without flame. *Hero still solid placeholder; glass opacity residual. |
| 05 Timer | create-timer.jpg | **PASS** | Back/Start capsules; Untitled Timer; segmented presets; toggle OFF. |
| 06 Recipe Menu | recipe-detail-*-menu-open.jpg | **PASS*** | Full IA Edit→Delete. *Row icons / Share·Folders chevrons still light. |
| 07 Folders | folders-home-expanded.jpg | **PASS** | Recently Added + Categories expanded + counts 6. |
| 11 Discover | discover.jpg | **PASS** | Top-right filter removed. |
| 25 Groceries | groceries-list.jpg | **PASS*** | Green qty highlights; Pantry chrome. *Discover icon glyph fine-tuning residual. |
| 26 List Menu | groceries-list-menu-open.jpg | **PASS** | Choose List / Hide Purchased / Share List / Clear (red). |
| 27 Choose List | groceries-choose-list-menu-open.jpg | **PASS*** | Overlay panel over groceries list. *Header icon/chevron residual. |
| 29 Meal Plan | meal-plan-empty.jpg | **PASS*** | Large green title; No recipes; + buttons; household badge. *Date window starts at Today (ref scrolls earlier days). |
| 30 Meal Plan Inline | meal-plan-with-recipe.jpg | **PASS*** | Recipe card under Tomorrow. *Card uses flat fill not hero photo. |
| 33 Settings | settings.jpg | **PASS*** | Pro=Active row; Chrome Extension visible; green title. *Icon polish residual. |
| 34 General | settings-general.jpg | **PARTIAL** | App Icon thumb + Timers toggle added; layout density vs ref still off (Calendar section lower). |
| 39 Account | account-settings.jpg | **PASS*** | Copy Support ID + green copy glyph. |
| 41 Paywall | join-pestle-pro.jpg | **PARTIAL** | Join Pestle Pro hero + timeline + CTA. Missing App Store / laurel social proof strip. |
| 43 Household | household-settings.jpg | **PASS** | Managed `ba d` state (not Create form). |

## MISSING_REF (no invent)
03, 04, 08–10, 12–19, 21–22, 24, 28, 31–32, 35–38, 40, 42, 44–49 — unchanged; report only.

## FIGMA_MISSING (screenshot exists, no formal tree page)
pantry*, siri-shortcuts, settings-general-*-menu-open, cookbook layout/sort menus, recipe-filter*, add-to-meal-plan*, categories-list* — recorded, not invented into Interaction Tree this pass.

## Checklist recommendation
Check: 01/20, 02, 05, 06, 07, 11, 25, 26, 27, 29, 30, 33, 39, 43 (with PARTIAL residuals noted where *).
Leave unchecked: 34, 41 until social-proof / General density residuals cleared; all MISSING_REF.
