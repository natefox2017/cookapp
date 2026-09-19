# WAVE9 — Top chrome Y lock + caption unstack (again)

Owner: 页面按钮距离顶部间距不一致，每个页面都应该固定一致。文字叠加依旧存在

## Root causes

1. **Top button Y drift**
   - Duplicate `Trailing / *` on screen root at **y=62** (aligned with large title) while Navigation Header Trailing already at **y=16** (11 Main, 42/43 menus).
   - `Timer Header` at y=28 → Back abs **44**.
   - How To: Body+Header Row stacked → Back Pill abs **32**.
   - Export: `Settings Nav` inside overlay at y=8 → Trailing abs **24**.
   - Misc: Pantry Close / flow Leading·Trailing at y=0/2.

2. **Caption overlap (Interaction Tree)**
   - `NAV 2 · Groceries` (w≈240) still sat in the same vertical band as row Labels (`Label / 25` at y=4865 inside NAV’s 34px height).
   - Short 8px gap after WAVE8 was not enough at canvas zoom.

## Fix (file `FHbikS2jILAeMv8mote0vD`)

| Change | Detail |
|--------|--------|
| NAV 1–4 text | Shorten to **`NAV 1`…`NAV 4`** (drop section name) |
| Labels / Sources | Per NAV band: Label y = NAV.y+**52**, Source y = Label+**26** |
| Hide dup trailings | `371:8006/8010`, `373:7941`, `374:7857` (y=62) |
| Timer Header `198:16254` | y 28→**0** |
| How To Body / Header Row | Body **0**, Header Row **16** (Back Pill @16) |
| Export `Settings Nav` `388:9027` | y 8→**0** |
| Pantry Close / flow chrome | y→**16** |

Did **not** edit Bottom NAV `77:237` or header set geometry beyond instance placement.

## Verify

- Tree screens: **60/60** top chrome controls at **relY=16**; off-lock count **0**
- Caption TEXT overlaps on tree: **0**
- NAV 2 width shrunk (~85); Labels on groceries row share y=4909

Ignore status bar / Dynamic Island / keyboard when comparing stills.
