# Admin API Contract Matrix

Issue: [#52](https://github.com/natefox2017/cookapp/issues/52) · Parent [#49](https://github.com/natefox2017/cookapp/issues/49)  
Notion: [Backend & Admin V2 §3 P0-B / §17](https://app.notion.com/p/3dfe1df1f5a7816b89c1fe67eded6242)  
Nav scope: Issue [#101](https://github.com/natefox2017/cookapp/issues/101) Gate-released operational pages (AI Import, AI Platform, Analytics, Operations, Payments). Personal surfaces stay out of Admin nav ([#98](https://github.com/natefox2017/cookapp/issues/98)).  
Audited against `main` + live Edge Functions on `semsjyrqjnumpvanibip` (2026-09-18).

## Rules

1. Admin typed client live paths must match `/functions/v1/<function>/…` (never invent `/admin/…` REST unless an Edge Function exists).
2. Production / live mode must **not** silently serve mock KPI or catalog data.
3. Domains without a live Admin API throw explicit `501 not_implemented` in the Admin client (UI shows pending — not “empty success”). Live pending pages **hide write buttons** and diagnostics-only Settings fields are **read-only** (`writeCapability`). `writeCapability` allows writes when mock mode is on **or** the typed client already calls `/functions/v1/admin-catalog` for that domain (merge-safe with live catalog #93). Settings **System** stays live diagnostics even when general/units/categories persist.
4. Admin **nav / formal routes** expose Gate-released operational modules plus existing catalog/ops pages. Future / personal-surface modules stay in Notion / Issues — not as navigable placeholders. Audit log remains unshipped (`/operations/audit-log` redirects to Jobs).
5. Every **live** Admin endpoint is documented in `supabase/openapi/openapi.yaml`.
6. Mock mode (`VITE_ADMIN_USE_MOCK=true`) is local/dev only — see #51 production hardening.

## Status legend

| Status | Meaning |
|--------|---------|
| **live** | Edge Function deployed; Admin client uses `/functions/v1/…` |
| **missing** | No Admin Edge Function; live client returns `501`; mock-only UI |
| **hybrid** | Partial live (e.g. Settings Security via `admin-auth`; general settings not persisted live) |
| **planned** | Confirmed in Notion V2; tracked under #49 children — **not** exposed as Admin nav until Gate allows |

## Navigation (Gate-released ops)

Shared source: `admin/src/components/layout/nav.ts` (grouped Recipes / Commerce; no per-page forks).

| Nav | Route | UI | API status |
|-----|-------|----|------------|
| Dashboard | `/` | live | live |
| Users | `/users` | live | live |
| Recipes | `/recipes` | mock UI | missing |
| Recipes → AI Import | `/recipes/import` | live | live (#101 / `admin-recipe-import`) |
| Recipes → Import Review | `/recipes/import-review` | live | live (#101 / `admin-recipe-import`) |
| Ingredients | `/ingredients` | mock UI | missing |
| Categories | `/categories` | mock UI | missing |
| Commerce → Subscription | `/subscription` | live | live |
| Commerce → Payments | `/commerce/payments` | live | live (#58 / #101) |
| Analytics | `/analytics` | live | live (#60 / #101) |
| Operations | `/operations/jobs` | live | live (#60 / #101) |
| Settings | `/settings` → `/settings/general` | hybrid tabs | hybrid |
| Settings → Integrations | `/settings/integrations` | live (`IntegrationsPanel`) | live (#63) |
| Settings → AI Platform | `/settings/ai-platform` | live (`AiPlatformPanel`) | live (#53 / #101) |

End-user personal surfaces are **not** Admin nav (Meal Plan, Grocery, Pantry, Collections). Typed clients may still exist for contract / live catalog merge; routes redirect to Dashboard.

Compatibility redirects (no dead links after #64 rollback): `/commerce/products` → `/subscription`; `/data/ingredients` · `/data/categories` → flat counterparts; `/collections` · `/grocery` · `/meal-plans` · `/pantry` · `/data/collections` · `/data/grocery` · `/data/meal-plans` · `/data/pantry` → `/`; `/operations/audit-log` → `/operations/jobs`; unknown `/settings/:section` → `/settings/general`.

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
| `/commerce/payments` | `listPaymentTransactions` | `…/admin-subscriptions/transactions` · `…/transactions/:id` | live | #58 / #101 — RC amounts ≠ final financial truth; Google Play Future Reserved |
| `/analytics` | `getAnalytics` | `GET /functions/v1/admin-analytics` | live | #60 / #101 |
| `/operations/jobs` | `listOpsJobs` / `runOpsJob` / `retryOpsJob` | `…/admin-operations/{jobs,integrations}` | live | #60 / #101 |
| `/settings` · `/settings/general` · `/settings/system` | `getSettings` / `updateSettings` | — | hybrid | Live: General/Units/Categories persist when the client calls `admin-catalog`; otherwise diagnostics **read-only**. System stays diagnostics. Security / Integrations / AI Platform stay writable |
| `/recipes` | `listRecipes` / CRUD | — | missing | Live writes hidden until the typed client calls `admin-catalog` (#61 `writeCapability`; #93/#100 flips this automatically) |
| (no nav) Collections | `listCollections` | — | missing | End-user collections — not an Admin page; old `/collections` redirects to Dashboard |
| `/ingredients` | ingredients CRUD | — | missing | Live writes hidden until `admin-catalog` client lands (#61 `writeCapability`) |
| (no nav) Grocery | grocery users/items | — | missing | End-user grocery lists — not an Admin page |
| (no nav) Meal Plans | `listMealPlans` | — | missing | End-user meal plans — not an Admin page |
| (no nav) Pantry | `listPantry` | — | missing | End-user pantry — not an Admin page |
| `/categories` | taxonomy CRUD | — | missing | Live writes hidden until `admin-catalog` client lands (#61 `writeCapability`). End-user category tables exist via PostgREST |
| `/settings/integrations` | list / get / test / secret / config | `…/admin-integrations/*` | live | #63 — Google Play Future Reserved; secrets write-only; ops also exposes `admin-operations/integrations` (#60) |
| `/settings/ai-platform` | providers / models / routes / usage / health | `…/admin-ai/*` | live | #53 / #101 — secrets write-only; never returned to the browser |
| `/recipes/import` · `/recipes/import-review` | import jobs / enqueue / review actions | `…/admin-recipe-import/jobs*` | live | #55/#56 / #101 |
| Store Analytics / Financial sync | status / runs / sync / credentials | `…/admin-store-sync/*` | live | #59 — Google Play Future Reserved; not an Admin nav module |
| Ops Jobs + Dashboard aggregation | jobs / integrations / analytics | `…/admin-operations/*` · `admin-analytics` · `admin-dashboard` | live | #60 / #47 / #101 — APIs + Admin pages shipped |

## Live Edge Functions (inventory)

| Function | `verify_jwt` | Purpose |
|----------|--------------|---------|
| `admin-auth` | false | Login / logout / session / change-password |
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
