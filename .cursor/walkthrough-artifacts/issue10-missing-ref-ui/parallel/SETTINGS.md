# SETTINGS implementer (pages 33 · 34 · 43)

File: `FHbikS2jILAeMv8mote0vD`  
`skillNames: "figma-use"`. **No** `get_design_context`. **No** `resetOverrides()`. **No** edits to Bottom NAV `77:237` or header set `127:10295`.

Stills (stitch long pages; ignore status bar / Dynamic Island / keyboard; one title only):

| Page | Pack | Instance | Source |
|------|------|----------|--------|
| **33** Settings | `missing-ref/33/IMG_4475–4477.PNG` | `117:9975` | `116:18755` |
| **34** General | `missing-ref/34/IMG_4478–4481.PNG` | `117:10081` | `116:18852` |
| **43** Household | `missing-ref/42-43/IMG_4492.PNG` | `117:10383` | `116:19140` |

Page fills: iOS grouped gray `{r:0.95,g:0.95,b:0.97}`. `clipsContent: true` on sources + instances.

## 33 · Settings `116:18755` (h=1706)

PixelBase `406:14358` **hidden**. System Chrome Cover `550:6767` **hidden**. Pestle Pro Hero + Learn More stay hidden (not on the stills as a hero).

Shown reconstructed groups (single long list, no duplicated overlapping title):

- `Group / Pestle Pro` (Active)
- `Group / General Account`
- `Group / Mailing`
- `Group / Household` — Value override on tree instance set to **`ba d`** (instance had `bad`)
- `Group / Siri`
- `Group / Timers` (0 Active)
- `Group / Chrome` then `Group / How To` (y-order matches stills)
- `Group / Transfer` (Import / Export)
- `Group / Policies`
- `Group / Support`
- `Navigation Header` instance `140:14273` — one Title `"Settings"` fs 34 (green). Did **not** edit set `127:10295`.

Footer appended on the source (IMG_4477):

- `Footer Line 1` — Made with ❤ by Will, in Adelaide, Australia
- `Footer Line 2` — Pestle 3.0.14 (923)

Tree instance `117:9975` inherits PixelBase hidden (no PixelBase child left on the instance). Groups listed above are visible.

## 34 · General `116:18852` (h=2009, not clipped before Clear Image Cache)

- PixelBase `410:8050` **hidden**
- System Chrome Cover `550:6766` **hidden**
- Title Band Cover `545:12086` **hidden** (fought the real title)
- Duplicate `Title / General (vector)` `545:12087` **hidden** — header instance `158:15141` already has Title `"General"` fs 34
- Unhid existing Row / Group / Hint / Section / App Icon Thumb / Glyph / Search Engine Picker / Row / Timers / Navigation Header

Appended remaining long-page rows through **Clear Image Cache** (were missing from the source tree; stills 4479–4481):

Calendar hint + green `Open Settings` · Voice Control · Next/Back values · Clipboard Detection ON · Show Nutritional Info ON · Disable Auto-Lock OFF · Experiments / Support disclosure · Automatically Upload Crash Reports ON · Clear Image Cache Action + `10.2 MB` · support hint.

Last hint y=1928 inside h=2009, `clipsContent` true — footer hint is not clipped.

Row variants from set `157:15153` (`Settings Detail Row`): Toggle On/Off, Value, Disclosure, Action. Card `Group` rects: x=20, r=26, white fill (variable on original groups).

## 43 · Household `116:19140`

- PixelBase `406:9087` **hidden** on source; instance `117:10383` no longer lists PixelBase
- Shown: Top Bar (Back), Title `ba d`, Rename Label, Rename Field, Owner Card, Delete Card, Disclaimer
- Owner Card: hid Color Bar / Swatch; added **Invite People** (brand green `r:0 g:0.74 b:0.34`) + share glyph — matches IMG_4492 (`11` / Owner / Invite People / Delete household)
- Grouped gray page fill; white on cards only (not random page whites)

## Constraints honored

- Never `resetOverrides()` (would restore PixelBase)
- Never edit `77:237` or `127:10295`
- Header used only as instances (`140:14273`, `158:15141`); visibility/overrides on page sources only
- System chrome covers hidden (status bar ignored)
- One large title per page (33 header Settings; 34 header General vs hidden vector title; 43 reconstructed `ba d`)

## Residual vs stills (not PixelBase)

- 33 Chrome / How To / some policy glyphs are reconstructed kit icons, not the Pestle PNG marks from PixelBase
- 34 App Icon thumb / Search Engine chevrons remain simplified vs the photo glyph + dual chevron
- 43 Back control is the existing Top Bar instance (circle + chevron), not a photo-matched glass capture
