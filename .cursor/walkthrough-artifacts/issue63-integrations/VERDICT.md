# Admin Design QA — Settings → Integrations (#63) — post-merge refresh fix

Screen: **Settings → Integrations** (flat Admin nav after #61 / #81 rollback of #64 Stage-4 IA)  
Code: `admin/src/pages/settings/integrations-panel.tsx`, `admin/src/pages/settings/settings-page.tsx`  
Evidence (re-captured after rebase onto `5755163` flat nav):
- `integrations-desktop.png`
- `integrations-mobile.png`
- `integrations-desktop-dark.png`
- `integrations-secret-dialog.png`
- `integrations-after-test.png`
- `integrations-refresh-loading.png`
- `page-text.txt`

Rules: Global Admin UI Standard · shared Admin kit/tokens · data authenticity (V2 §11)

```
VERDICT: AWAITING INDEPENDENT RE-QA (implementer must not self-approve)
Screenshot fidelity: N/A (no Pestle/mobile screenshot SoT for Admin). Desktop + mobile + dark + secret dialog + Refresh loading re-captured under **flat** Settings → Integrations (sidebar: Dashboard…Subscription + Settings; tabs: General/Units/Categories/Integrations/Security/System). No #64 Commerce/Analytics/Operations hierarchy.
Liquid Glass: N/A (Admin web kit).
Consistency (shared chrome/tokens): Reuses PageHeader/Tabs/Card/Badge/Button/Progress/Dialog; brand green tokens.
Control states (fix under review): Refresh wires `refreshing` from `useAsyncData` via `loading={refreshing}` + `disabled={refreshing}` (see `integrations-refresh-loading.png`). Test connection / secret dialog unchanged.
Violations (prior FAIL addressed): (1) missing #61 flat-nav on branch — rebased onto main `5755163`; (2) hierarchical artifacts — re-captured; (3) Refresh wiring preserved.
Required redo: Independent UI QA agent must re-run and return PASS|FAIL.
```

## Fix delta

- `useAsyncData` destructures `refreshing`
- Refresh `Button`: `loading={refreshing}` and `disabled={refreshing}`
- Artifacts / `page-text.txt` show flat nav post-#61

## Build / Test

- `npm --prefix admin test` — pass
- `npm --prefix admin run build` — pass
