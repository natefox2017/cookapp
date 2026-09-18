# WAVE6 — Back button Liquid Glass (multi-page)

Owner report: 返回按钮不符合液态玻璃，并且多了个背景（多个页面）。

## Root cause

1. **Square plate** — `Top Bar` wrappers were 48×48 frames with `clipsContent=true` and `cornerRadius=0`, so the glass material painted a **grey square** behind the circular button (visible on Household `43` and siblings).
2. **Heavy shadow** — shared `Glass / Top Button` (`196:23264`) used `DROP_SHADOW` offset y=8 / radius=24, reading as a second soft plate behind the circle.
3. **Opaque override** — Household Back instances had fill white **92%**, killing translucency.

## Fix (file `FHbikS2jILAeMv8mote0vD`)

| Node | Change |
|------|--------|
| `Glass / Top Button` `196:23264` | Fill white **62%** + `GLASS` + hairline 0.5pt @10% black; `clipsContent=true`; r=24 |
| Same | Shadow → y=1 / radius=4 / a=0.12 (was y=8 / r=24) |
| `Top Highlight` `541:11794` | stays **hidden** |
| All `Top Bar` 48×48 | `fills=[]`, `cornerRadius=24`, `clipsContent=true` (circular clip) |
| ~210 `Glass / Top Button` / `Back` instances | fill aligned to 62% glass white |

Did **not** edit Bottom NAV `77:237`.

## Verify

- Interaction Tree `43 · Household` `117:10383` — circular glass back, no square plate
- Source `116:19140` Top Bar / Back same
- Recipe Detail header instances inherit component effects

Ignore status bar / Dynamic Island / keyboard when comparing stills.
