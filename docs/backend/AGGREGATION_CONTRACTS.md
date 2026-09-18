# Aggregation + Commerce/Analytics Contracts (Issue #60)

Parent: [#49](https://github.com/natefox2017/cookapp/issues/49) · Implements Backend side of [#47](https://github.com/natefox2017/cookapp/issues/47)  
Coordinates with [#58](https://github.com/natefox2017/cookapp/issues/58) / [#59](https://github.com/natefox2017/cookapp/issues/59).

## Rules

1. **Real tables only** — never invent KPI series or fill missing Apple data with `0`.
2. Every KPI exposes `source`, `freshness`, and `availability`.
3. **Google Play = Future Reserved** — hide or return `future_reserved` / `not_connected`. Never fake Android zeros.
4. Analytics vs Financial vs RevenueCat must **not** be silently merged into one “final revenue” field.
5. If #58/#59 schemas are not merged yet, aggregation **probes** tables and returns `schema_pending` / falls back to documented interim sources.

## Tables owned by this issue (#60)

| Object | Role |
|--------|------|
| `operational_jobs` | Unified run ledger (cleanup, ASC sync stubs, RC/AI health, refused Play) |
| `operational_job_type_registry` | Catalog (extended) |
| `v_operational_jobs` | Union of `operational_jobs` + mapped `recipe_import_jobs` |
| `integration_connection_status` | Cached Integrations status (no secrets) |

## Contracts consumed from #58 (not created here)

### `payment_transactions` (expected)

Idempotent normalized commerce fact. Aggregation prefers this over raw `purchase_events` amounts when present.

Minimum columns used by aggregation:

| Column | Notes |
|--------|-------|
| `id` | uuid |
| `user_id` | nullable if unlinked |
| `platform` | `ios` \| `android` |
| `store` | `app_store` \| `google_play` |
| `event_type` | purchase / renewal / refund / … |
| `status` | |
| `gross_amount` | numeric |
| `refund_amount` | numeric |
| `currency` | |
| `estimated_proceeds` | optional |
| `final_proceeds` | only after financial confirmation |
| `provider_source` | e.g. `revenuecat` |
| `purchase_at` / `created_at` | freshness |

### `user_commerce_summary` (expected view)

Derived only — never a second fact source. Aggregation may read LTV-style rollups when present.

## Contracts consumed from #59 (not created here)

### `store_analytics_daily`

Shipped in #59 (`20260918120000_store_analytics_financial.sql`).

| Column | Notes |
|--------|-------|
| `metric_date` | date |
| `platform` | `ios` \| `android` |
| `store` | `app_store` \| `google_play` |
| `territory` | Apple meaning only |
| `metric_key` | e.g. `first_time_downloads`, `total_downloads` |
| `metric_value` | numeric **nullable** — missing ≠ 0 |
| `provider_source` | `app_store_connect_analytics` \| … |
| `synced_at` | freshness |

### `financial_report_rows`

Final proceeds / reconciliation (#59). **Never** summed into the same KPI as RevenueCat estimated gross.

### `store_sync_runs`

Provider sync cursor/status (#59). Included in `v_operational_jobs` union.

## Interim sources (when #58/#59 pending)

| KPI | Interim source | Label |
|-----|----------------|-------|
| New / total users | `profiles` | `cookapp_db` |
| Active paid | `subscriptions` | `cookapp_db` + `revenuecat` entitlement mirror |
| Estimated revenue (Apple) | `purchase_events` paid types, `store=app_store` | `revenuecat_webhook` · `estimated` |
| Downloads (iOS) | `app_download_stats` where `platform=ios` and `source != 'seed'` | `app_download_stats` |
| Downloads seed-only | — | `availability: no_data` (seed is demo, not production truth) |
| Android / Play KPIs | — | `availability: future_reserved` |
| Import success | `recipe_import_jobs` | `cookapp_db` |
| AI usage | `ai_usage_events` | `ai_platform` |

## Availability enum

| Value | Meaning |
|-------|---------|
| `available` | Real rows from a named source |
| `estimated` | Real rows but not final financial truth |
| `no_data` | Source connected / table present but empty (not filled with 0) |
| `not_configured` | Integration keys missing |
| `schema_pending` | Expected #58/#59 table not migrated yet |
| `future_reserved` | Google Play / Android |

## Admin APIs

| Path | Function |
|------|----------|
| `GET /functions/v1/admin-dashboard` | Dashboard KPIs + legacy shape + `kpis[]` meta |
| `GET /functions/v1/admin-analytics` | Analytics slice (downloads / growth / import quality) |
| `GET /functions/v1/admin-operations/jobs` | Unified jobs list |
| `GET /functions/v1/admin-operations/jobs/{id}` | Inspect |
| `POST /functions/v1/admin-operations/jobs/{id}/retry` | Retry failed (permissioned) |
| `POST /functions/v1/admin-operations/jobs/run` | Manual run by `jobType` |
| `GET /functions/v1/admin-operations/integrations` | Integrations status |
| `POST /functions/v1/admin-operations/integrations/{key}/check` | Re-probe (no secret leakage) |
