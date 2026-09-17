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
| `/users` | Users + detail sheet |
| `/recipes` | Recipe grid + detail |
| `/collections` | Collections grid |
| `/ingredients` | Ingredients CRUD table |
| `/grocery` | User list + shopping items |
| `/meal-plans` | Calendar meal plan |
| `/pantry` | Pantry card grid |
| `/categories` | Cuisine / Category / Tags |
| `/subscription` | Subscriptions table |
| `/settings` | General / Units / Categories / Security / System |

Sidebar collapses via header / rail control (persisted).

## Related

- GitHub Issue #12 · #32
- Cloud backend Issue #11
- Notion: Local Admin Dashboard system boundary
