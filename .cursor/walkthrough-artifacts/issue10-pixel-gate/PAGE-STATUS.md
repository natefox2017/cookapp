# Issue #10 — Page Status Ledger（唯一执行台账 · 防冲突）

**Updated:** 2026-09-18T10:45Z  
**Owner DoD:** 仅 **hard pixel PASS**（并排 ≤~2–4px + 独立 QA `VERDICT: PASS`）才可勾 Issue #10「完成」。  
**中间态:** PixelBase IMAGE fill（`imageHash`≡crop SHA1，树仅 PixelBase 可见）= **已处理锁图**，**≠** Issue 完成。

> 其他 Agent / 对话：**先读本文件 + Issue #10**，再动 Figma / 开 PR。  
> 权威副本也镜像到：`docs/ui-screenshots/ISSUE10-PAGE-STATUS.md`

## 防冲突规则（强制）

1. **禁止** 对已标 `PIXELBASE_LOCKED` 的页重做映射 / 重传 crop / 报「缺图」。
2. **禁止** 把 PixelBase 填图写成 hard **pixel PASS** 或勾 Issue 完成框。
3. **禁止** 新开与 [#73](https://github.com/natefox2017/cookapp/pull/73) 并行的「全量 pixel gate」PR；增量证据挂 #73 或明确 batch PR，并回写本表。
4. **禁止** 绘制 / 臆造 Owner skip：**46 / 47 / 48**。
5. 当前唯一技术残留：**28b**（Create Shopping List · Stage wrapper 未 PixelBase-only）。认领前在 Issue #10 留言。
6. 参考图映射以同目录 `REF-MAP.md` 为准（PR #38 `missing-ref/` 已交齐；勿再假缺图）。

---

## A. 未处理完（现在还能动手的）

| ID | 页 | 状态 | 说明 |
|----|----|------|------|
| **28b** | Create Shopping List（变体） | `RESIDUAL` | 主树 58/59 已 `vis=[PixelBase]`；**仅此页** Stage 包层未恢复 PixelBase-only。下一 Figma 配额优先修。 |
| **01–45, 49**（全部 primary） | Interaction Tree 正式页 | `HARD_PIXEL_OPEN` | PixelBase 已锁，但 **Issue DoD 未完成**：#73 Gate 多次 FAIL（填图 ≠ 像素 PASS）。须独立 QA 硬过才勾。 |
| Soft gaps（不挡 PixelBase，非「缺图」） | 04d / 19-all-four / 24-empty | `SOFT_GAP` | 包内无离散 still：04d 用滚动切片；19 无「四项全开」；24 用 filled 非 zero-row empty。有更好 still 再换 crop，**不要**标 MISSING_REF。 |

## B. Owner 明确不画（勿处理）

| ID | 说明 |
|----|------|
| **46** | Export / Share — 系统分享 Sheet，不进正式树 |
| **47** | Acknowledgements — Owner skip |
| **48** | Special Thanks — Owner skip |

## C. 已处理完（PixelBase 锁图 · 勿重做）

### Primaries（01–45, 49）— `PIXELBASE_LOCKED`

01 Cookbook · 02 Recipe Detail · 03 Meal Plan (filled) · 04 Cooking Steps · 05 Timer · 06 Recipe Menu · 07 Folders · 08 Recently Added · 09 Your Recipes/Main · 10 New Smart Folder · 11 Discover · 12 Filter · 13 Recipe Editor · 14 Category · 15 Cuisine · 16–19 Search/Scope · 20 Cookbook (pair) · 21 Add Recipe Menu · 22 New Recipe · 23 Cookbook Return · 24 Groceries · 25–27 Groceries cluster · 28 New Item · 29–31 Meal Plan / Add Menu · 32 Add Section · 33–36 Settings cluster · 37 Clipboard · 38–45 Settings / How To · **49** What’s New  

（**不含** 46/47/48；**不含** 未恢复的 **28b**。）

### Variants / extras — `PIXELBASE_LOCKED`

| 节点 | PixelBase | 备注 |
|------|-----------|------|
| 10 Date Added | `436:3208` | |
| 16 Scoped | `436:3209` | |
| 19 All Included | `436:3210` | 非 all-four |
| 19 History Empty | `436:3211` | |
| 04b Timers | `458:3820` | |
| 04c Ingredients | `458:3821` | |
| 04d Cooking Step | `458:3822` | soft gap |
| 08b–f Layout/Appearance/List/Photo/Sort | `458:3823–3827` | |

可见性审计：**58/59** tree 页仅 PixelBase；残 **28b**。

---

## D. 状态码

| Code | 含义 | 可勾 Issue「完成」？ |
|------|------|---------------------|
| `PIXELBASE_LOCKED` | 填图+hash+仅底图可见 | **否** |
| `HARD_PIXEL_OPEN` | 等待硬像素 PASS + 独立 QA | **否** |
| `HARD_PIXEL_PASS` | 独立 QA 硬过 | **是** |
| `RESIDUAL` | 技术未做完 | **否** |
| `OWNER_SKIP` | 不画 | N/A（永不勾完成） |
| `SOFT_GAP` | 素材弱于理想 still | **否**（换图前保持） |

当前：**无任何页为 `HARD_PIXEL_PASS`。** Issue #10 保持 OPEN。

---

## E. 证据与 PR

| 项 | 指针 |
|----|------|
| Evidence | `.cursor/walkthrough-artifacts/issue10-pixel-gate/`（本文件 · `REF-MAP.md` · `VERDICT.md` · crops） |
| Refs | `docs/ui-screenshots/` + `missing-ref/`（[#38](https://github.com/natefox2017/cookapp/pull/38)） |
| Active PR | [#73](https://github.com/natefox2017/cookapp/pull/73) pixel gate（Gate FAIL：勿宣称 PASS） |
| Related | #82 FAIL · #85 retry · #84 missing-ref merged · #86 indep QA |
| Figma | `FHbikS2jILAeMv8mote0vD` / page `37:2` |

## F. 下一 Agent 只允许做的事

1. 修 **28b** → 回写本表 `RESIDUAL`→`PIXELBASE_LOCKED`  
2. 或选一小批做 **hard pixel**（向量/真像素）→ 独立 QA → 仅当 `VERDICT: PASS` 才把该页改为 `HARD_PIXEL_PASS` 并勾 Issue  
3. 禁止：全量重扫缺图、并行开第三条全量 gate 分支、改 Owner skip 页
