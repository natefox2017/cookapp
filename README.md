# cookapp

AI 菜谱 App（Phase 1：技术基础框架）。

## Source of Truth

| 来源 | 职责 |
|------|------|
| [Notion Architecture Foundation](https://app.notion.com/p/3dee1df1f5a781b897b9f36c641b4708) | 产品/架构/长期规则 |
| [Figma](https://www.figma.com/file/FHbikS2jILAeMv8mote0vD?type=design) | UI 唯一设计源 |
| GitHub | 代码 / Issue / PR |

## Phase 1 范围

只做基础设施：iOS 工程骨架、Theme/Token、Network/Error、Supabase、Auth 底座、Payment 底座。  
**不做**业务功能、页面流程、AI 业务逻辑。

## 工程入口

- iOS：[`ios/README.md`](ios/README.md)（`xcodegen generate` 后用 Xcode 打开）
- Backend：`supabase/`（项目 ref：`semsjyrqjnumpvanibip`）
- Backend 文档：[`docs/backend/README.md`](docs/backend/README.md) · OpenAPI：`supabase/openapi/openapi.yaml`
- **人工配置填写表**：[`docs/OWNER_CONFIG.md`](docs/OWNER_CONFIG.md)（缺配置不阻塞开发）
- Auth + IAP 流程说明：[`docs/AUTH_AND_IAP.md`](docs/AUTH_AND_IAP.md)
- Issues：[#8 Auth + IAP](https://github.com/natefox2017/cookapp/issues/8) · [#11 Cloud Backend](https://github.com/natefox2017/cookapp/issues/11)

## Bundle

`com.natefox.cookapp` / CookApp

## UI 参考（后续业务阶段）

历史截图参考见 [`docs/ui-screenshots/`](docs/ui-screenshots/)。业务 UI 以 Figma 为准。
