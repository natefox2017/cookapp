# Admin API Contract Matrix

Issue: [#52](https://github.com/natefox2017/cookapp/issues/52) · Parent [#49](https://github.com/natefox2017/cookapp/issues/49)  
Notion: [Backend & Admin V2 §3 P0-B / §17](https://app.notion.com/p/3dfe1df1f5a7816b89c1fe67eded6242)  
Audited against `main` + live Edge Functions on `semsjyrqjnumpvanibip` (2026-09-18).

## Rules

1. Admin typed client live paths must match `/functions/v1/<function>/…` (never invent `/admin/…` REST unless an Edge Function exists).
2. Production / live mode must **not** silently serve mock KPI or catalog data.
3. Domains without a live Admin API throw explicit `501 not_implemented` in the Admin client (UI shows pending — not “empty success”).
4. Every **live** Admin endpoint is documented in `supabase/openapi/openapi.yaml`.
5. Mock mode (`VITE_ADMIN_USE_MOCK=true`) is local/dev only — see #51 production hardening.

## Status legend

| Status | Meaning |
|--------|---------|
| **live** | Edge Function deployed; Admin client uses `/functions/v1/…` |
| **missing** | No Admin Edge Function; live client returns `501`; mock-only UI |
| **hybrid** | Partial live (e.g. Settings Security via `admin-auth`; general settings not persisted live) |
| **planned** | Confirmed in Notion V2; tracked under #49 children |

## Matrix

| Admin UI route | Client API | Live path | Status | Notes |
|----------------|------------|-----------|--------|-------|
| `/login` | `login` | `POST /functions/v1/admin-auth/login` | live | Custom admin bearer |
| (auth) | `logout` | `POST /functions/v1/admin-auth/logout` | live | |
| (auth) | `getSession` | `GET /functions/v1/admin-auth/session` | live | |
| Settings → Security | `changePassword` | `POST /functions/v1/admin-auth/change-password` | live | |
| `/` Dashboard | `getDashboard` | `GET /functions/v1/admin-dashboard` | live | Aggregation; Google Play must not fake zeros (#47/#49) |
| `/users` | `listUsers` / `getUser` / `getUserRegistrationStats` | `GET /functions/v1/admin-users` · `…/:id` · `…/stats` | live | #44 |
| `/subscription` | plans / records / revenue | `…/admin-subscriptions/{plans,records,revenue}` | live | #35 |
| `/settings` General/Units/Categories | `getSettings` / `updateSettings` | — | hybrid | Live: build-time diagnostics only; no persist API. Security uses `admin-auth` |
| `/recipes` | `listRecipes` / CRUD | — | missing | Planned: Admin Recipes + AI Import (#55) |
| `/collections` | `listCollections` | — | missing | Planned Admin Data APIs |
| `/ingredients` | ingredients CRUD | — | missing | |
| `/grocery` | grocery users/items | — | missing | |
| `/meal-plans` | `listMealPlans` | — | missing | |
| `/pantry` | `listPantry` | — | missing | |
| `/categories` | taxonomy CRUD | — | missing | End-user category tables exist via PostgREST; no Admin ops API yet |
| (future) AI Platform | — | — | planned | #53 |
| (future) AI Import | — | — | planned | #55 |
| (future) Audit Log | — | — | planned | #57 |
| (future) Payments / Analytics sync | — | — | planned | #58/#59/#60 |

## Live Edge Functions (inventory)

| Function | `verify_jwt` | Purpose |
|----------|--------------|---------|
| `admin-auth` | false | Login / logout / session / change-password |
| `admin-users` | false | User list, detail, registration mix stats |
| `admin-dashboard` | false | Ops KPI aggregation |
| `admin-subscriptions` | false | Plans CRUD, subscription records, revenue series |
| `openapi` | false | Serves OpenAPI JSON |
| `health` | true | Module probe (end-user JWT) |
| `delete-account` | true | End-user account purge |
| `revenuecat-webhook` | false | IAP webhook |

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
