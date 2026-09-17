# Auth + IAP setup (CookApp)

**人工要填的配置请统一写到：[`docs/OWNER_CONFIG.md`](OWNER_CONFIG.md)**  
本页只保留流程说明；不要在多个文档分散填密钥。

Supabase project: `cookapp` / `semsjyrqjnumpvanibip`  
URL: `https://semsjyrqjnumpvanibip.supabase.co`

## Flows（已实现）

### Apple

原生 ASAuthorization → `supabase.auth.signInWithIdToken`（raw nonce）。不存第三方 Token。

### Google

`supabase.auth.signInWithOAuth` + redirect `cookapp://auth-callback`。

### IAP

```
Sign in
  → RevenueCat.logIn(supabaseUserId)
  → purchase / restore (StoreKit via RC)
  → RC validates with Apple
  → webhook → Supabase subscriptions + purchase_events
  → app refreshes serverSubscription
```

Entitlement id：`pro`  
Webhook：`https://semsjyrqjnumpvanibip.supabase.co/functions/v1/revenuecat-webhook`

## Tables / RPC / Function

- `subscriptions`, `purchase_events`
- RPC `upsert_subscription_from_revenuecat`
- Function `revenuecat-webhook`（Bearer secret，`verify_jwt=false`）

## Backend modules (Issue #11)

Full cloud schema, RLS, storage, OpenAPI, and Edge Functions:
[`docs/backend/README.md`](./backend/README.md).

Account delete: `POST /functions/v1/delete-account` (JWT required).
