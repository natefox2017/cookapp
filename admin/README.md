# CookApp Local Admin Dashboard

Local ops console for CookApp. Talks to cloud Admin APIs through a typed API layer. Default mode uses mock payloads shaped like the real contracts.

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

Sign in with default credentials: `admin` / `admin`.

## Environment

Copy `.env.example` to `.env` if needed:

| Variable | Default | Meaning |
|----------|---------|---------|
| `VITE_ADMIN_USE_MOCK` | `true` | Use in-memory mock API + mock auth |
| `VITE_ADMIN_API_BASE_URL` | empty | Supabase project URL when mock is off (e.g. `https://semsjyrqjnumpvanibip.supabase.co`) |

## Auth

| Action | Endpoint |
|--------|----------|
| Login | `POST /functions/v1/admin-auth/login` |
| Logout | `POST /functions/v1/admin-auth/logout` |
| Session | `GET /functions/v1/admin-auth/session` |
| Change password | `POST /functions/v1/admin-auth/change-password` |

Bearer token sessions (7-day TTL). Change password from **Settings → Security**.

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
    → mock data (VITE_ADMIN_USE_MOCK=true)
    → or HTTP Supabase Functions / REST (live)
```

## Modules

| Route | Module | Live Admin API |
|-------|--------|----------------|
| `/login` | Admin sign-in | `admin-auth` |
| `/` | Dashboard (provisional DB KPIs) | `admin-dashboard` |
| `/users` | Users + provider/device filters, registration stats, payment history | `admin-users` |
| `/recipes` | Recipe grid + detail | **Not Implemented** (mock/dev only) |
| `/collections` | Collections grid | **Not Implemented** (mock/dev only) |
| `/ingredients` | Ingredients CRUD table | **Not Implemented** (mock/dev only) |
| `/grocery` | User list + shopping items | **Not Implemented** (mock/dev only) |
| `/meal-plans` | Calendar meal plan | **Not Implemented** (mock/dev only) |
| `/pantry` | Pantry card grid | **Not Implemented** (mock/dev only) |
| `/categories` | Cuisine / Category / Tags | **Not Implemented** (mock/dev only) |
| `/subscription` | Plans (Apple/Android) · Records · Revenue charts | `admin-subscriptions` |
| `/settings` | Security live; General/Units/Categories persistence NI | `admin-auth` (Security) |

Sidebar collapses via header / rail control (persisted). Missing-domain nav items show an **NI** badge in live mode.

## Contract

See [`docs/backend/admin-api-contract-matrix.md`](../docs/backend/admin-api-contract-matrix.md) (Issue #52).

## Related

- GitHub Issue #12 · #32 · #35 · #44 · #47 · **#52**
- Cloud backend Issue #11
- Notion: Local Admin Dashboard system boundary · Backend/Admin V2

Live dashboard aggregation: `GET /functions/v1/admin-dashboard` (admin bearer) — provisional until P1 Analytics (#47).
Download counts live in `app_download_stats` (seeded / manually imported until store APIs are wired).
Google Play remains Future Reserved.