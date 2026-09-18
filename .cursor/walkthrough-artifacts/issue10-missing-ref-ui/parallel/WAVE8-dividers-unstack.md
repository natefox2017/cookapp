# WAVE8 — Menu dividers + canvas text unstack

Owner: 菜单之间缺少分割线，或者分割线样式不对，依旧存在页面文字叠加问题  
(+ follow-up: 分割线颜色不对)

## Root causes

1. **App Icon `116:18900`** — `Icon List Card` was a plain white rect with Pestle/Dark/Sketch labels; **no** `Separator` layers (vs still `35/IMG_4482` hairlines).
2. **Separator color** — Settings Group seps were on `color/border/subtle` / then briefly **#E7E7E8** (washed still sample). Owner: too faint / wrong. Correct = iOS **`opaqueSeparator` #C6C6C8**.
3. **Text overlay** — Interaction Tree captions: `NAV N · …` (x=48) overlapped `Label / NN` (x=208) on NAV 1/2/3/4.

## Fix (file `FHbikS2jILAeMv8mote0vD`)

| Change | Detail |
|--------|--------|
| Token `separator/opaque` `VariableID:95:3873` Light | **`#C6C6C8`** `{198,198,200}` (iOS opaqueSeparator) |
| Settings Group `94:12649` Separators (9) | Rebind fill → `separator/opaque` |
| App Icon `116:18900` | Add `Separator` ×2 at y=227 / 293, x=48, w=344, h=1, bound to `separator/opaque` |
| Tree labels | NAV 1/2/3/4: Label y = NAV.y + NAV.h + 8; Source y = Label.y + 28 |

Did **not** edit Bottom NAV `77:237` or header set `127:10295`. Did **not** change `material/chrome-border` (glass chrome).

## Verify

- App Icon list: hairlines between Pestle↔Dark and Dark↔Sketch
- Settings multi-row groups (Policies / Support / …): `#C6C6C8` seps via shared token
- Interaction Tree caption overlaps: **0**

Ignore status bar / Dynamic Island / keyboard when comparing stills.
