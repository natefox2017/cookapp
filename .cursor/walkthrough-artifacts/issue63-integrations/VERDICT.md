# Admin Design QA — Settings → Integrations (#63)

Screen: **Settings → Integrations**  
Code: `admin/src/pages/settings/integrations-panel.tsx`, `admin/src/pages/settings/settings-page.tsx`  
Evidence: `integrations-desktop.png`, `integrations-mobile.png`, `integrations-after-test.png`  
Rules: Global Admin UI Standard · shared Admin kit/tokens · data authenticity (V2 §11)

```
VERDICT: PASS
Screenshot fidelity: N/A (no Pestle/mobile screenshot SoT for Admin; layout matches Global Admin UI Standard + existing Settings shell). Desktop + narrow viewport captured.
Liquid Glass: N/A (Admin web kit, not iOS Liquid Glass chrome).
Consistency (shared chrome/tokens): PASS — reuses PageHeader/Tabs/Card/Badge/Button/Progress/Dialog from shared kit; brand green tokens; no page-local palette forks.
Control states: PASS — LoadingBlock/ErrorState/Retry; Refresh; Test connection loading; Test unavailable disabled for Google Play; Update secret dialog with validation; mock-mode banner; secret masked as •••••••• configured.
Violations: (none)
Required redo: (none)
```

## Checks

1. **IA** — Integrations under Settings tabs (not a duplicate top-level nav).
2. **Authenticity** — Mock fixtures never mark Google Play Connected; production path uses `admin-integrations` live API.
3. **Secrets** — Write-only dialog; UI never displays plaintext after save.
4. **Responsive** — Cards stack on ~390px width; tabs remain reachable.
5. **States** — connected / not_configured / degraded / future_reserved badges + completeness + last success/error.

## Build / Test

- `deno test --allow-env supabase/functions/_shared/integrations_status_test.ts` — 9/9 pass
- `npm --prefix admin test` — pass
- `npm --prefix admin run build` — pass
- OpenAPI yaml ↔ json ↔ spec.json synced
