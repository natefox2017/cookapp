# CookApp Local Admin Dashboard

Local ops console for CookApp. Talks to cloud Admin APIs through a typed API layer.

**Status:** Foundation Complete / V2 Operational Expansion  
([Notion Backend & Admin V2](https://app.notion.com/p/3dfe1df1f5a7816b89c1fe67eded6242) · [#49](https://github.com/natefox2017/cookapp/issues/49) · [#104](https://github.com/natefox2017/cookapp/issues/104))

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

| Variable | Default | Meaning |
|----------|---------|---------|
| `VITE_ADMIN_USE_MOCK` | `true` in Vite **DEV** only | In-memory mock API + mock auth. Production builds forbid `true` (Issue #51). |
| `VITE_ADMIN_API_BASE_URL` | _(empty)_ | Live Supabase project origin when mock is off |

## Navigation (§14 / #104)

```
Dashboard
Users
Commerce → Overview · Subscriptions · Payments · Products & Plans
Analytics
Content & AI → System Recipe Library · AI Import · Import Review · Taxonomy
Operations → System Health · Jobs & Syncs · Errors & Incidents · Audit Log
Settings → General · Runtime Config · AI Platform · Integrations · Security & Admin · System
```

**Not Admin:** Meal Plan, Grocery, Pantry, Collections, or user private Recipe bodies (#98 / #104).

System Recommended Recipes and User Recipes share the `recipes` table, discriminated by `library_kind` (`system_recommended` | `user_owned`). Admin catalog only manages system rows.

## Live Admin APIs

| Domain | Endpoint prefix | Status |
|--------|-----------------|--------|
| Auth | `/functions/v1/admin-auth/*` | live |
| Users | `/functions/v1/admin-users/*` | live |
| Dashboard | `/functions/v1/admin-dashboard` | live |
| Subscriptions / Payments | `/functions/v1/admin-subscriptions/*` | live |
| Catalog (system recipes / taxonomy / settings / runtime-config) | `/functions/v1/admin-catalog/*` | live |
| AI Import | `/functions/v1/admin-recipe-import/*` | live |
| AI Platform | `/functions/v1/admin-ai/*` | live |
| Analytics | `/functions/v1/admin-analytics` | live |
| Operations (jobs / health / audit) | `/functions/v1/admin-operations/*` | live |
| Integrations | `/functions/v1/admin-integrations/*` | live |

## Related

- GitHub Issue #12 · #32 · #44 · #47 · #49 · #51 · #52 · #92 · #98 · #101 · **#104**
- Notion: Backend & Admin V2 · AI Recipe Import · Analytics/Payments
