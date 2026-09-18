# Admin API Contract Matrix

Issue: [#52](https://github.com/natefox2017/cookapp/issues/52) · Parent [#49](https://github.com/natefox2017/cookapp/issues/49)  
Nav IA: [#64](https://github.com/natefox2017/cookapp/issues/64) · Notion [Backend & Admin V2 §3 P0-B / §14 / §17](https://app.notion.com/p/3dfe1df1f5a7816b89c1fe67eded6242)  
Audited against `main` + live Edge Functions on `semsjyrqjnumpvanibip` (2026-09-18).

## Rules

1. Admin typed client live paths must match `/functions/v1/<function>/…` (never invent `/admin/…` REST unless an Edge Function exists).
2. Production / live mode must **not** silently serve mock KPI or catalog data.
3. Domains without a live Admin API throw explicit `501 not_implemented` in the Admin client (UI shows pending — not “empty success”).
4. Planned nav leaves without an Admin UI module show **Not implemented** (Issue #64) — reachable IA, not fake completeness.
5. Every **live** Admin endpoint is documented in `supabase/openapi/openapi.yaml`.
6. Mock mode (`VITE_ADMIN_USE_MOCK=true`) is local/dev only — see #51 production hardening.

## Status legend

| Status | Meaning |
|--------|---------|
| **live** | Edge Function deployed; Admin client uses `/functions/v1/…` |
| **missing** | No Admin Edge Function; live client returns `501`; mock-only UI |
| **hybrid** | Partial live (e.g. Settings Security via `admin-auth`; general settings not persisted live) |
| **planned** | Nav route reserved (Notion V2 §14); Admin UI not implemented — badge **Not implemented** |

## Navigation IA (Issue #64)

Shared source: `admin/src/components/layout/nav.ts` (no per-page forks).

| Nav | Route | UI | API status |
|-----|-------|----|------------|
| Dashboard | `/` | live | live |
| Users | `/users` | live | live |
| Recipes → Library | `/recipes` | mock UI | missing |
| Recipes → AI Import | `/recipes/import` | Not implemented page | planned (backend `admin-recipe-import` exists) |
| Recipes → Import Review | `/recipes/import-review` | Not implemented page | planned |
| Commerce → Products · Subscriptions | `/commerce/products` | live (`SubscriptionPage`) | live |
| Commerce → Payments | `/commerce/payments` | Not implemented page | planned (backend `payment_transactions` #58; Admin list UI pending) |
| Analytics | `/analytics` | Not implemented page | planned (#59/#60) |
| Operations → Jobs & Syncs | `/operations/jobs` | Not implemented page | planned (#60) |
| Operations → Audit Log | `/operations/audit-log` | Not implemented page | planned (table #57; list UI pending) |
| Data → Collections…Categories | `/data/*` | mock UI | missing |
| Settings → General / Security / System | `/settings/{general,security,system}` | hybrid | hybrid / live / hybrid |
| Settings → AI Platform | `/settings/ai-platform` | Not implemented page | planned (backend `admin-ai` exists) |
| Settings → Integrations | `/settings/integrations` | live (`IntegrationsPanel`) | live |

Legacy redirects (capabilities preserved): `/subscription` → `/commerce/products`; `/collections` → `/data/collections` (same for ingredients, grocery, meal-plans, pantry, categories); `/settings` → `/settings/general`.

## Matrix

| Admin UI route | Client API | Live path | Status | Notes |
|----------------|------------|-----------|--------|-------|
| `/login` | `login` | `POST /functions/v1/admin-auth/login` | live | Custom admin bearer |
| (auth) | `logout` | `POST /functions/v1/admin-auth/logout` | live | |
| (auth) | `getSession` | `GET /functions/v1/admin-auth/session` | live | |
| Settings → Security | `changePassword` | `POST /functions/v1/admin-auth/change-password` | live | |
| `/` Dashboard | `getDashboard` | `GET /functions/v1/admin-dashboard` | live | Aggregation; Google Play must not fake zeros (#47/#49) |
| `/users` | `listUsers` / `getUser` / `getUserRegistrationStats` | `GET /functions/v1/admin-users` · `…/:id` · `…/stats` | live | #44 · detail includes `commerceSummary` (#58) |
| `/commerce/products` | plans / records / revenue | `…/admin-subscriptions/{plans,records,revenue}` | live | was `/subscription` |
| (API) Payment transactions | `listTransactions` / `getTransaction` | `…/admin-subscriptions/transactions` · `…/transactions/:id` | live | #58 — RC amounts ≠ final financial truth |
| `/settings/general` · `/settings/system` | `getSettings` / `updateSettings` | — | hybrid | Live: build-time diagnostics only; no persist API |
| `/recipes` | `listRecipes` / CRUD | — | missing | Library; AI Import UI planned separately |
| `/data/collections` | `listCollections` | — | missing | Planned Admin Data APIs |
| `/data/ingredients` | ingredients CRUD | — | missing | |
| `/data/grocery` | grocery users/items | — | missing | |
| `/data/meal-plans` | `listMealPlans` | — | missing | |
| `/data/pantry` | `listPantry` | — | missing | |
| `/data/categories` | taxonomy CRUD | — | missing | End-user category tables exist via PostgREST; no Admin ops API yet |
| `/recipes/import` · `/recipes/import-review` | — | `admin-recipe-import/*` (backend) | planned | Backend #55/#56; Admin UI not wired |
| `/settings/ai-platform` | — | `admin-ai/*` (backend) | planned | Backend #53; Admin UI not wired |
| `/commerce/payments` | — | `admin-subscriptions/transactions` (API live) | planned | #58 Admin Payments page UI pending |
| `/analytics` | — | `admin-store-sync/*` (backend) | planned | #59/#60 Dashboard aggregation pending |
| `/operations/jobs` | — | — | planned | #60 |
| `/operations/audit-log` | — | `admin_audit_logs` (write path #57) | planned | List/read Admin UI pending |
| `/settings/integrations` | list / get / test / secret / config | `…/admin-integrations/*` | live | #63 — Google Play Future Reserved; secrets write-only |
| Store Analytics / Financial sync | status / runs / sync / credentials | `…/admin-store-sync/*` | live | #59 — Google Play Future Reserved |

## Live Edge Functions (inventory)

| Function | `verify_jwt` | Purpose |
|----------|--------------|---------|
| `admin-auth` | false | Login / logout / session / change-password |
| `admin-users` | false | User list, detail, registration mix stats |
| `admin-dashboard` | false | Ops KPI aggregation |
| `admin-subscriptions` | false | Plans CRUD, subscription records, revenue series, payment transactions (#58) |
| `admin-ai` | false | AI Platform providers / models / routes / usage / health (#53) |
| `admin-integrations` | false | Integration connection status / test / write-only secrets (#63) |
| `admin-store-sync` | false | ASC analytics + financial sync (#59) |
| `admin-recipe-import` | false | Import jobs / batches / review actions (#55/#56) |
| `store-sync-worker` | false | ASC sync cron worker (#59) |
| `recipe-import-worker` | false | Import queue worker (#56) |
| `openapi` | false | Serves OpenAPI JSON |
| `health` | true | Module probe (end-user JWT) |
| `delete-account` | true | End-user account purge |
| `revenuecat-webhook` | false | IAP webhook (also upserts `payment_transactions` #58) |
| `storage-cleanup-import-artifacts` | false | Import artifact TTL cleanup (#54) |

## Deprecated / forbidden client paths

Do **not** call these in live mode (they were mock-shaped placeholders):

- `/admin/dashboard`
- `/admin/recipes`, `/admin/recipes/:id`
- `/admin/collections`, `/admin/ingredients`, `/admin/grocery/*`
- `/admin/meal-plans`, `/admin/pantry`, `/admin/categories/*`
- `/admin/settings`

## OpenAPI

Admin auth uses security scheme `AdminBearer` (session token from `admin-auth/login`), not end-user Supabase JWT.

Re-verify:

```bash
python3 -c "import json,yaml,pathlib; s=yaml.safe_load(pathlib.Path('supabase/openapi/openapi.yaml').read_text()); assert json.loads(pathlib.Path('supabase/openapi/openapi.json').read_text())==s; assert json.loads(pathlib.Path('supabase/functions/openapi/spec.json').read_text())==s; print('paths', len(s['paths']))"
```
