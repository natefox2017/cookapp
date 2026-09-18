# Owner Config Checklist（人工配置填写表）

> **给 Owner 填**：把需要人工后台配置的值统一写在这里。  
> **给 Agent 看**：缺配置时**不要停工**；用占位符继续开发其他功能，联调/真机验证等此表填齐后再做。

填写约定：
- 状态：`todo` / `done` / `n/a`
- 机密值可写「已配置到 Secrets.xcconfig / Supabase secrets」，不必把私钥贴进 Git
- 改完后在对应行更新日期；Agent 以本文件 + `ios/Config/Secrets.xcconfig`（本地 gitignore）为准

---

## 0. 项目固定信息（一般不用改）

| 项 | 值 |
|----|-----|
| Bundle ID | `com.natefox.cookapp` |
| Display name | CookApp |
| Supabase project | `cookapp` |
| Supabase ref | `semsjyrqjnumpvanibip` |
| Supabase URL | `https://semsjyrqjnumpvanibip.supabase.co` |
| Entitlement id | `pro` |
| Auth redirect | `cookapp://auth-callback` |
| RC webhook URL | `https://semsjyrqjnumpvanibip.supabase.co/functions/v1/revenuecat-webhook` |

---

## 1. Apple Sign In

| 字段 | 状态 | 填写值 / 备注 | 更新日期 |
|------|------|---------------|----------|
| Apple Developer：App ID 已开 Sign in with Apple | todo | | |
| Supabase Auth → Apple Provider 已启用 | todo | | |
| Supabase Apple Client IDs（含 Bundle ID / Services ID） | todo | | |
| （如用 Services ID）Key ID / Team ID / 私钥已配到 Supabase | todo | | |

说明见 `docs/AUTH_AND_IAP.md` → Flows → Apple。

---

## 2. Google Sign In

| 字段 | 状态 | 填写值 / 备注 | 更新日期 |
|------|------|---------------|----------|
| Google Cloud OAuth Client（iOS）已创建 | todo | | |
| Supabase Auth → Google Provider 已启用 | todo | | |
| Google Client ID | todo | （可只写「已写入 Secrets」） | |
| Google Client Secret（Supabase 后台） | todo | （勿提交到 Git） | |
| Supabase Redirect allowlist 含 `cookapp://auth-callback` | todo | | |
| `COOKAPP_GOOGLE_CLIENT_ID`（Secrets.xcconfig） | todo | | |

---

## 3. RevenueCat + App Store 内购

| 字段 | 状态 | 填写值 / 备注 | 更新日期 |
|------|------|---------------|----------|
| App Store Connect 订阅商品已创建 | todo | product ids: | |
| RevenueCat App / Products / Offering 已配 | todo | | |
| RevenueCat Entitlement `pro` 已绑定商品 | todo | | |
| `COOKAPP_REVENUECAT_API_KEY`（public SDK key → Secrets.xcconfig） | todo | | |
| `REVENUECAT_WEBHOOK_SECRET`（Supabase secrets） | todo | `supabase secrets set REVENUECAT_WEBHOOK_SECRET=... --project-ref semsjyrqjnumpvanibip` | |
| RevenueCat Webhook 已指向上方 webhook URL，Authorization Bearer 一致 | todo | | |

---

## 4. iOS 本地 Secrets

复制：

```bash
cp ios/Config/Secrets.example.xcconfig ios/Config/Secrets.xcconfig
```

| Key | 状态 | 备注 |
|-----|------|------|
| `COOKAPP_SUPABASE_URL` | done | 默认已指向 cookapp 项目 |
| `COOKAPP_SUPABASE_ANON_KEY` | todo | 可用 Dashboard anon / publishable key；示例见 Secrets.example |
| `COOKAPP_REVENUECAT_API_KEY` | todo | |
| `COOKAPP_GOOGLE_CLIENT_ID` | todo | |
| `COOKAPP_ENVIRONMENT` | done | debug / production |

`Secrets.xcconfig` **不要提交**（已在 `.gitignore`）。

---

## 5. 可选 / 后续

| 字段 | 状态 | 填写值 / 备注 | 更新日期 |
|------|------|---------------|----------|
| Apple 内购 Shared Secret / ASC API（若 RC 需要） | todo | | |
| 监控（Sentry / Analytics）DSN | n/a | Phase 后续 · #57 correlation IDs first | |
| 管理后台 URL / 密钥 | todo | 见 §6 Admin；生产禁止默认 `admin`/`admin`（#51） | |

---
## 6. Admin Dashboard（Issue #51 · #52）
| 监控（Sentry / Analytics）DSN | n/a | Phase 后续 | |
| 管理后台 URL / 密钥 | todo | 见 §6 Admin |
## 6. Admin Dashboard / AI Platform

| 字段 | 状态 | 填写值 / 备注 | 更新日期 |
|------|------|---------------|----------|
| Production Admin Owner username | todo | 勿使用默认 `admin`/`admin` | |
| Production Owner password（强密码） | todo | 仅存 Secrets / 密码管理器；用 `POST /functions/v1/admin-auth/bootstrap` | 2026-09-18 |
| `COOKAPP_ADMIN_ENV`（Supabase secrets） | todo | Production 设为 `production`（默认即 production） | |
| `COOKAPP_ADMIN_BOOTSTRAP_TOKEN`（Supabase secrets） | todo | 一次性强随机 token；Bootstrap 请求头 `X-CookApp-Bootstrap-Token`；用完可轮换/删除 | |
| `COOKAPP_ADMIN_ALLOW_DEFAULT_CREDENTIALS` | n/a | 仅当 `COOKAPP_ADMIN_ENV=development`；Production 即使误设也为 false | |
| Admin live API base URL | todo | `VITE_ADMIN_API_BASE_URL`；Production build 禁止 `VITE_ADMIN_USE_MOCK=true` | |
| `COOKAPP_AI_MASTER_KEY`（Supabase secrets） | todo | 32-byte AES key (base64)；`supabase secrets set COOKAPP_AI_MASTER_KEY=...` | 2026-09-18 |
| AI Gateway Base URL | todo | Admin → Settings → AI Platform → Providers；密钥只进 Supabase secrets | 2026-09-18 |
| AI Protocol | todo | 首期 `openai_compatible` only | |
| AI API Secret configured | todo | server-side `secret_ref` only；Admin 仅见 `secretConfigured` | |
| Primary Recipe Model | todo | route `recipe_import_text` / `recipe_import_vision` | |
| Fallback Model | todo | max 3 fallbacks per route | |
| App Store Connect API configured | todo | P1 Analytics #59；未接前 Dashboard 不得用假下载 KPI 冒充 | 2026-09-18 |
| Analytics access configured | todo | | |
| Financial Reports access configured | todo | | |
| Storage Provider | done | Supabase（R2 / Stream = n/a / future） | |
| `STORAGE_CLEANUP_SECRET`（Supabase secrets） | todo | Cron/ops for `storage-cleanup-import-artifacts` (#54) | 2026-09-18 |
| 监控（Sentry / Analytics）DSN | n/a | Phase 后续 | |
| 管理后台 URL / 密钥 | todo | 见相关 Issue | |

角色约定（server-side）：
- **Owner**：AI secrets/provider、Financial、Admin accounts
- **Admin**：运营管理（不可写 AI secrets）
- `operator` / `readonly`：预留

契约矩阵：`docs/backend/ADMIN_API_CONTRACT.md`  
AI Platform Edge Function：`/functions/v1/admin-ai/*`（Issue #53）

---

## Agent 执行规则（强制）

1. 开发前读本文件；缺 `todo` 项 → **跳过联调依赖，继续其他功能**。  
2. 禁止因 Owner 未填配置而阻塞 PR / 停工。  
3. 代码继续使用占位符与清晰 `AppError.configuration` / 日志提示。  
4. 只有本表相关项变为 `done` 后，才安排真机登录/购买验收。  
5. 新增需要人工配置的能力时：**先追加到本表**，再写代码。

---

## 变更记录

| 日期 | 说明 |
|------|------|
| 2026-09-17 | 初版：汇总 Apple / Google / RevenueCat / Secrets |
| 2026-09-18 | #51 hardening + #52 Admin API contract；AI/ASC/Storage placeholders |
| 2026-09-18 | #54：`STORAGE_CLEANUP_SECRET` for import-artifact TTL cleanup |
| 2026-09-18 | #53：AI Platform status（Gateway / secret_ref / routes） |
