# CookApp Local Admin Dashboard

Local ops console for CookApp. Talks to cloud Admin APIs through a typed API layer.

**Status:** Foundation Complete / V2 Operational Expansion Required  
([Notion Backend & Admin V2](https://app.notion.com/p/3dfe1df1f5a7816b89c1fe67eded6242) · [#49](https://github.com/natefox2017/cookapp/issues/49))

Live vs mock path matrix: [`docs/backend/ADMIN_API_CONTRACT.md`](../docs/backend/ADMIN_API_CONTRACT.md).

## Stack

- React + TypeScript + Vite
- Tailwind CSS + shadcn/ui (default zinc / black-white theme)
- Lucide Icons
- Recharts

Dark mode is the default and paints the **full shell** (sidebar + content). Toggle light/dark from the header; preference is stored in `localStorage` (`cookapp-admin-theme`). Sidebar collapse lives only in the header — do not add a second rail control.

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
| Recipes / Collections / Ingredients / Grocery / Meal Plans / Pantry / Categories | — | **missing** → live client `501`; sidebar **Pending** |
| Settings → General / Security / System | hybrid | Security via `admin-auth`; general diagnostics-only |
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
| `/recipes` | Recipe grid + detail | pending |
| `/collections` | Collections grid | pending |
| `/ingredients` | Ingredients CRUD | pending |
| `/grocery` | Grocery | pending |
| `/meal-plans` | Meal plan | pending |
| `/pantry` | Pantry | pending |
| `/categories` | Taxonomy | pending |
| `/subscription` | Plans · Records · Revenue | yes |
| `/settings` | General / Integrations / Units / Categories / Security / System | hybrid + Integrations live (#63) |

Sidebar collapses via the header control only (persisted). In live mode, pending modules show a **Pending** badge.

## Related

- GitHub Issue #12 · #32 · #35 · #44 · #47 · #49 · #51 · #52
- Cloud backend Issue #11
- Notion: Local Admin Dashboard · Analytics/Payments · Backend & Admin V2

Download counts live in `app_download_stats` (seeded / manually imported until store APIs are wired — #59).
