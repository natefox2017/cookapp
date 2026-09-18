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
| Subscription | `/functions/v1/admin-subscriptions/*` | live |
| Recipes / Collections / Ingredients / Grocery / Meal Plans / Pantry / Categories | `/functions/v1/admin-catalog/*` | **live** (#92) |
| Settings → General / Units / Categories | `/functions/v1/admin-catalog/settings` | persist live; System tab diagnostics-only |
| Settings → Security | `admin-auth` | live |
| Settings → Integrations | `/functions/v1/admin-integrations/*` | **live** (#63) — Google Play Future Reserved |

Flat navigation (Issue #61 rollback of #64 Stage-4-overreach) in `admin/src/components/layout/nav.ts`:

- Dashboard · Users · Recipes · Collections · Ingredients · Grocery · Meal Plans · Pantry · Categories · Subscription · Settings

Settings tabs include Integrations (#63). Analytics / Operations / Payments / AI Platform / AI Import are **not** exposed as Admin nav or placeholder pages until Notion Gate allows; former #64 paths redirect to existing pages.

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
| `/recipes` | Recipe grid + detail | yes (#92) |
| `/collections` | Collections grid | yes (#92) |
| `/ingredients` | Ingredients CRUD | yes (#92) |
| `/grocery` | Grocery | yes (#92) |
| `/meal-plans` | Meal plan | yes (#92) |
| `/pantry` | Pantry | yes (#92) |
| `/categories` | Taxonomy | yes (#92) |
| `/subscription` | Plans · Records · Revenue | yes |
| `/settings` | General / Integrations / Units / Categories / Security / System | hybrid + Integrations live (#63) |

Sidebar collapses via header / rail control (persisted). In live mode, remaining hybrid Settings show a **Hybrid** badge; catalog Data pages are live (#92).

## Related

- GitHub Issue #12 · #32 · #35 · #44 · #47 · #49 · #51 · #52 · **#92**
- Cloud backend Issue #11
- Notion: Local Admin Dashboard · Analytics/Payments · Backend & Admin V2

Download counts live in `app_download_stats` (seeded / manually imported until store APIs are wired — #59).
