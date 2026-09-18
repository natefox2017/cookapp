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
| Files | Private Storage buckets via `MediaStorageProvider` (Supabase); `{user_id}/…` for user media; `{job_id}/…` for import artifacts |
| Subscriptions | RevenueCat webhook → `subscriptions` / `purchase_events` / `payment_transactions` |
| Admin ops | Custom bearer Edge Functions (`admin-auth`, `admin-users`, `admin-dashboard`, `admin-subscriptions`, `admin-catalog`, …) |

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
- **Storage** — buckets `avatars`, `recipe-covers`, `recipe-images`, `recipe-import-artifacts` (private TTL)
- **Subscription** — `subscriptions`, view `subscription_status` (`plan` / `status` / `expire_date`)
- **Commerce** — `payment_transactions` + derived view `user_commerce_summary` (#58); see [`PAYMENTS.md`](./PAYMENTS.md)

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
    _shared/           # cors, auth, errors, logger, admin-session, request-context, audit, monitor, media-storage, ai-*
    delete-account/
    revenuecat-webhook/
    health/
    openapi/
    admin-auth/
    admin-users/
    admin-dashboard/
    admin-analytics/
    admin-operations/
    admin-subscriptions/
    storage-cleanup-import-artifacts/
    admin-catalog/     # Recipes / Collections / Ingredients / Grocery / Meal Plans / Pantry / Taxonomy / Settings (#92)
    admin-ai/          # AI Platform Admin APIs (#53)
    admin-integrations/ # Integrations status (#63)
    admin-store-sync/  # ASC analytics + financial sync (#59)
    store-sync-worker/ # Cron tick for Apple store sync (#59)
    recipe-import-worker/
```

## API documentation

- OpenAPI: [`supabase/openapi/openapi.yaml`](../../supabase/openapi/openapi.yaml)
- Live JSON: `GET /functions/v1/openapi` (no JWT)
- Admin contract matrix: [`ADMIN_API_CONTRACT.md`](./ADMIN_API_CONTRACT.md)
- Auth/IAP ops: [`AUTH_AND_IAP.md`](../AUTH_AND_IAP.md)
- Media storage: [`MEDIA_STORAGE.md`](./MEDIA_STORAGE.md)
- Store analytics: [`STORE_ANALYTICS.md`](./STORE_ANALYTICS.md)
- Aggregation contracts (#60 / #58 / #59): [`AGGREGATION_CONTRACTS.md`](./AGGREGATION_CONTRACTS.md)

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
- Storage: private buckets; user media first path segment must equal `auth.uid()`; import artifacts are service_role-only
- `SUPABASE_SERVICE_ROLE_KEY` used only inside Edge Functions / webhooks — never shipped to clients
- Secrets: `REVENUECAT_WEBHOOK_SECRET`, OAuth provider secrets via Supabase Dashboard / `supabase secrets`
- `profiles.email` is read-only for clients (synced from `auth.users`)
- Authenticated Edge Functions CORS: set `CORS_ALLOWED_ORIGINS` (comma-separated); public `openapi` keeps `*`
- Subscription upserts ignore duplicate `rc_event_id` and stale `event_timestamp_ms` (purchase_events still recorded; payment_transactions upserted idempotently)

## Edge Functions

| Function | JWT | Purpose |
|----------|-----|---------|
| `delete-account` | yes | Purge storage + delete auth user |
| `revenuecat-webhook` | no (Bearer secret) | Persist subscription events |
| `health` | yes | Module probe |
| `openapi` | no | Serve OpenAPI JSON |
| `admin-auth` | no (custom admin bearer) | Admin dashboard login / logout / session / change-password (+ audit) |
| `admin-users` | no (custom admin bearer) | Users list / detail / registration stats |
| `admin-dashboard` | no (custom admin bearer) | Ops KPI aggregation (#60 source/freshness; prefers #58/#59; no fake Android) |
| `admin-analytics` | no (custom admin bearer) | Analytics aggregation (#60) |
| `admin-operations` | no (custom admin bearer) | Jobs & Syncs + Integrations status (#60) |
| `admin-catalog` | no (custom admin bearer) | Existing Admin Data pages + settings persist (#92) |
| `admin-recipe-import` | no (custom admin bearer) | Shared AI Recipe Import pipeline (#55) + enqueue (#56) |
| `storage-cleanup-import-artifacts` | no (`STORAGE_CLEANUP_SECRET`) | TTL cleanup for `recipe-import-artifacts` |
| `admin-ai` | no (custom admin bearer; Owner for writes/secrets) | AI Platform providers / models / routes / usage / health |
| `admin-integrations` | no (custom admin bearer; Owner for secret/config writes) | Integrations connection status / test / write-only secrets (#63) |
| `admin-store-sync` | no (custom admin bearer; Owner for sync/credentials) | ASC analytics + financial sync (#59) |
| `recipe-import-worker` | no (`RECIPE_IMPORT_WORKER_SECRET`) | pgmq Import Queue worker tick (#56) |
| `store-sync-worker` | no (`STORE_SYNC_WORKER_SECRET`) | Apple analytics + financial cron tick (#59) |

### Admin auth

- Tables: `admin_accounts`, `admin_sessions` (service_role only; no client RLS policies)
- Default seed `admin`/`admin` is **local/dev only** — production hardening: [#51](https://github.com/natefox2017/cookapp/issues/51)
- Endpoints under `/functions/v1/admin-auth/{login,logout,session,change-password}`

### Admin subscriptions

- Table: `subscription_plans` (Apple / Android SKUs, price, billing period)
- Endpoints under `/functions/v1/admin-subscriptions/{plans,records,revenue,transactions}`
- Records/revenue read `subscriptions` + `purchase_events` (RevenueCat webhook)
- Transactions read normalized `payment_transactions` (#58)
- Google Play: Future Reserved — do not display mock Android revenue as live ops data

### Payments / commerce (Issue #58)

- Tables/views: `payment_transactions`, `user_commerce_summary` (derived only)
- Mapping + rules: [`PAYMENTS.md`](./PAYMENTS.md)
- Shared modules: `_shared/commerce/` (provider enums + RC map; Google Play reserved stub)
```bash
deno test --allow-env supabase/functions/_shared/commerce/
```

### Admin Recipe Import (Issue #55)

Shared Backend pipeline for Admin + future iOS (single pipeline — no Admin-only parser):
`SourceResolver → ContentExtractor → Media/TextNormalizer → RecipeAIParser(route_key) → SchemaValidator → RecipeQualityValidator → DuplicateDetector → RecipeImporter`
- Tables: `recipe_import_jobs`, `recipe_import_batches`, `recipe_import_results`, `recipe_import_artifacts`
- Bucket: `recipe-import-artifacts` (private; accessed via `MediaStorageProvider` — #54)
- AI via `AIRouter` (`route_key` only — #53); never a second AI client / hardcoded Storage URL
- Deterministic schema.org/JSON-LD extract before AI; anti-hallucination (missing→null, inferred flagged)
- Exact active source URL → HTTP 409 / job status `duplicate`
- Endpoints under `/functions/v1/admin-recipe-import/{jobs,batches,…}`
- Async queue: **Supabase Queues (pgmq)** + `recipe-import-worker` — see [`IMPORT_QUEUE.md`](./IMPORT_QUEUE.md) (#56)
```bash
deno test --allow-env supabase/functions/_shared/recipe-import/
```

### Import Queue / Worker (Issue #56)

- Queue: Supabase Queues / `pgmq` queue `recipe_import` (Apache-2.0)
- Abstraction: `_shared/recipe-import/queue.ts` (`ImportQueue` / `PgmqImportQueue`)
- Worker: `recipe-import-worker` (Bearer `RECIPE_IMPORT_WORKER_SECRET`)
- Runtime knobs in `runtime_config` (concurrency / VT / max attempts / confidence) — not secrets
- Batch + retry enqueue immediately; worker calls shared `runImportPipeline` from #55
```bash
deno test --allow-env supabase/functions/_shared/recipe-import/queue_test.ts
```
### Operations / Aggregation (Issue #60)

- Tables: `operational_jobs`, `integration_connection_status`; view `v_operational_jobs`
- Contracts for #58/#59: [`AGGREGATION_CONTRACTS.md`](./AGGREGATION_CONTRACTS.md)
- Dashboard / Analytics prefer `payment_transactions` + `store_analytics_daily` when present; otherwise honest interim sources
- Google Play: Future Reserved — never fake zeros / Operational
- Endpoints: `/functions/v1/admin-dashboard`, `/admin-analytics`, `/admin-operations/{jobs,integrations}`
```bash
deno test --allow-env supabase/functions/_shared/operations/
```

### Audit log + observability (Issue #57)
- Table: `admin_audit_logs` (service_role only; secret-redacted before/after diffs)
- Shared helpers: `_shared/logger.ts` (redaction), `_shared/request-context.ts`, `_shared/audit.ts`, `_shared/monitor.ts`
- Admin APIs + RevenueCat webhook propagate `X-Request-Id` / `X-Correlation-Id` / optional `X-Job-Id`
- Error envelope: `{ error: { code, message, details }, request_id }`
- Monitoring: structured `monitor.webhook_failure` (etc.) events — **no** fake Operational status
- Redaction tests: `deno test supabase/functions/_shared/logger_test.ts`

### Admin catalog / Data pages (Issue #92)

Existing Admin nav pages (not Gate-deferred IA): Recipes, Collections, Ingredients, Grocery, Meal Plans, Pantry, Categories, plus Settings persist.
- Function: `admin-catalog` (custom admin bearer)
- Settings: `runtime_config.admin_settings` — general/units/categories only; System tab remains diagnostics
```bash
deno test --allow-env supabase/functions/_shared/admin-catalog/
```

### Admin AI Platform (Issue #53)

- Tables: `ai_providers`, `ai_models`, `ai_routes`, `ai_usage_events`, `ai_provider_health`, `ai_secrets`
- Secret store: AES-GCM ciphertext in `ai_secrets`; master key `COOKAPP_AI_MASTER_KEY` (Edge env). No read-full-secret API.
- Shared modules: `AIRouter`, `AISecretStore`, OpenAI-compatible adapter, SSRF base_url checks, usage recorder
- Seed routes: `recipe_import_text`, `recipe_import_vision`, `recipe_quality_check` (+ reserved `assistant_*`)
- Endpoints under `/functions/v1/admin-ai/{providers,models,routes,usage,health,resolve}`
- App/Admin browser never holds provider keys or calls gateway Base URL directly

### Store Analytics + Financial (Issue #59)

- Tables: `store_analytics_daily`, `financial_report_rows`, `store_sync_runs`, `store_integrations`, `store_secrets`
- Providers: `StoreAnalyticsProvider` / `FinancialReportProvider` — Apple implemented; Google Play Future Reserved
- Rules: missing Apple data stays NULL (never fill 0); analytics vs financial never merged into one revenue field
- Endpoints: `/functions/v1/admin-store-sync/*` + cron `store-sync-worker`
- Docs: [`STORE_ANALYTICS.md`](./STORE_ANALYTICS.md)
```bash
deno test --allow-env supabase/functions/_shared/store-analytics/
```

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