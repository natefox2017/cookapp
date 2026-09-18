# Cloud Backend Spec Compliance

Audit against the Cloud Backend Development Specification (Issue #11)  
plus Notion Backend/Admin V2 review (2026-09-18).

Last reviewed: 2026-09-18 against `main` + live project `semsjyrqjnumpvanibip`.

## Verdict

**Phase 1 core cloud modules: PASS.**  
**Backend/Admin overall: Foundation Complete / V2 Operational Expansion Required**  
(Notion: [Backend & Admin V2](https://app.notion.com/p/3dfe1df1f5a7816b89c1fe67eded6242) · Master [#49](https://github.com/natefox2017/cookapp/issues/49)).

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
| Storage private + isolation | PASS | `avatars`, `recipe-covers`, `recipe-images` |
| Subscription + RevenueCat webhook | PASS | `plan`/`status`; `expire_date` via `subscription_status` view |
| Security (RLS, JWT, secrets, service_role) | PASS | Advisors clean after hardening |
| Engineering (migrations, OpenAPI, errors, logging) | PASS | |
| No Admin Dashboard in cloud service code | PASS* | `admin/` is Local Admin Dashboard (Notion §21); separate UI |
| Admin live API contract | PARTIAL | Matrix: [`ADMIN_API_CONTRACT.md`](./ADMIN_API_CONTRACT.md) (#52). Live: auth/users/dashboard/subscriptions. Missing domains return `501` in live Admin client |
| Production mock / default credentials | IN PROGRESS | #51 / PR #62 |
| AI Platform / AI Import / Audit / Media abstraction | NOT STARTED | #53–#57 · #54 |

\* Spec forbids mixing Admin UI into Supabase server code. Local Admin lives under `admin/` and talks via typed API layer — not embedded in Edge Functions.

## Field aliases (documented, not bugs)

| Spec | Implementation |
|------|----------------|
| MealPlan.`date` | `meal_plans.plan_date` |
| Subscription.`expire_date` | column `subscriptions.expires_at`; view `subscription_status.expire_date` |
| Subscription.`plan` | column `subscriptions.plan` (from entitlement) |

## API surface

Primary: PostgREST `/rest/v1/*` with JWT + anon key.  
Privileged: `/functions/v1/delete-account`, `/functions/v1/revenuecat-webhook`.  
Admin (custom bearer): `admin-auth`, `admin-users`, `admin-dashboard`, `admin-subscriptions`.  
Contract: `supabase/openapi/openapi.yaml` (served by `/functions/v1/openapi`).  
Admin path matrix: [`ADMIN_API_CONTRACT.md`](./ADMIN_API_CONTRACT.md).

## Explicit non-goals (Phase 1 audit)

- Nested jsonb schema validation for recipe ingredients/steps (app-layer concern)
- System ingredient seed catalog content
- Auto-create default grocery list on signup (client can `POST /grocery_lists`)
- Moving `admin/` to a separate git repository (product/repo layout decision)
- Full V2 AI Platform / Import / Analytics in one PR (split via #49)

## How to re-verify

```bash
# OpenAPI representations (yaml ↔ openapi.json ↔ Edge Function spec.json)
python3 -c "import json,yaml,pathlib; s=yaml.safe_load(pathlib.Path('supabase/openapi/openapi.yaml').read_text()); assert json.loads(pathlib.Path('supabase/openapi/openapi.json').read_text())==s; assert json.loads(pathlib.Path('supabase/functions/openapi/spec.json').read_text())==s"

# Live OpenAPI
curl -sS https://semsjyrqjnumpvanibip.supabase.co/functions/v1/openapi | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['info']['title'], len(d['paths']))"
```
