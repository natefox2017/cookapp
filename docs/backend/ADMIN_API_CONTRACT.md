# Admin API Contract Matrix

Issue: [#52](https://github.com/natefox2017/cookapp/issues/52) · Parent [#49](https://github.com/natefox2017/cookapp/issues/49)  
Notion: [Backend & Admin V2 §3 P0-B / §17](https://app.notion.com/p/3dfe1df1f5a7816b89c1fe67eded6242)  
Nav scope: Issue [#61](https://github.com/natefox2017/cookapp/issues/61) rolled back #64 hierarchical / planned placeholder IA while Stage 4 Pilot Gate forbids Stage 5–7 Admin surface expansion.  
Audited against `main` + live Edge Functions on `semsjyrqjnumpvanibip` (2026-09-18).

## Rules

1. Admin typed client live paths must match `/functions/v1/<function>/…` (never invent `/admin/…` REST unless an Edge Function exists).
2. Production / live mode must **not** silently serve mock KPI or catalog data.
3. Domains without a live Admin API throw explicit `501 not_implemented` in the Admin client (UI shows pending — not “empty success”).
4. Admin **nav / formal routes** only expose capabilities already approved for the current Gate (implemented or existing mock UI). Future modules stay in Notion / Issues — not as navigable placeholders. Backend APIs (e.g. #60 `admin-analytics` / `admin-operations`) may ship without Admin nav pages.
5. Every **live** Admin endpoint is documented in `supabase/openapi/openapi.yaml`.
6. Mock mode (`VITE_ADMIN_USE_MOCK=true`) is local/dev only — see #51 production hardening.

## Status legend

| Status | Meaning |
|--------|---------|
| **live** | Edge Function deployed; Admin client uses `/functions/v1/…` |
| **missing** | No Admin Edge Function; live client returns `501`; mock-only UI |
| **hybrid** | Partial live (e.g. Settings Security via `admin-auth`; general settings not persisted live) |
| **planned** | Confirmed in Notion V2; tracked under #49 children — **not** exposed as Admin nav until Gate allows |

## Navigation (current Gate)

Shared source: `admin/src/components/layout/nav.ts` (flat list; no per-page forks).

| Nav | Route | UI | API status |
|-----|-------|----|------------|
| Dashboard | `/` | live | live |
| Users | `/users` | live | live |
| Recipes | `/recipes` | live | live (#92) |
| Collections | `/collections` | live | live (#92) |
| Ingredients | `/ingredients` | live | live (#92) |
| Grocery | `/grocery` | live | live (#92) |
| Meal Plans | `/meal-plans` | live | live (#92) |
| Pantry | `/pantry` | live | live (#92) |
| Categories | `/categories` | live | live (#92) |
| Subscription | `/subscription` | live | live |
| Settings | `/settings` → `/settings/general` | hybrid tabs | hybrid |
| Settings → Integrations | `/settings/integrations` | live (`IntegrationsPanel`) | live (#63) |

Compatibility redirects (no dead links after #64 rollback): `/commerce/products` → `/subscription`; `/data/*` → flat counterparts; `/analytics` · `/operations/*` · `/recipes/import*` · `/commerce/payments` → nearest existing page; unknown `/settings/:section` → `/settings/general`.

## Matrix

| Admin UI route | Client API | Live path | Status | Notes |
|----------------|------------|-----------|--------|-------|
| `/login` | `login` | `POST /functions/v1/admin-auth/login` | live | Custom admin bearer |
| (auth) | `logout` | `POST /functions/v1/admin-auth/logout` | live | |
| (auth) | `getSession` | `GET /functions/v1/admin-auth/session` | live | |
| Settings → Security | `changePassword` | `POST /functions/v1/admin-auth/change-password` | live | |
| `/` Dashboard | `getDashboard` | `GET /functions/v1/admin-dashboard` | live | #60 KPIs with source/freshness; prefers `payment_transactions` / `store_analytics_daily`; Google Play future_reserved |
| `/users` | `listUsers` / `getUser` / `getUserRegistrationStats` | `GET /functions/v1/admin-users` · `…/:id` · `…/stats` | live | #44 · detail includes `commerceSummary` (#58) |
| `/subscription` | plans / records / revenue | `…/admin-subscriptions/{plans,records,revenue}` | live | #35 |
| (API) Payment transactions | `listTransactions` / `getTransaction` | `…/admin-subscriptions/transactions` · `…/transactions/:id` | live | #58 — RC amounts ≠ final financial truth; Admin Payments **page** not shipped |
| (API) Analytics aggregation | — | `GET /functions/v1/admin-analytics` | live | #60 — backend only; Admin Analytics UI not in nav (#61) |
| (API) Operations jobs / integrations | — | `…/admin-operations/{jobs,integrations}` | live | #60 — backend only; Admin Jobs UI not in nav (#61) |
| `/settings` · `/settings/general` · `/settings/system` | `getSettings` / `updateSettings` | `…/admin-catalog/settings` | hybrid | #92 persist general/units/categories; System tab diagnostics; Security via `admin-auth` |
| `/recipes` | `listRecipes` / CRUD | `…/admin-catalog/recipes` | live | #92 |
| `/collections` | `listCollections` | `…/admin-catalog/collections` | live | #92 — `isPublic` always false (no public collections column) |
| `/ingredients` | ingredients CRUD | `…/admin-catalog/ingredients` | live | #92 — Admin creates `is_system` rows |
| `/grocery` | grocery users/items | `…/admin-catalog/grocery/*` | live | #92 — read-only |
| `/meal-plans` | `listMealPlans` | `…/admin-catalog/meal-plans` | live | #92 — folded by date; multiple users joined with ` · ` |
| `/pantry` | `listPantry` | `…/admin-catalog/pantry` | live | #92 — freshness derived from expiration |
| `/categories` | taxonomy CRUD | `…/admin-catalog/taxonomy/{kind}` | live | #92 |
| `/settings/integrations` | list / get / test / secret / config | `…/admin-integrations/*` | live | #63 — Google Play Future Reserved; secrets write-only; ops also exposes `admin-operations/integrations` (#60) |
| (future) AI Platform / AI Import / Payments UI / Analytics UI / Ops UI | — | backends may exist | planned | Stay out of Admin nav until Gate allows (#61) |
| Store Analytics / Financial sync | status / runs / sync / credentials | `…/admin-store-sync/*` | live | #59 — Google Play Future Reserved; not an Admin nav module |
| Ops Jobs + Dashboard aggregation | jobs / integrations / analytics | `…/admin-operations/*` · `admin-analytics` · `admin-dashboard` | live | #60 / #47 — APIs live; dedicated Admin pages not shipped |

## Live Edge Functions (inventory)

| Function | `verify_jwt` | Purpose |
|----------|--------------|---------|
| `admin-auth` | false | Login / logout / session / change-password |
| `admin-catalog` | false | Existing Data-page APIs: recipes/collections/ingredients/grocery/meal-plans/pantry/taxonomy/settings (#92) |
| `admin-users` | false | User list, detail, registration mix stats |
| `admin-dashboard` | false | Ops KPI aggregation (#60 source/freshness; prefers #58/#59 tables) |
| `admin-analytics` | false | Analytics aggregation (#60) |
| `admin-operations` | false | Jobs & Syncs + Integrations status (#60) |
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
