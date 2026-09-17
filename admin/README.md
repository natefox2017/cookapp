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

## Environment

Copy `.env.example` to `.env` if needed:

| Variable | Default | Meaning |
|----------|---------|---------|
| `VITE_ADMIN_USE_MOCK` | `true` | Use in-memory mock API |
| `VITE_ADMIN_API_BASE_URL` | empty | Cloud Admin API base when mock is off |

## Architecture

```
Admin Dashboard UI
  → src/api/* (typed interfaces)
    → mock data (VITE_ADMIN_USE_MOCK=true)
    → or HTTP /admin/* (live)
```

## Modules

| Route | Module |
|-------|--------|
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
| `/settings` | General / Units / Categories / System |

## Related

- GitHub Issue #12
- Cloud backend Issue #11 (live Admin APIs — follow-up)
- Notion: Local Admin Dashboard system boundary
