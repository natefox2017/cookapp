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
| `VITE_ADMIN_USE_MOCK` | `true` in Vite **DEV** only | In-memory mock API + mock auth. Production builds forbid `true` (Issue #51). |
| `VITE_ADMIN_API_BASE_URL` | _(empty)_ | Live Supabase project origin when mock is off |

Default local credentials `admin` / `admin` are **dev-only**. Production must bootstrap a strong Owner password via `POST /functions/v1/admin-auth/bootstrap` and set `COOKAPP_ADMIN_ENV=production` (default).

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
    → mock data (VITE_ADMIN_USE_MOCK=true)
    → or HTTP Supabase Functions / REST (live)
```

## Modules

| Route | Module |
|-------|--------|
| `/login` | Admin sign-in |
| `/` | Dashboard |
| `/users` | Users + provider/device filters, registration stats, payment history |
| `/recipes` | Recipe grid + detail |
| `/collections` | Collections grid |
| `/ingredients` | Ingredients CRUD table |
| `/grocery` | User list + shopping items |
| `/meal-plans` | Calendar meal plan |
| `/pantry` | Pantry card grid |
| `/categories` | Cuisine / Category / Tags |
| `/subscription` | Plans (Apple/Android) · Records · Revenue charts |
| `/settings` | General / Units / Categories / Security / System |

Sidebar collapses via header / rail control (persisted).

## Related

- GitHub Issue #12 · #32 · #35 · #44
- Cloud backend Issue #11
- Notion: Local Admin Dashboard system boundary · Analytics, Payments & User Intelligence Architecture
