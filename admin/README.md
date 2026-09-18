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
| `VITE_ADMIN_USE_MOCK` | `true` (local) | Use in-memory mock API + mock auth. **Must not power Production KPIs.** |
| `VITE_ADMIN_API_BASE_URL` | empty | Supabase project URL when mock is off (e.g. `https://semsjyrqjnumpvanibip.supabase.co`) |

## Live Admin APIs

| Domain | Endpoint prefix | Status |
|--------|-----------------|--------|
| Auth | `/functions/v1/admin-auth/*` | live |
| Users | `/functions/v1/admin-users/*` | live |
| Dashboard | `/functions/v1/admin-dashboard` | live |
| Subscription | `/functions/v1/admin-subscriptions/*` | live |
| Recipes / Collections / Ingredients / Grocery / Meal Plans / Pantry / Categories | — | **missing** → live client returns `501`; sidebar marks **Pending** |
| Settings | hybrid | Security via `admin-auth`; general settings diagnostics-only in live mode |

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
| `/settings` | General / Units / Categories / Security / System | hybrid |

Sidebar collapses via header / rail control (persisted). In live mode, pending modules show a **Pending** badge.

## Related

- GitHub Issue #12 · #32 · #35 · #44 · #47 · #49 · #51 · #52
- Cloud backend Issue #11
- Notion: Local Admin Dashboard · Analytics/Payments · Backend & Admin V2

Download counts live in `app_download_stats` (seeded / manually imported until store APIs are wired — #59).
