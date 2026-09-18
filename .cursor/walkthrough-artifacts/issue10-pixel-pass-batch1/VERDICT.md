# Issue #10 · Pixel DoD batch1 · VERDICT

**Branch:** `cursor/pixel-pass-settings-timer-4b9d`  
**Figma:** `FHbikS2jILAeMv8mote0vD` / page `37:2` (white-only Interaction Tree)  
**DoD:** pixel-level PASS only — **PASS* does not count**  
**Ignore:** status bar / Dynamic Island / keyboard  
**Evidence:** `.cursor/walkthrough-artifacts/issue10-pixel-pass-batch1/`

## Batch scope
| Page | Node | Source | Ref |
|------|------|--------|-----|
| **43** Household | `117:10383` | `116:19140` | `household-settings.jpg` |
| **39** Account | `117:10235` | `116:18996` | `account-settings.jpg` |
| **05** Timer | `116:18318` | `116:8985` | `create-timer.jpg` |
| **07** Folders | `115:19093` | `115:8375` | `folders-home-expanded.jpg` |

## Figma changes this batch
- **43:** Rename/Delete corner radius → 24 (pill); pale mint bar/swatch; owner card r16; disclaimer centered; rename text pad
- **39:** Hide heavy text glyph; thin copy SVG; card row padding
- **05:** Segmented presets cleared of chip fills; header capsules frosted; name field flatten
- **07:** Folder Row set separators widened (7/10 variants x16/w368)

## Live MAE (status-stripped @440w)

| Page | full | chrome | mid | bot | Pixel verdict |
|------|-----:|-------:|----:|----:|---|
| **43** | **4.44** | 3.32 | 5.18 | 1.49 | **FAIL** (closest; AA/weight + ≤few-px rhythm still visible) |
| **39** | **6.50** | 3.97 | 7.85 | 1.49 | **FAIL** (copy icon weight; Active inset; green/gray shift) |
| **05** | **8.71** | 5.22 | 10.63 | 1.49 | **FAIL** (picker fade density; Name separator; chrome residual) |
| **07** | **10.22** | 6.73 | 9.08 | 19.25 | **FAIL** (nav density bot; list pad/icon stroke; section gaps) |

## Checklist
**Do not check** any of 43/39/05/07 on Issue #10 under pixel DoD.

## Compare artifacts
- `compare/{43,39,05,07}-side-final.png`
- `compare/{43,39,05,07}-diff-final.png`
- `figma/*.png` · `REPORT.json`

## Remaining gaps (actionable)
1. **43** — match Inter vs SF AA / title weight; Rename↔Owner vertical gaps within 2–4px of docs
2. **39** — copy glyph must match Pestle thin stroke; Active right inset ≈ docs; brand green hex
3. **05** — picker bottom fade band + Name underline weight; Back/Start elevation vs docs flatter pills
4. **07** — shared Bottom NAV botMae≈19; Folder+ chrome; card internal left pad; remaining 3 separator variants

## Notes
- Education Figma MCP quota throttled this run (≈1 call / few min). Fresh exports still captured for all four.
- **47/48** not invented. **03** not in this batch.
- Issue **kept OPEN**. No Acceptance ticks.
