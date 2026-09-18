# CookApp Cloud Backend

Supabase Cloud project: `cookapp` / `semsjyrqjnumpvanibip`  
URL: `https://semsjyrqjnumpvanibip.supabase.co`  
Issue: [#11 Cloud Backend](https://github.com/natefox2017/cookapp/issues/11)  
Status: **Foundation Complete / V2 Operational Expansion Required** ([#49](https://github.com/natefox2017/cookapp/issues/49))

Server-only. No Admin Dashboard UI lives in this repository (`admin/` is the separate Local Admin app).

## Responsibilities

| Area | Implementation |
|------|----------------|
| Auth | Supabase Auth (Apple / Google) → session JWT; no third-party tokens stored |
| Data | PostgreSQL + RLS |
| API | PostgREST `/rest/v1/*` + Edge Functions `/functions/v1/*` |
| Files | Private Storage buckets with `{user_id}/…` path isolation |
| Subscriptions | RevenueCat webhook → `subscriptions` / `purchase_events` |
| Admin ops | Custom bearer Edge Functions (`admin-auth`, `admin-users`, `admin-dashboard`, `admin-subscriptions`) |

## Modules

- **Auth** — Sign in with Apple, Google, logout, session refresh (client SDK); account delete via `delete-account`
- **User** — `profiles` (GET/PATCH own row)
- **Recipe** — `recipes` CRUD
- **Collection** — `collections` + `collection_recipes`
- **Ingredient** — `ingredients` catalog (system + user-owned)
- **Grocery** — `grocery_lists` + `grocery_items`
- **Meal Plan** — `meal_plans` (`breakfast` \| `lunch` \| `dinner`)
- **Pantry** — `pantry_items`
- **Category** — `cuisines`, `meal_categories`, `tags` (seeded, read-only)
- **Storage** — buckets `avatars`, `recipe-covers`, `recipe-images` (V2: `MediaStorageProvider` + import artifacts — #54)
- **Subscription** — `subscriptions`, view `subscription_status` (`plan` / `status` / `expire_date`)

### V2 confirmed (not Phase 1 foundation)

Tracked under [#49](https://github.com/natefox2017/cookapp/issues/49): AI Platform · AI Recipe Import · Store Analytics · Payments/Financial · Jobs/Syncs · Audit/Monitoring.  
Do not treat mock Admin pages as production-complete.

## Layout

```
supabase/
  config.toml
  migrations/          # ordered SQL migrations
  openapi/             # OpenAPI 3.1 (yaml + json)
  functions/
    _shared/           # cors, auth, errors, logger, admin-session, request-context, audit, monitor
    delete-account/
    revenuecat-webhook/
    health/
    openapi/
    admin-auth/
    admin-users/
    admin-dashboard/
    admin-subscriptions/
```

## API documentation

- OpenAPI: [`supabase/openapi/openapi.yaml`](../../supabase/openapi/openapi.yaml)
- Live JSON: `GET /functions/v1/openapi` (no JWT)
- Admin contract matrix: [`ADMIN_API_CONTRACT.md`](./ADMIN_API_CONTRACT.md)
- Auth/IAP ops: [`AUTH_AND_IAP.md`](../AUTH_AND_IAP.md)

### Spec path ↔ PostgREST

| Spec | PostgREST |
|------|-----------|
| `GET /recipes` | `GET /rest/v1/recipes` |
| `GET /recipes/:id` | `GET /rest/v1/recipes?id=eq.<uuid>` |
| `POST /recipes` | `POST /rest/v1/recipes` |
| `PUT /recipes/:id` | `PATCH /rest/v1/recipes?id=eq.<uuid>` |
| `DELETE /recipes/:id` | `DELETE /rest/v1/recipes?id=eq.<uuid>` |

All REST calls require headers:

```
apikey: <SUPABASE_ANON_KEY>
Authorization: Bearer <access_token>
```

## Security

- RLS on every user-owned table (select/insert/update/delete own rows only)
- Category tables: authenticated select only
- Subscriptions: authenticated select; writes via `service_role` RPC only
- Storage: private buckets; first path segment must equal `auth.uid()`
- `SUPABASE_SERVICE_ROLE_KEY` used only inside Edge Functions / webhooks — never shipped to clients
- Secrets: `REVENUECAT_WEBHOOK_SECRET`, OAuth provider secrets via Supabase Dashboard / `supabase secrets`
- `profiles.email` is read-only for clients (synced from `auth.users`)
- Authenticated Edge Functions CORS: set `CORS_ALLOWED_ORIGINS` (comma-separated); public `openapi` keeps `*`
- Subscription upserts ignore duplicate `rc_event_id` and stale `event_timestamp_ms` (purchase_events still recorded)

## Edge Functions

| Function | JWT | Purpose |
|----------|-----|---------|
| `delete-account` | yes | Purge storage + delete auth user |
| `revenuecat-webhook` | no (Bearer secret) | Persist subscription events |
| `health` | yes | Module probe |
| `openapi` | no | Serve OpenAPI JSON |
| `admin-auth` | no (custom admin bearer) | Admin dashboard login / logout / session / change-password (+ audit) |
| `admin-users` | no (custom admin bearer) | Users list / detail / registration stats |
| `admin-dashboard` | no (custom admin bearer) | Ops KPI aggregation |
| `admin-subscriptions` | no (custom admin bearer) | Admin plan catalog / records / revenue (+ audit) |

### Admin auth

- Tables: `admin_accounts`, `admin_sessions` (service_role only; no client RLS policies)
- Default seed `admin`/`admin` is **local/dev only** — production hardening: [#51](https://github.com/natefox2017/cookapp/issues/51)
- Endpoints under `/functions/v1/admin-auth/{login,logout,session,change-password}`

### Admin subscriptions

- Table: `subscription_plans` (Apple / Android SKUs, price, billing period)
- Endpoints under `/functions/v1/admin-subscriptions/{plans,records,revenue}`
- Records/revenue read `subscriptions` + `purchase_events` (RevenueCat webhook)
- Google Play: Future Reserved — do not display mock Android revenue as live ops data

### Audit log + observability (Issue #57)

- Table: `admin_audit_logs` (service_role only; secret-redacted before/after diffs)
- Shared helpers: `_shared/logger.ts` (redaction), `_shared/request-context.ts`, `_shared/audit.ts`, `_shared/monitor.ts`
- Admin APIs + RevenueCat webhook propagate `X-Request-Id` / `X-Correlation-Id` / optional `X-Job-Id`
- Error envelope: `{ error: { code, message, details }, request_id }`
- Monitoring: structured `monitor.webhook_failure` (etc.) events — **no** fake Operational status
- Redaction tests: `deno test supabase/functions/_shared/logger_test.ts`

## Migrations

Apply in filename order under `supabase/migrations/`. Cloud apply is done via Supabase MCP / CLI against project `semsjyrqjnumpvanibip`.

## Spec compliance

Module-by-module checklist vs the Cloud Backend Development Specification:
[`COMPLIANCE.md`](./COMPLIANCE.md).  
Admin live vs mock matrix: [`ADMIN_API_CONTRACT.md`](./ADMIN_API_CONTRACT.md).

## Error shape (Edge Functions)

```json
{
  "error": {
    "code": "unauthorized",
    "message": "…",
    "details": null
  },
  "request_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

Response headers (Admin / webhook): `X-Request-Id`, `X-Correlation-Id`, optional `X-Job-Id`.