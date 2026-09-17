# Auth + IAP setup (CookApp)

Supabase project: `cookapp` / `semsjyrqjnumpvanibip`  
URL: `https://semsjyrqjnumpvanibip.supabase.co`

## 1. Apple Sign In

1. Apple Developer: enable **Sign In with Apple** for App ID `com.natefox.cookapp`.
2. Supabase Dashboard → Authentication → Providers → **Apple**:
   - Add iOS Bundle ID / Services ID to Client IDs.
3. Xcode: capability already in `CookApp.entitlements`.

Flow: native ASAuthorization → `supabase.auth.signInWithIdToken` (raw nonce). Third-party tokens are not stored.

## 2. Google Sign In

1. Google Cloud OAuth client (iOS) with bundle `com.natefox.cookapp`.
2. Supabase → Providers → **Google**: client id + secret.
3. Redirect URL allowlist includes `cookapp://auth-callback`.
4. Set `COOKAPP_GOOGLE_CLIENT_ID` in `ios/Config/Secrets.xcconfig` if needed by Google SDK later; current flow uses Supabase OAuth web session.

## 3. RevenueCat + App Store IAP

1. App Store Connect: create auto-renewable subscription products.
2. RevenueCat: app + products + entitlement id **`pro`**.
3. Put public SDK key in `COOKAPP_REVENUECAT_API_KEY`.
4. After login, app calls `Purchases.logIn(supabaseUserId)` so webhook `app_user_id` is the UUID.

## 4. Supabase IAP persistence

Tables (applied):

- `subscriptions` — current entitlement per user (RLS: select own)
- `purchase_events` — idempotent webhook event log (`rc_event_id` unique)

RPC: `upsert_subscription_from_revenuecat` (service_role only).

Webhook function: `revenuecat-webhook`

```bash
supabase secrets set REVENUECAT_WEBHOOK_SECRET='your-secret' --project-ref semsjyrqjnumpvanibip
# Deploy (verify_jwt=false — uses Bearer secret)
supabase functions deploy revenuecat-webhook --project-ref semsjyrqjnumpvanibip --no-verify-jwt
```

RevenueCat Dashboard → Integrations → Webhooks:

- URL: `https://semsjyrqjnumpvanibip.supabase.co/functions/v1/revenuecat-webhook`
- Authorization: `Bearer <same secret>`

## 5. End-to-end purchase path

```
Sign in (Apple/Google)
  → Supabase session
  → RevenueCat.logIn(user.id)
  → purchase / restore (StoreKit via RC)
  → RC validates with Apple
  → RC webhook → Supabase subscriptions + purchase_events
  → app refreshes serverSubscription (source of truth for Pro)
```

## 6. Backend modules (Issue #11)

Full cloud schema, RLS, storage, OpenAPI, and Edge Functions:
[`docs/backend/README.md`](./backend/README.md).

Account delete: `POST /functions/v1/delete-account` (JWT required).
