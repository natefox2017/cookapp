# Admin API Contract Matrix

Issue: [#52](https://github.com/natefox2017/cookapp/issues/52) · Parent [#49](https://github.com/natefox2017/cookapp/issues/49)  
SoT: [Backend & Admin V2 §3 P0-B / §17](https://app.notion.com/p/3dfe1df1f5a7816b89c1fe67eded6242)  
Audited: 2026-09-18 against `main` (`admin-auth`, `admin-users`, `admin-subscriptions`, `admin-dashboard`)

## Rules

- Admin UI never calls PostgREST/`service_role` directly.
- Live Admin paths use `/functions/v1/<function>/…` on the Supabase project origin (`VITE_ADMIN_API_BASE_URL`).
- Production must not silently serve mock payloads as if live (see also #51).
- Missing domains: **Not Implemented** in Production UI — never invent fake KPI or catalog completeness.
- Full Dashboard Analytics aggregation remains **P1** (#47 correction) — do not treat provisional `admin-dashboard` KPIs as store-certified truth.

## Status legend

| Status | Meaning |
|--------|---------|
| `live` | Edge Function exists; Admin client path aligned; OpenAPI documented |
| `live (provisional)` | Function exists and returns CookApp DB aggregates; **not** Production-certified analytics until P1 store sync |
| `missing` | No Admin Edge Function; Production UI shows Not Implemented (mock allowed in local/dev only) |
| `deprecated` | Old client path `/admin/…` — must not be used |

## Matrix — Admin UI ↔ client ↔ Edge Function ↔ OpenAPI

| Admin UI route | Typed client | Live path | Edge Function | OpenAPI | Status | Production UI |
|----------------|--------------|-----------|---------------|---------|--------|---------------|
| `/login` | `auth.loginAdmin` | `POST /functions/v1/admin-auth/login` | `admin-auth` | AdminAuth | `live` | Live |
| _(session)_ | `auth.getAdminSession` | `GET /functions/v1/admin-auth/session` | `admin-auth` | AdminAuth | `live` | Live |
| _(logout)_ | `auth.logoutAdmin` | `POST /functions/v1/admin-auth/logout` | `admin-auth` | AdminAuth | `live` | Live |
| Settings → Security | `auth.changeAdminPassword` | `POST /functions/v1/admin-auth/change-password` | `admin-auth` | AdminAuth | `live` | Live |
| `/` Dashboard | `users.getDashboard` | `GET /functions/v1/admin-dashboard` | `admin-dashboard` | AdminDashboard | `live (provisional)` | Live DB counts + honesty banner; ASC/Play KPIs deferred (P1) |
| `/users` | `users.listUsers` / `getUser` / `getUserRegistrationStats` | `GET /functions/v1/admin-users` · `…/:id` · `…/stats` | `admin-users` | AdminUsers | `live` | Live |
| `/subscription` | `subscriptions.*` | `…/admin-subscriptions/{plans,records,revenue}` | `admin-subscriptions` | AdminSubscriptions | `live` | Live (Play Store Future Reserved when empty) |
| `/recipes` | `recipes.*` | — | — | — | `missing` | **Not Implemented** |
| `/collections` | `catalog.listCollections` | — | — | — | `missing` | **Not Implemented** |
| `/ingredients` | `catalog.*Ingredient*` | — | — | — | `missing` | **Not Implemented** |
| `/grocery` | `catalog.listGrocery*` | — | — | — | `missing` | **Not Implemented** |
| `/meal-plans` | `catalog.listMealPlans` | — | — | — | `missing` | **Not Implemented** |
| `/pantry` | `catalog.listPantry` | — | — | — | `missing` | **Not Implemented** |
| `/categories` | `catalog.*Taxonomy*` | — | — | — | `missing` | **Not Implemented** |
| `/settings` (General / Units / Categories) | `catalog.getSettings` / `updateSettings` | — | — | — | `missing` | **Not Implemented** (persisted settings) |
| `/settings` (System) | client env diagnostics | _(local)_ | — | — | `live` (client-only) | Shows `VITE_*` diagnostics only |

## Deprecated client paths (do not use)

| Deprecated | Replacement |
|------------|-------------|
| `GET /admin/dashboard` | `GET /functions/v1/admin-dashboard` |
| `GET /admin/users` · `/admin/users/:id` | `GET /functions/v1/admin-users` · `…/:id` |
| `GET /admin/recipes` (+ CRUD) | _none yet_ → Not Implemented |
| `/admin/collections`, `/admin/ingredients`, `/admin/grocery/*`, `/admin/meal-plans`, `/admin/pantry`, `/admin/categories/*`, `/admin/settings` | _none yet_ → Not Implemented |

## Live Edge Functions (non-Admin, for completeness)

| Function | Path | Notes |
|----------|------|-------|
| `health` | `GET /functions/v1/health` | Module probe |
| `openapi` | `GET /functions/v1/openapi` | Serves OpenAPI JSON |
| `delete-account` | `POST /functions/v1/delete-account` | End-user JWT |
| `revenuecat-webhook` | `POST /functions/v1/revenuecat-webhook` | Webhook secret |

## Auth / envelope conventions

| Concern | Contract |
|---------|----------|
| Auth | `Authorization: Bearer <admin_session_token>` (`AdminBearer`) — not end-user Supabase JWT |
| Error | `{ "error": { "code", "message", "details" } }` |
| Pagination | `page`, `pageSize`, response `{ data, total, page, pageSize }` (Users list) |
| Request id | Optional `X-Request-Id` request header; echoed on Admin Function responses |

## Dashboard / #47 dependency

- `admin-dashboard` aggregates **CookApp DB** (`profiles`, `recipes`, `collections`, `subscriptions`, `purchase_events`, `app_download_stats`).
- App Store Connect Analytics sync and Google Play are **not** wired — Android downloads/revenue must not be presented as live store truth.
- Full Production Dashboard redesign per Notion §15 waits for P1 Analytics/Payments APIs (#47). This audit does **not** invent fake store KPIs.

## Coordination

- #51 (production mock / default-credential hardening) may extend `admin-auth` (bootstrap, roles) and AdminAuth OpenAPI — rebase if both land.
- Future Admin Recipes / Import / AI Platform / Settings APIs get new functions + OpenAPI rows in this matrix when implemented.
