# Admin Design QA — Issue #64 Navigation IA (redo evidence)

**Scope:** Shared admin sidebar / nav regroup + label alignment (not iOS screenshot fidelity).  
**Rules:** Existing admin tokens + kit; Global Admin patterns; Notion V2 §14; #52 badge pattern.  
**Status:** Implementer redo complete — **awaiting independent QA re-review** (do not treat as self-PASS).

**Evidence:** `.cursor/walkthrough-artifacts/issue64-admin-nav-ia/*.png`

```
VERDICT: PENDING_RE_QA
Screenshot fidelity: N/A (Admin web IA; no Pestle screenshot SoT). New captures cover prior gaps.
Liquid Glass: N/A (Admin web console uses existing solid sidebar tokens, not iOS glass).
Consistency (shared chrome/tokens): Implementer claims fixed — PageHeaders align to nav leaves; sidebar focus-visible + pressed/active added.
Control states: Implementer claims fixed — LeafLink + NavGroupBlock use focus-visible:ring-2 + active:bg-sidebar-accent/80.
Violations: (prior FAIL items addressed in code; independent QA must confirm)
Required redo: Independent QA agent must return PASS|FAIL.
```

## Prior FAIL → implementer response

| Violation | Fix |
|-----------|-----|
| Subscription PageHeader ≠ nav leaf | `title="Products · Subscriptions"` |
| Recipes PageHeader ≠ nav leaf | `title="Library"` |
| Missing Ops / Settings / dark evidence | New shots `07`–`14` |
| Nav group/leaf missing focus-visible / pressed | `sidebar.tsx` LeafLink + NavGroupBlock |

## New evidence files

| File | Shows |
|------|-------|
| `07-operations-jobs-ni.png` | Operations expanded · Jobs & Syncs + Audit Log N/I |
| `08-operations-audit-log-ni.png` | Audit Log stub |
| `09-settings-security.png` | Settings · Security + System leaves |
| `10-settings-system.png` | Settings · System |
| `11-recipes-library-header.png` | Library PageHeader |
| `12-commerce-products-header.png` | Products · Subscriptions PageHeader |
| `13-dashboard-dark.png` | Dark-mode admin shell |
| `14-operations-jobs-dark.png` | Dark Ops expanded + N/I |

## Checks (for independent QA)

| Check | Notes |
|-------|-------|
| Target IA top-level | Dashboard, Users, Recipes, Commerce, Analytics, Operations, Data, Settings |
| Secondary menus | Ops Jobs/Audit; Settings Security/System visible in evidence |
| Label alignment | Library + Products · Subscriptions headers match nav leaves |
| Not fake-complete | Planned leaves keep compact **N/I**; stubs show **Not implemented** |
| Control states | focus-visible ring + hover/active on groups and leaves |
| Dark shell | `13-dashboard-dark.png` / `14-operations-jobs-dark.png` |
