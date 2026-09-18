# Store Analytics + Financial Sync

Issue: [#59](https://github.com/natefox2017/cookapp/issues/59) · Parent [#49](https://github.com/natefox2017/cookapp/issues/49)  
Notion: [Analytics / Payments](https://app.notion.com/p/3dfe1df1f5a78110bc5ffcbb82cde0c9)

## Rules

1. **Missing Apple data ≠ 0** — privacy threshold / omitted cells stay `NULL` with `data_status` ∈ `insufficient` | `not_returned`.
2. **Analytics ≠ Financial** — never merge into one “final revenue” field. Analytics → `store_analytics_daily`; proceeds → `financial_report_rows`.
3. **Google Play = Future Reserved** — interface + schema only; sync runs are `skipped_reserved`; no credentials, no fake Android series.
4. **Secrets server-side** — ASC `.p8` in `store_secrets` (AES-GCM) or Edge env; Admin APIs expose `secretConfigured` only.

## Tables

| Table | Purpose |
|-------|---------|
| `store_analytics_daily` | Daily acquisition / download metrics (estimated / aggregated) |
| `financial_report_rows` | Apple Financial Reports reconciliation rows |
| `store_sync_runs` | Unified sync job model for this domain (feeds Ops Jobs #60) |
| `store_integrations` | Connection status (Apple implementable; Google `future_reserved`) |
| `store_secrets` | Ciphertext for ASC private key |

## Providers

```
StoreAnalyticsProvider
  ├─ AppleAppStoreAnalyticsProvider   (current)
  └─ GooglePlayAnalyticsProvider      (Future Reserved)

FinancialReportProvider
  ├─ AppleAppStoreFinancialProvider   (current)
  └─ GooglePlayFinancialProvider      (Future Reserved)
```

Shared modules: `supabase/functions/_shared/store-analytics/`

## Edge Functions

| Function | Auth | Purpose |
|----------|------|---------|
| `admin-store-sync` | Admin bearer (Owner for sync/credentials) | Status, runs, query tables, manual sync, set ASC credentials |
| `store-sync-worker` | `STORE_SYNC_WORKER_SECRET` | Cron tick — Apple analytics + financial only |

### Admin paths

- `GET  /functions/v1/admin-store-sync/status`
- `GET  /functions/v1/admin-store-sync/runs`
- `GET  /functions/v1/admin-store-sync/analytics/daily`
- `GET  /functions/v1/admin-store-sync/financial/rows`
- `POST /functions/v1/admin-store-sync/analytics/sync` (Owner)
- `POST /functions/v1/admin-store-sync/financial/sync` (Owner)
- `PUT  /functions/v1/admin-store-sync/integrations/apple_app_store/credentials` (Owner)

## Owner config (non-blocking)

See [`docs/OWNER_CONFIG.md`](../OWNER_CONFIG.md):

| Secret / field | Notes |
|----------------|-------|
| `ASC_ISSUER_ID` | App Store Connect API Issuer ID |
| `ASC_KEY_ID` | Key ID |
| `ASC_PRIVATE_KEY_P8` | `.p8` PEM (prefer Admin PUT → `store_secrets`) |
| `ASC_VENDOR_NUMBER` | Required for financial reports |
| `ASC_APP_APPLE_ID` | Required for analytics report requests |
| `COOKAPP_STORE_MASTER_KEY` | 32-byte AES key (falls back to `COOKAPP_AI_MASTER_KEY`) |
| `STORE_SYNC_WORKER_SECRET` | Cron worker bearer |

Missing keys → sync status `skipped_not_configured` — **no fake KPI series**.

## Tests

```bash
deno test --allow-env supabase/functions/_shared/store-analytics/
```

## Out of scope (other issues)

- `payment_transactions` / `user_commerce_summary` → [#58](https://github.com/natefox2017/cookapp/issues/58)
- Dashboard aggregation UI / Ops Jobs center → [#60](https://github.com/natefox2017/cookapp/issues/60) / [#47](https://github.com/natefox2017/cookapp/issues/47)
