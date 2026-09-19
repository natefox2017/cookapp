# CHROME — Navigation / Header + tab instance lock

## Title Y lock (2026-09-18 follow-up)

Large green titles: **x=20, y=72** when header instance **y=0** (absY=72). Header set `127:10295` **not** edited this pass.

Standalone/local titles moved: Search FOCUSED `360:8012` 132→72; 42/43 local Meal Plan titles 58→72; Page=Cookbook `180:12831` 58→72.

Bottom-left search list/scope is **not** tab chrome: shared `Glass / Search Scope Button` `665:18839` (see `SEARCH.md`).


File: `FHbikS2jILAeMv8mote0vD`  
Page: `Cookapp · Recording Reproduction` (`37:2`)  
Set edited: **Navigation / Header** `127:10295` (SOURCE variants only)  
**Not edited:** Bottom NAV component set `77:237`

## Returns

| Metric | Value |
|---|---|
| Header variants updated | **63** (of 66; 3 have no Leading/Trailing/Glass button children) |
| Header instances moved to y=0 | **31** |
| Tab instances repositioned | **15** (11 screen-level Bottom Chrome; **4 accidental** — see follow-up) |

Skipped empty header variants (no chrome buttons): `127:9848`, `127:9983`, `127:10139`.

## 1) Header SOURCE buttons → y=16

Every child named `Leading`, `Trailing`, or `Glass / Top Button` on variants of `127:10295` moved from **y=2 → y=16** (x unchanged). **102** button/capsule nodes.

Variant **`275:16344`** `Title=None, Leading=Back, Trailing=CartCalendarMore`: was **h=56**, buttons y=2. Buttons (and row-aligned `Glass / Top Capsule` `275:16346`) set to y=16; variant resized to **h=80**.

### Header variants updated (63)

- `127:9849` Title=None, Leading=None, Trailing=More
- `127:9855` Title=None, Leading=None, Trailing=Cart
- `127:9859` Title=None, Leading=None, Trailing=Folder
- `127:9865` Title=None, Leading=None, Trailing=Add
- `127:9869` Title=None, Leading=None, Trailing=Search
- `127:9873` Title=None, Leading=None, Trailing=AddMore
- `127:9879` Title=None, Leading=Back, Trailing=None
- `127:9883` Title=None, Leading=Back, Trailing=More
- `127:9892` Title=None, Leading=Back, Trailing=Cart
- `127:9899` Title=None, Leading=Back, Trailing=Folder
- `127:9908` Title=None, Leading=Back, Trailing=Add
- `127:9915` Title=None, Leading=Back, Trailing=Search
- `127:9922` Title=None, Leading=Back, Trailing=AddMore
- `127:9931` Title=None, Leading=Close, Trailing=None
- `127:9935` Title=None, Leading=Close, Trailing=More
- `127:9944` Title=None, Leading=Close, Trailing=Cart
- `127:9951` Title=None, Leading=Close, Trailing=Folder
- `127:9960` Title=None, Leading=Close, Trailing=Add
- `127:9967` Title=None, Leading=Close, Trailing=Search
- `127:9974` Title=None, Leading=Close, Trailing=AddMore
- `127:9985` Title=Large, Leading=None, Trailing=More
- `127:9992` Title=Large, Leading=None, Trailing=Cart
- `127:9997` Title=Large, Leading=None, Trailing=Folder
- `127:10004` Title=Large, Leading=None, Trailing=Add
- `127:10009` Title=Large, Leading=None, Trailing=Search
- `127:10014` Title=Large, Leading=None, Trailing=AddMore
- `127:10021` Title=Large, Leading=Back, Trailing=None
- `127:10026` Title=Large, Leading=Back, Trailing=More
- `127:10036` Title=Large, Leading=Back, Trailing=Cart
- `127:10044` Title=Large, Leading=Back, Trailing=Folder
- `127:10054` Title=Large, Leading=Back, Trailing=Add
- `127:10062` Title=Large, Leading=Back, Trailing=Search
- `127:10070` Title=Large, Leading=Back, Trailing=AddMore
- `127:10080` Title=Large, Leading=Close, Trailing=None
- `127:10085` Title=Large, Leading=Close, Trailing=More
- `127:10095` Title=Large, Leading=Close, Trailing=Cart
- `127:10103` Title=Large, Leading=Close, Trailing=Folder
- `127:10113` Title=Large, Leading=Close, Trailing=Add
- `127:10121` Title=Large, Leading=Close, Trailing=Search
- `127:10129` Title=Large, Leading=Close, Trailing=AddMore
- `127:10141` Title=Inline, Leading=None, Trailing=More
- `127:10148` Title=Inline, Leading=None, Trailing=Cart
- `127:10153` Title=Inline, Leading=None, Trailing=Folder
- `127:10160` Title=Inline, Leading=None, Trailing=Add
- `127:10165` Title=Inline, Leading=None, Trailing=Search
- `127:10170` Title=Inline, Leading=None, Trailing=AddMore
- `127:10177` Title=Inline, Leading=Back, Trailing=None
- `127:10182` Title=Inline, Leading=Back, Trailing=More
- `127:10192` Title=Inline, Leading=Back, Trailing=Cart
- `127:10200` Title=Inline, Leading=Back, Trailing=Folder
- `127:10210` Title=Inline, Leading=Back, Trailing=Add
- `127:10218` Title=Inline, Leading=Back, Trailing=Search
- `127:10226` Title=Inline, Leading=Back, Trailing=AddMore
- `127:10236` Title=Inline, Leading=Close, Trailing=None
- `127:10241` Title=Inline, Leading=Close, Trailing=More
- `127:10251` Title=Inline, Leading=Close, Trailing=Cart
- `127:10259` Title=Inline, Leading=Close, Trailing=Folder
- `127:10269` Title=Inline, Leading=Close, Trailing=Add
- `127:10277` Title=Inline, Leading=Close, Trailing=Search
- `127:10285` Title=Inline, Leading=Close, Trailing=AddMore
- `140:14264` Title=Large, Leading=None, Trailing=Close
- `152:28576` Title=Large, Leading=Back, Trailing=Filter
- `275:16344` Title=None, Leading=Back, Trailing=CartCalendarMore (**h 56→80**)

## 2) Header instances y=60 → y=0 (screen SOURCE components)

Only when `parent.type === 'COMPONENT'` (not nested instances, not `77:237`). **31 moved.**

| Instance | Parent screen SOURCE |
|---|---|
| `180:13038` | `115:8012` White Screen / W02 Cookbook · 16:44 |
| `128:24913` | `115:8136` White Screen / W06 Groceries · 06:40 |
| `152:28597` | `115:8191` White Screen / W07 Discover · 07:59 |
| `147:14557` | `115:8250` White Screen / W08 Meal Plan · 08:28 |
| `161:15328` | `115:8329` White Screen / Search ENTER |
| `329:8116` | `116:8936` White Screen / W03 Meal Plan · filled (owner 03) |
| `140:14273` | `116:18755` White Screen / W05 Settings · 02:40 |
| `158:15141` | `116:18852` White Screen / W05.1 General · 02:46–03:44 |
| `158:15235` | `116:18900` White Screen / W05.1.1 App Icon · 02:48 |
| `158:15267` | `116:18924` White Screen / W05.1.2 Markdown · 03:04–03:10 |
| `158:15369` | `116:18948` White Screen / W05.1.3 Clipboard Detection · 03:26 |
| `158:15395` | `116:18972` White Screen / W05.1.4 Experiments · 03:32 |
| `158:15429` | `116:18996` White Screen / W05.2 Account · 03:50 |
| `159:15200` | `116:19044` White Screen / W05.2.1 Create Account · 03:52 |
| `159:15254` | `116:19116` White Screen / W05.3 Join Mailing List · 04:48 Recorded Partial |
| `159:15300` | `116:19188` White Screen / W05.6 Timers · 05:18 |
| `159:15324` | `116:19212` White Screen / W05.7 How To Add Recipes · 05:26–05:30 |
| `159:15412` | `116:19356` White Screen / What's New · 06:10–06:14 |
| `160:25748` | `118:10902` White Screen / 39 Filter · 08:01 |
| `147:14640` | `118:10980` White Screen / 41 Meal Plan Inline · 08:30 |
| `160:15429` | `118:11283` White Screen / 10 Recently Added · 02:32 |
| `160:15531` | `118:11342` White Screen / 11 Main · 02:37 |
| `183:13167` | `115:8375` State=Default |
| `196:25247` | `196:25246` State=FoldersExpanded |
| `196:25269` | `196:25268` State=CategoriesExpanded |
| `196:25291` | `196:25290` State=CuisinesExpanded |
| `196:25313` | `196:25312` State=MenuOpen |
| `196:27885` | `196:27884` White Screen / Export Format · 05:38–05:55 |
| `374:13321` | `374:13320` White Screen / 08 Recently Added · List |
| `374:13325` | `374:13324` White Screen / 08 Recently Added · Photo List |
| `383:8222` | `383:8221` White Screen / Search SCOPED |

**Skipped (y=60 but not COMPONENT parent):** 6 — FRAME `Background / Search Populated` (`246:6756`, `383:8255`, `383:8313`, nested) and nested INSTANCE `I383:8754;383:8222`. No new headers invented.

## 3) Bottom tab instances (`mainComponent.parent.id === 77:237`)

Set `x=9`, `y=parent.height-80` on COMPONENT parents. **Did not edit `77:237`.** Search circle on Selected=Cookbook left untouched as a set.

### Screen-level (intended) — 11

| Id | Parent | parentH | before | after |
|---|---|---|---|---|
| `151:24727` | `115:8191` Discover | 956 | 9,876 | 9,876 |
| `147:14613` | `115:8250` Meal Plan | 1738 | 32,880 | 9,**1658** |
| `142:14219` | `116:8866` Recipe Detail | 3878 | 9,3798 | 9,3798 |
| `329:8173` | `116:8936` Meal Plan filled | 1738 | 9,876 | 9,**1658** |
| `147:14696` | `118:10980` Meal Plan Inline | 956 | 32,880 | 9,876 |
| `373:7981` | `118:11059` Add Menu | 956 | 9,876 | 9,876 |
| `374:7892` | `118:11143` Add Section Menu | 956 | 9,876 | 9,876 |
| `160:15451` | `118:11283` Recently Added | 956 | 9,876 | 9,876 |
| `160:15553` | `118:11342` Main | 956 | 9,876 | 9,876 |
| `374:13323` | `374:13320` 08 List | 956 | 9,876 | 9,876 |
| `374:13327` | `374:13324` 08 Photo List | 956 | 9,876 | 9,876 |

Tall canvases (1738 / 3878) used `parent.height - 80` literally (tab sits at canvas bottom).

### Accidental — Bottom Chrome wrappers h=64 (REVERT REQUIRED)

These are **not** phone screens. Parent is `Selected=*` chrome wrapper (`107:16238` etc.), so `y = 64-80 = -16`. **77:237 itself was not changed.**

| Id | Parent | before | after (BAD) | revert to |
|---|---|---|---|---|
| `107:16239` | `107:16238` Selected=Cookbook | 0,0 | 9,-16 | **x=0, y=0** |
| `107:16260` | `107:16259` Selected=Groceries | 0,0 | 9,-16 | **x=0, y=0** |
| `107:16281` | `107:16280` Selected=Discover | 0,0 | 9,-16 | **x=0, y=0** |
| `107:16302` | `107:16301` Selected=Meal Plan | 0,0 | 9,-16 | **x=0, y=0** |

Revert script (use_figma, `skillNames: "figma-use"`):

```js
for (const id of ['107:16239','107:16260','107:16281','107:16302']) {
  const n = await figma.getNodeByIdAsync(id);
  n.x = 0; n.y = 0;
}
```

Figma MCP Education plan hit **tool call limit** before revert could run. Nested instances of those wrappers may show `y=-16` until revert.

Skipped 8 nested INSTANCE parents (not screen SOURCE).

## 4) Spec frame — Components · Shared `75:24`

Created **`Chrome / Spacing Lock`** via `$fig.autoLayout` + `$fig.text`, appended to `75:24` at local `(19880, 3700)` (right of header set). New node id is in the `use_figma` created-nodes payload (name unique on the section). Copy:

- TOP=16
- BTN=48
- LEFT=16
- RIGHT=376
- TAB_Y=parentH-80
- TAB_X=9
- SEARCH=64 circle

## Follow-up

1. Revert the four wrapper Bottom NAV instances listed above.
2. Confirm spec frame id after rate limit clears (`name === 'Chrome / Spacing Lock'` under `75:24`).
