# Cloud Backend Spec Compliance

Audit against the Cloud Backend Development Specification (Issue #11)  
plus Notion Backend/Admin V2 review (2026-09-18).

Last reviewed: 2026-09-18T10:45Z against `main` (`fc8a354`) + live project `semsjyrqjnumpvanibip`.

## Verdict

**Phase 1 core cloud modules: PASS.**  
**Backend V2 P0/P1 child Issues (#51–#60, #63–#64): CLOSED on `main`.**  
**Backend/Admin overall: Foundation Complete / V2 backends landed; Gate-released Admin ops pages in #101**  
(Notion: [Backend & Admin V2](https://app.notion.com/p/3dfe1df1f5a7816b89c1fe67eded6242) · Master [#49](https://github.com/natefox2017/cookapp/issues/49) · Ops UI [#101](https://github.com/natefox2017/cookapp/issues/101)).

| Module | Verdict | Notes |
|--------|---------|-------|
| Auth (Apple/Google/session/refresh/logout/delete) | PASS | Client SDK + `delete-account`; no third-party tokens stored |
| User profile fields + GET/UPDATE/DELETE | PASS | `profiles.*`; DELETE via Edge Function; `email` client-read-only |
| Recipe CRUD + nested ingredient/step/nutrition | PASS | jsonb shapes documented; nested keys not DB-enforced (flexible) |
| Collection + membership | PASS | Junction has SELECT/INSERT/DELETE (no UPDATE needed) |
| Ingredient catalog | PASS | Schema + RLS; empty until system/user rows are added |
| Grocery lists + items | PASS | Full RLS CRUD |
| Meal Plan | PASS | Spec `date` → column `plan_date` |
| Pantry | PASS | |
| Categories (10/6/5 seeds) | PASS | Live counts match |
| Storage private + isolation | PASS | `avatars`, `recipe-covers`, `recipe-images`; + `recipe-import-artifacts` (service_role / TTL, #54) |
| Subscription + RevenueCat webhook | PASS | `plan`/`status`; `expire_date` via `subscription_status` view; `payment_transactions` + `user_commerce_summary` (#58) |
| Security (RLS, JWT, secrets, service_role) | PASS | Advisors clean after hardening |
| Engineering (migrations, OpenAPI, errors, logging) | PASS | OpenAPI yaml ↔ json ↔ Edge `spec.json` synced (76 paths) |
| No Admin Dashboard in cloud service code | PASS* | `admin/` is Local Admin Dashboard (Notion §21); separate UI |
| Admin live API contract | PASS† | Matrix: [`ADMIN_API_CONTRACT.md`](./ADMIN_API_CONTRACT.md) (#52). Live domains match Edge Functions; catalog Data pages stay `501` / mock_only |
| Production mock / default credentials | PASS | #51 / PR #62 + bootstrap-token follow-up #65 |
| AI Platform | PASS | #53 — `admin-ai`; Admin Settings → AI Platform UI (#101) |
| MediaStorageProvider + import artifacts | PASS | #54 |
| AI Recipe Import pipeline + queue | PASS | #55/#56 — `admin-recipe-import` + worker; Admin Import / Review UI (#101) |
| Admin audit + correlation IDs | PASS | #57 |
| Payments normalize + commerce summary | PASS | #58 — APIs live; Admin Payments page (#101) |
| App Store analytics + financial sync | PASS (backend) | #59 — Google Play Future Reserved |
| Ops jobs + Dashboard aggregation | PASS | #60/#47 — `admin-operations` / `admin-analytics` / `admin-dashboard`; Analytics + Operations pages (#101) |
| Integrations connection status | PASS | #63 — Settings → Integrations |
| Admin navigation IA (§14) | PARTIAL | #101 ships released ops pages (grouped Recipes/Commerce). Full #64 placeholder IA stays rolled back; personal surfaces remain out of Admin nav (#98) |

\* Spec forbids mixing Admin UI into Supabase server code. Local Admin lives under `admin/` and talks via typed API layer — not embedded in Edge Functions.  
† Catalog Admin APIs (Recipes/Collections/…) remain missing by design until a future Issue; live mode must not fake them.

## Field aliases (documented, not bugs)

| Spec | Implementation |
|------|----------------|
| MealPlan.`date` | `meal_plans.plan_date` |
| Subscription.`expire_date` | column `subscriptions.expires_at`; view `subscription_status.expire_date` |
| Subscription.`plan` | column `subscriptions.plan` (from entitlement) |

## API surface

Primary: PostgREST `/rest/v1/*` with JWT + anon key.  
Privileged: `/functions/v1/delete-account`, `/functions/v1/revenuecat-webhook`.  
Admin (custom bearer): see live inventory in [`ADMIN_API_CONTRACT.md`](./ADMIN_API_CONTRACT.md)  
(`admin-auth`, `admin-users`, `admin-dashboard`, `admin-subscriptions`, `admin-ai`, `admin-integrations`, `admin-operations`, `admin-analytics`, `admin-store-sync`, `admin-recipe-import`, workers).  
Contract: `supabase/openapi/openapi.yaml` (served by `/functions/v1/openapi`).

## Explicit non-goals / Gate holds

- Nested jsonb schema validation for recipe ingredients/steps (app-layer concern)
- System ingredient seed catalog content
- Auto-create default grocery list on signup (client can `POST /grocery_lists`)
- Moving `admin/` to a separate git repository (product/repo layout decision)
- Full #64 hierarchical placeholder IA (unshipped modules such as Audit Log / Products)
- Google Play live integration (Future Reserved)
- Android client / iOS business UI

## How to re-verify

```bash
# OpenAPI representations (yaml ↔ openapi.json ↔ Edge Function spec.json)
python3 -c "import json,yaml,pathlib; s=yaml.safe_load(pathlib.Path('supabase/openapi/openapi.yaml').read_text()); assert json.loads(pathlib.Path('supabase/openapi/openapi.json').read_text())==s; assert json.loads(pathlib.Path('supabase/functions/openapi/spec.json').read_text())==s"

# Live OpenAPI
curl -sS https://semsjyrqjnumpvanibip.supabase.co/functions/v1/openapi | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['info']['title'], len(d['paths']))"
```
