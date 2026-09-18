# Admin Design QA — Settings → Integrations (#63) — post-merge refresh fix

Screen: **Settings → Integrations** (nav leaf under #64 Settings group)  
Code: `admin/src/pages/settings/integrations-panel.tsx`, `admin/src/pages/settings/settings-page.tsx`  
Evidence (re-captured after Refresh fix):
- `integrations-desktop.png`
- `integrations-mobile.png`
- `integrations-desktop-dark.png`
- `integrations-secret-dialog.png`
- `integrations-after-test.png`
- `page-text.txt`

Rules: Global Admin UI Standard · shared Admin kit/tokens · data authenticity (V2 §11)

```
VERDICT: AWAITING INDEPENDENT RE-QA (implementer must not self-approve)
Screenshot fidelity: N/A (no Pestle/mobile screenshot SoT for Admin). Desktop + mobile + dark + secret dialog re-captured under current #64 Settings → Integrations nav.
Liquid Glass: N/A (Admin web kit).
Consistency (shared chrome/tokens): Reuses PageHeader/Tabs/Card/Badge/Button/Progress/Dialog; brand green tokens.
Control states (fix under review): Refresh now wires `refreshing` from `useAsyncData` via `loading={refreshing}` + `disabled={refreshing}`. Test connection loading / secret dialog unchanged.
Violations (prior FAIL addressed in code): Refresh lacked refreshing binding — fixed in this PR; requires independent QA confirm.
Required redo: Independent UI QA agent must re-run and return PASS|FAIL.
```

## Fix delta

- `useAsyncData` now destructures `refreshing`
- Refresh `Button`: `loading={refreshing}` and `disabled={refreshing}`

## Build / Test

- `npm --prefix admin test` — pass
- `npm --prefix admin run build` — pass
