# Admin Integrations

Issue: [#63](https://github.com/natefox2017/cookapp/issues/63) · Parent [#49](https://github.com/natefox2017/cookapp/issues/49)  
Notion: [Backend & Admin V2 §11](https://app.notion.com/p/3dfe1df1f5a7816b89c1fe67eded6242)

## Purpose

Settings → Integrations shows real connection status for:

| Integration | Status sources | Test | Secret write |
|-------------|----------------|------|--------------|
| Supabase | Edge env + DB probe | yes | no (platform env) |
| RevenueCat | `REVENUECAT_WEBHOOK_SECRET` env | yes | no (supabase secrets) |
| App Store Connect | `integration_configs` + encrypted `integration_secrets` | yes (decrypt/config completeness; live ASC HTTP in #59) | Owner write-only |
| AI Gateway | `ai_providers` + `ai_secrets` via AI Platform | yes | via `admin-ai` only |
| Google Play | always `future_reserved` | no | no |

Production never pretends Google Play is connected. Mock Admin fixtures also keep Google Play as Future Reserved.

## API

- `GET /functions/v1/admin-integrations`
- `GET /functions/v1/admin-integrations/{id}`
- `POST /functions/v1/admin-integrations/{id}/test`
- `PUT /functions/v1/admin-integrations/{id}/secret` (Owner)
- `PUT /functions/v1/admin-integrations/{id}/config` (Owner, non-secret)

Secrets: ciphertext only; responses expose `secretConfigured: boolean`.

## Deploy

```bash
supabase db push # or apply 20260918110000_admin_integrations.sql
supabase functions deploy admin-integrations --project-ref semsjyrqjnumpvanibip
# ASC secret encryption reuses COOKAPP_AI_MASTER_KEY
```
