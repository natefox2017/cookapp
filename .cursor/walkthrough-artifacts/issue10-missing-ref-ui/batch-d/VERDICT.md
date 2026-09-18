# Design QA — batch D (24 empty FAIL redo)

Figma `FHbikS2jILAeMv8mote0vD` page `37:2`. Edited **sources only**. Did **not** edit Bottom NAV `77:237`, 25/26/27 sources, 03–22, or 31–49.

## Node IDs

| Page | Instance | Source | Canvas |
|------|----------|--------|--------|
| **24 Groceries Empty** | `115:18686` | `115:7966` | x=208 y=1337 |
| 25 Groceries (untouched) | `115:18854` | `115:8136` | x=848 y=1337 |
| 26 List Menu (untouched) | `119:11940` | `118:10578` | — |
| 27 Custom List (untouched) | `119:12010` | `118:10650` | — |
| **28 Pantry New Item** | `119:12120` | `118:10756` | x=2768 y=1337 |
| **28b Create Shopping List** | `395:9346` | `395:9193` | x=3408 y=1337 |
| **28c Share List** | `395:9455` | `395:9302` | x=4048 y=1337 |

## PNG → page

| File | Page |
|------|------|
| IMG_4457 filled Groceries | 25 (not 24) |
| IMG_4458 overflow menu | 26 |
| IMG_4459 Choose List | 27 |
| IMG_4460 Create Shopping List (no keyboard) | 28b |
| IMG_4461 Share List how-to | 28c |
| IMG_4462 Pantry `noq` + New item / Scan barcode | 28 |

---

### 24 · Groceries / Empty `115:18686` ← `115:7966`

**Root bug closed.** PixelBase `423:9109` **visible: false** (was the filled IMG_4457 list). White fill on source. Unhid kit chrome: Pantry `196:24760`, Navigation Header `128:24884` (Title **Groceries**, Trailing More), Bottom Chrome `115:7991` (Groceries selected — **not** restyled), `+` New Item ellipse/icon/text. **Zero ingredient rows.** No “This list is empty” caption.

Post-fix `use_figma` screenshot of instance `115:18686`: white empty list, Pantry glass pill, More, green title, New Item row, floating tab Groceries selected. **Does not match** `verify/24.png` filled list.

```
VERDICT: PASS
Screenshot fidelity: PASS — empty groceries chrome vs IMG_4457 header/tab only; no filled rows.
Liquid Glass: PASS — Pantry / More / tab only; list body opaque white.
Consistency (shared chrome/tokens): PASS — reused 25 header/Pantry/tab instances; tab kit untouched.
Control states: PASS* — New Item default only.
Violations: none blocking.
Required redo: none.
```

---

### 28 · New Item `119:12120` ← `118:10756`

PixelBase `423:3837` hidden. Reconstructed `395:9161` unhidden. Screenshot vs IMG_4462: pencil / X glass, title Pantry, search `noq` + info, New item, Scan barcode, helper copy. Ignore keyboard.

```
VERDICT: PASS
Screenshot fidelity: PASS vs IMG_4462 (ignore status bar / island / keyboard).
Liquid Glass: PASS — pencil / X only; search + rows are content, not glass slabs.
Consistency: PASS — does not fork 25 tab bar.
Control states: PASS* — New item / Scan / Close default.
Violations: none blocking (scan glyph is a barcode, not camera viewfinder).
Required redo: none.
```

---

### 28b Create List `395:9346` ← `395:9193`

IMG_4460 dialog on dimmed **Groceries** (25 instance), not 家庭. No keyboard. Cancel grey / Create green / field “Groceries”.

```
VERDICT: PASS*
Screenshot fidelity: PASS* — dialog IA/copy/buttons match; background is filled Groceries.
Liquid Glass: PASS — dialog over scrim; Pantry/More/tab come from 25 PixelBase (untouched).
Consistency: PASS — does not restyle shared tab kit.
Control states: PASS* — Cancel / Create default+filled.
Violations: none blocking.
Required redo: none.
```

---

### 28c Share List `395:9455` ← `395:9302`

In-app how-to (not a system share sheet). Steps 1–3, Notes/Reminders/Clock vector tiles, Pin / Show List Info / Share List / Delete List, Shopping List row, Collaborate card.

```
VERDICT: PASS*
Screenshot fidelity: PASS* — structure matches IMG_4461; app icons are SVG reconstructions, not iOS photos.
Liquid Glass: PASS — Close glass only; sheet content opaque.
Consistency: PASS — extras sit right of groceries row; 25–27 not edited.
Control states: PASS* — Close default; Delete destructive red.
Violations: (1) Notes/Reminders/Clock are vector stand-ins. (2) Collaborate card has no people glyph / card X (stray icon hidden).
Required redo: none blocking.
```

---

**Overall: PASS** (24 empty FAIL closed; 28 PASS; 28b/28c PASS*).
