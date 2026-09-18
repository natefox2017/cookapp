# WAVE6b — Discover recipe card spacing

Source `115:8191` / instance `130:14331`.

Before (absolute Y, no auto-layout):

| Card | y | gap above |
|---|---|---|
| Fish | 184 | — |
| White | 368 | **0** (flush) |
| Muffin | 568 | 16 |
| Mayo | 768 | 16 |

After: height 184, **item gap 12**, y = 184 / 380 / 576 / 772, x=16. Did not edit `77:237` / `127:10295`.
