# CookApp Local Admin Dashboard

Local ops console for CookApp. Talks to cloud Admin APIs through a typed API layer.

**Status:** Foundation Complete / V2 Operational Expansion Required  
([Notion Backend & Admin V2](https://app.notion.com/p/3dfe1df1f5a7816b89c1fe67eded6242) · [#49](https://github.com/natefox2017/cookapp/issues/49))

Live vs mock path matrix: [`docs/backend/ADMIN_API_CONTRACT.md`](../docs/backend/ADMIN_API_CONTRACT.md).

## Stack

- React + TypeScript + Vite
- Tailwind CSS + shadcn/ui-style primitives
- Lucide Icons
- Recharts

## Run locally

```bash
cd admin
npm install
npm run dev
```

Open `http://localhost:5173`.

Local mock credentials: `admin` / `admin` (mock auth only). Production must not use default credentials (#51).

## Environment

Copy `.env.example` to `.env` if needed:

| Variable | Default | Meaning |
|----------|---------|---------|
| `VITE_ADMIN_USE_MOCK` | `true` in Vite **DEV** only | In-memory mock API + mock auth. Production builds forbid `true` (Issue #51). **Must not power Production KPIs.** |
| `VITE_ADMIN_API_BASE_URL` | _(empty)_ | Live Supabase project origin when mock is off (e.g. `https://semsjyrqjnumpvanibip.supabase.co`) |

Default local credentials `admin` / `admin` are **dev-only**. Production must bootstrap a strong Owner password via `POST /functions/v1/admin-auth/bootstrap` and set `COOKAPP_ADMIN_ENV=production` (default).

## Live Admin APIs

| Domain | Endpoint prefix | Status |
|--------|-----------------|--------|
| Auth | `/functions/v1/admin-auth/*` | live |
| Users | `/functions/v1/admin-users/*` | live |
| Dashboard | `/functions/v1/admin-dashboard` | live |
| Commerce → Products · Subscriptions | `/functions/v1/admin-subscriptions/*` | live |
| Data (Collections / Ingredients / Grocery / Meal Plans / Pantry / Categories) | — | **missing** → live client `501`; sidebar **Pending** |
| Recipes → Library | — | **missing** → **Pending** |
| Recipes → AI Import / Import Review | — | **Not implemented** page (IA reserved) |
| Commerce → Payments / Analytics / Operations | — | **Not implemented** page (IA reserved) |
| Settings → General / Security / System | hybrid | Security via `admin-auth`; general diagnostics-only |
| Settings → Integrations | `/functions/v1/admin-integrations/*` | **live** (#63) — Google Play Future Reserved |
| Settings → AI Platform | — | **Not implemented** page (backend `admin-ai` exists) |

Navigation IA (Issue #64) lives in `admin/src/components/layout/nav.ts` only:

- Dashboard · Users
- Recipes → Library / AI Import / Import Review
- Commerce → Products · Subscriptions / Payments
- Analytics
- Operations → Jobs & Syncs / Audit Log
- Data → Collections / Ingredients / Grocery / Meal Plans / Pantry / Categories
- Settings → General / AI Platform / Integrations / Security / System

Legacy paths redirect (`/subscription` → `/commerce/products`, `/collections` → `/data/collections`, etc.).

## Auth

| Action | Endpoint |
|--------|----------|
| Login | `POST /functions/v1/admin-auth/login` |
| Bootstrap Owner | `POST /functions/v1/admin-auth/bootstrap` |
| Logout | `POST /functions/v1/admin-auth/logout` |
| Session | `GET /functions/v1/admin-auth/session` |
| Change password | `POST /functions/v1/admin-auth/change-password` |

Bearer token sessions (7-day TTL). Change password from **Settings → Security**. Strong password required (12+ with upper/lower/digit).

## Users API

| Action | Endpoint |
|--------|----------|
| List (+ provider/device filters) | `GET /functions/v1/admin-users` |
| Detail (+ IP / payments) | `GET /functions/v1/admin-users/:id` |
| Registration mix stats | `GET /functions/v1/admin-users/stats` |

`profiles` stores `registration_ip`, `registration_provider`, `device_type`. Payment timeline comes from `purchase_events`.

## Architecture

```
Admin Dashboard UI
  → src/api/* (typed interfaces)
    → mock data (VITE_ADMIN_USE_MOCK=true) — local/dev only
    → or HTTP Supabase Functions (live) — missing domains → 501 not_implemented
```

## Modules

| Route | Module | Live API |
|-------|--------|----------|
| `/login` | Admin sign-in | yes |
| `/` | Dashboard | yes (`admin-dashboard`) |
| `/users` | Users | yes |
| `/recipes` | Recipe grid + detail | pending |
| `/collections` | Collections grid | pending |
| `/ingredients` | Ingredients CRUD | pending |
| `/grocery` | Grocery | pending |
| `/meal-plans` | Meal plan | pending |
| `/pantry` | Pantry | pending |
| `/categories` | Taxonomy | pending |
| `/subscription` | Plans · Records · Revenue | yes |
| `/settings` | General / Integrations / Units / Categories / Security / System | hybrid + Integrations live (#63) |

Sidebar collapses via header / rail control (persisted). In live mode, pending modules show a **Pending** badge.

## Related

- GitHub Issue #12 · #32 · #35 · #44 · #47 · #49 · #51 · #52
- Cloud backend Issue #11
- Notion: Local Admin Dashboard · Analytics/Payments · Backend & Admin V2

Download counts live in `app_download_stats` (seeded / manually imported until store APIs are wired — #59).
