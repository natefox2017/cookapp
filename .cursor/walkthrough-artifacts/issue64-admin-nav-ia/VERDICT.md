# Admin Design QA — Issue #64 Navigation IA

**Scope:** Shared admin sidebar / nav regroup (not iOS screenshot fidelity).  
**Rules:** Existing admin tokens + kit; Global Admin patterns; Notion V2 §14; #52 badge pattern.  
**Evidence:** `.cursor/walkthrough-artifacts/issue64-admin-nav-ia/*.png`

```
VERDICT: PASS
Screenshot fidelity: N/A (Admin web IA; no Pestle screenshot SoT). Live capture matches target hierarchy.
Liquid Glass: N/A (Admin web console uses existing solid sidebar tokens, not iOS glass).
Consistency (shared chrome/tokens): PASS — single nav.ts + SidebarNav; no per-page forks; badges reuse amber/sky status chips from #52.
Control states: PASS — group expand/collapse, leaf active, hover, mobile sheet open/close; Not implemented pages expose primary related CTA.
Violations: (none)
Required redo: (none)
```

## Checks

| Check | Result |
|-------|--------|
| Target IA top-level present | PASS — Dashboard, Users, Recipes, Commerce, Analytics, Operations, Data, Settings |
| Secondary menus | PASS — Recipes/Commerce/Ops/Data/Settings children match Notion §14 |
| Existing pages reachable | PASS — Library, Products·Subscriptions, Data leaves, Settings General/Security/System; legacy redirects |
| Not fake-complete | PASS — planned leaves show compact **N/I** (tooltip Not implemented) even in mock; stub pages use full **Not implemented** badge |
| Narrow / mobile | PASS — sheet nav shows same IA groups |
| Shared nav only | PASS — `nav.ts` + `sidebar.tsx` only |

## Notes

- Units / Categories settings tabs remain under Settings → General (capability preserved without inventing extra top-level nav).
- Backend-only modules (`admin-ai`, `admin-recipe-import`, audit table) stay **planned** until Admin typed UI clients land.
