# Payments & Commerce (payment_transactions)

Issue: [#58](https://github.com/natefox2017/cookapp/issues/58) · Parent [#49](https://github.com/natefox2017/cookapp/issues/49)  
Notion: [Analytics, Payments & User Intelligence](https://app.notion.com/p/3dfe1df1f5a78110bc5ffcbb82cde0c9)

## Goal

Normalize commerce without treating RevenueCat webhook amounts as final financial truth.

| Object | Role |
|--------|------|
| `purchase_events` | Raw RC operational event log (unchanged) |
| `subscriptions` | Current entitlement state (unchanged) |
| `payment_transactions` | Normalized transaction facts (idempotent upsert) |
| `user_commerce_summary` | **Derived-only** view — not a writeable fact source |

`final_proceeds` is **never** set from RevenueCat. Settled proceeds come from financial reports (#59).

## Idempotency

Unique key: `(provider_source, provider_event_id)`.

RevenueCat webhook → `upsert_subscription_from_revenuecat` → also calls `upsert_payment_transaction`.

Replay of the same `event.id`:

1. `purchase_events.rc_event_id` unique → insert skipped
2. `payment_transactions` upserts on `(revenuecat, event.id)` → no duplicate row
3. Subscription mutation skipped when duplicate / stale `event_timestamp_ms`

## RevenueCat → payment_transactions mapping

| RC event field | Column | Notes |
|----------------|--------|-------|
| `id` | `provider_event_id` | Idempotency key; `provider_source = revenuecat` |
| `type` | `event_type` / drives `status` | See status map below |
| `app_user_id` (UUID) | `user_id` | Must resolve to CookApp auth user |
| `product_id` | `product_id` | |
| `entitlement_ids[0]` | `entitlement_id` | |
| `store` | `store` + `platform` | `APP_STORE` → `app_store`/`ios`; `PLAY_STORE` → `google_play`/`android` |
| `environment` | `environment` | `sandbox` \| `production` |
| `purchased_at_ms` | `purchase_at` | |
| `expiration_at_ms` | `expires_at` | |
| `transaction_id` | `transaction_id` | Apple-oriented when present |
| `original_transaction_id` | `original_transaction_id` | |
| `currency` | `currency` | Original currency — never overwritten by FX |
| `price_in_purchased_currency` | `gross_amount` | **Estimated** operational amount |
| `price` | `estimated_gross_usd` | Analytic USD from RC; not settled proceeds |
| `country_code` | `territory` | Store territory when RC provides it |
| — | `estimated_proceeds` | Left null (RC does not give reliable proceeds) |
| — | `final_proceeds` | Always null from RC path |
| — | `order_id` / `purchase_token` | **Google reserved** — null until Play provider |

### Event type → status

| RC `type` | `status` |
|-----------|----------|
| `INITIAL_PURCHASE`, `RENEWAL`, `PRODUCT_CHANGE`, `UNCANCELLATION`, `NON_RENEWING_PURCHASE`, … | `active` |
| `CANCELLATION` | `cancelled` (or `refunded` if `cancellation_reason` is `REFUND` / `CUSTOMER_SUPPORT`) |
| `EXPIRATION` | `expired` |
| `BILLING_ISSUE` | `billing_issue` |

`RENEWAL` also sets `renewal_at = purchase_at`. Refund cancellations set `refund_at` + `refund_amount`.

## Google Play (Future Reserved)

- Enums include `platform=android`, `store=google_play`, columns `order_id`, `purchase_token`.
- `CommerceProvider` stub: `googlePlayCommerceProvider.status = reserved_not_implemented`.
- **No** live sync, credentials, jobs, or fake Android revenue rows in Admin.

Admin list responses include:

```json
"googlePlay": { "status": "reserved_not_implemented", "note": "…" }
```

`purchase_token` is never returned in full — detail API exposes `purchaseTokenMasked` only.

## Admin APIs

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/functions/v1/admin-subscriptions/transactions` | Paginated list (+ filters) |
| `GET` | `/functions/v1/admin-subscriptions/transactions/{id}` | Detail (+ masked token) |
| `GET` | `/functions/v1/admin-users/{id}` | Includes `commerceSummary` from `user_commerce_summary` + timeline from `payment_transactions` |

User detail **must not** recompute spend totals ad-hoc from `purchase_events` — aggregates come only from `user_commerce_summary`.

## Tests

```bash
deno test --allow-env supabase/functions/_shared/commerce/
```

## Out of scope (#59 / #60)

- `store_analytics_daily`, `financial_report_rows`, `store_sync_runs`
- App Store Connect / Financial report sync
- Dashboard aggregation / jobs center
