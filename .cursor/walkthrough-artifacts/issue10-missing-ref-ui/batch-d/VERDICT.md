# Design QA — 24 / 28 implemented (batch-d)

Figma `FHbikS2jILAeMv8mote0vD` page `37:2`. 25–27 / Meal Plan / Settings **not edited**.

## Node IDs

| Page | Instance | Source | Canvas |
|------|----------|--------|--------|
| **24 Groceries Empty** | `115:18686` | `115:7966` | x=208 y=1337 |
| 25 Groceries | `115:18854` | `115:8136` | x=848 y=1337 (untouched) |
| 26 List Menu | `119:11940` | `118:10578` | x=1488 y=1337 (untouched) |
| 27 Custom List | `119:12010` | `118:10650` | x=2128 y=1337 (untouched) |
| **28 Pantry New Item** | `119:12120` | `118:10756` | x=2768 y=1337 |
| **28b Create Shopping List** | `395:9346` | `395:9193` | x=3408 y=1337 |
| **28c Share List** | `395:9455` | `395:9302` | x=4048 y=1337 |

24b 每日任务 **not added** — 24 is canonical empty (zero rows). Closest recording empty-ish remains f014 if needed later.

## PNG → page

| File | Page |
|------|------|
| IMG_4457 filled Groceries | 25 (not 24) |
| IMG_4458 overflow menu | 26 |
| IMG_4459 Choose List | 27 |
| IMG_4460 Create Shopping List (no keyboard) | **28b** |
| IMG_4461 Share List how-to | **28c** |
| IMG_4462 Pantry noq + New item / Scan barcode | **28** |

---

### 24 · Groceries / Empty `115:18686` ← `115:7966`

Removed invented **This list is empty** (`138:13971`). Chrome: Pantry glass + … + Groceries + New Item, **zero rows**.

```
VERDICT: PASS
Screenshot fidelity: PASS — canonical empty; pack had no true empty; no marketing empty copy.
Liquid Glass: PASS — Pantry / More / tab only; list area is content white.
Consistency (shared chrome/tokens): PASS vs 25 header/tab kit.
Control states: PASS* — New Item default only (same as other grocery rows; no extra invented states).
Violations: none.
Required redo: none.
```

---

### 28 · New Item `119:12120` ← `118:10756`

Rebuilt as **IMG_4462** Pantry (search `noq`, New item, Scan barcode, helper). Choose List / invented sheet **deleted**.

```
VERDICT: PASS
Screenshot fidelity: PASS vs IMG_4462 (ignore status bar / island). App-icon glyphs N/A.
Liquid Glass: PASS — pencil / X glass only; search/list are content, not glass slabs.
Consistency: PASS — pantry chrome matches pantry.jpg / IMG_4462; does not fork 25 tab.
Control states: PASS* — New item / Scan / Close default; Create/Cancel on 28b default+filled.
Violations: none blocking.
Required redo: none.
```

---

### 28b Create List `395:9346` ← `395:9193`

IMG_4460 dialog on dimmed groceries. **No keyboard.** Background is Groceries (25) not 家庭 — PASS*.

```
VERDICT: PASS*
Screenshot fidelity: PASS* — dialog IA/copy/buttons match; list behind is Groceries not 家庭.
Liquid Glass: PASS — dialog is regular material over scrim; tab/Pantry from 25 instance.
Consistency: PASS — reuses 25 chrome.
Control states: PASS* — Cancel grey / Create green filled.
Violations: none blocking.
Required redo: none.
```

---

### 28c Share List `395:9455` ← `395:9302`

IMG_4461 structure reconstructed (no `createImageAsync`). Notes/Reminders/Clock = color tiles.

```
VERDICT: PASS*
Screenshot fidelity: PASS* — steps 1–3, menu rows, Shopping List, Collaborate; app icons simplified vectors.
Liquid Glass: PASS — X glass only; sheet is content.
Consistency: PASS — does not restyle 25–27.
Control states: PASS* — Close default; Delete destructive red.
Violations: none blocking (icon photos not encoded).
Required redo: none.
```

---

**Overall: PASS** (24 PASS, 28 PASS, extras PASS*).
