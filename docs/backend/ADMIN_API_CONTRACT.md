# Admin API Contract Matrix

Issue: [#52](https://github.com/natefox2017/cookapp/issues/52) · Parent [#49](https://github.com/natefox2017/cookapp/issues/49)  
Notion: [Backend & Admin V2 §14](https://app.notion.com/p/3dfe1df1f5a7816b89c1fe67eded6242)  
Nav scope: Issue [#104](https://github.com/natefox2017/cookapp/issues/104) §14 IA rebuild (builds on Gate-released ops [#101](https://github.com/natefox2017/cookapp/issues/101)). Personal surfaces stay out of Admin nav ([#98](https://github.com/natefox2017/cookapp/issues/98) / [#99](https://github.com/natefox2017/cookapp/issues/99)).

## Rules

1. Admin typed client live paths must match `/functions/v1/<function>/…` (never invent `/admin/…` REST unless an Edge Function exists).
2. Production / live mode must **not** silently serve mock KPI or catalog data.
3. Domains without a live Admin API throw explicit `501 not_implemented` in the Admin client (UI shows pending — not “empty success”).
4. Admin **nav** follows §14 IA: Dashboard → Users → Commerce → Analytics → Content & AI → Operations → Settings. No user private content browser.
5. **System Recommended Recipes** share the `recipes` table with `library_kind=system_recommended` (Owner: single table). Admin catalog must not return `user_owned` recipe bodies.
6. Every **live** Admin endpoint is documented in `supabase/openapi/openapi.yaml`.
7. Mock mode (`VITE_ADMIN_USE_MOCK=true`) is local/dev only — see #51 production hardening.

## Navigation (§14 / #104)

Shared source: `admin/src/components/layout/nav.ts`.

| Nav | Route | UI | API status |
|-----|-------|----|------------|
| Dashboard | `/` | live | live |
| Users | `/users` | live | live |
| Commerce → Overview | `/commerce` | live | live (`admin-subscriptions`) |
| Commerce → Subscriptions | `/commerce/subscriptions` | live | live |
| Commerce → Payments | `/commerce/payments` | live | live (#58) |
| Commerce → Products & Plans | `/commerce/products` | live | live |
| Analytics | `/analytics` | live | live (`admin-analytics`) |
| Content & AI → System Recipe Library | `/content/recipes` | live | live (`admin-catalog/recipes` · system only) |
| Content & AI → AI Import | `/content/import` | live | live (`admin-recipe-import`) |
| Content & AI → Import Review | `/content/import-review` | live | live |
| Content & AI → Taxonomy | `/content/taxonomy` | live | live (ingredients + categories) |
| Operations → System Health | `/operations/health` | live | live (`admin-operations/health`) |
| Operations → Jobs & Syncs | `/operations/jobs` | live | live |
| Operations → Errors & Incidents | `/operations/errors` | live | live (failed jobs aggregate) |
| Operations → Audit Log | `/operations/audit-log` | live | live (`admin-operations/audit-logs`) |
| Settings → General / Security / System | `/settings/*` | hybrid | hybrid |
| Settings → Runtime Config | `/settings/runtime-config` | live | live (`admin-catalog/runtime-config`) |
| Settings → AI Platform | `/settings/ai-platform` | live | live (`admin-ai`) |
| Settings → Integrations | `/settings/integrations` | live | live (#63) |

Legacy redirects: `/recipes*` → `/content/*`, `/ingredients`·`/categories` → `/content/taxonomy`, `/subscription` → `/commerce/subscriptions`. Personal surfaces → `/`.

## Recipes privacy (#104)

| Rule | Enforcement |
|------|-------------|
| Admin list/get/patch/delete recipes | `library_kind = system_recommended` only |
| User recipe body (ingredients/steps/notes) | **403** if Admin requests a `user_owned` id |
| Admin AI Import destination | `destination_user_id` null → insert `system_recommended` on same `recipes` table |
| Taxonomy usage counts | Count system recipes only |

## Matrix (delta vs prior)

| Admin UI route | Client API | Live path | Status | Notes |
|----------------|------------|-----------|--------|-------|
| `/content/recipes` | `listRecipes` / CRUD | `…/admin-catalog/recipes` | live | system_recommended filter |
| `/settings/runtime-config` | `listRuntimeConfig` / `updateRuntimeConfig` | `…/admin-catalog/runtime-config` | live | non-secret knobs; audited |
| `/operations/health` | `getSystemHealth` | `…/admin-operations/health` | live | integration probes |
| `/operations/audit-log` | `listAuditLogs` | `…/admin-operations/audit-logs` | live | no secrets in diffs |

See earlier rows in git history for auth/users/dashboard/subscriptions/integrations matrix (unchanged).
