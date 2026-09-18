# Independent QA · pixel DoD batch1

**Role:** measurement QA (computerUse/Task subagent unavailable in this environment)  
**Implementer evidence reviewed:** `.cursor/walkthrough-artifacts/issue10-pixel-pass-batch1/`  
**Method:** docs JPG (status-cropped) ↔ fresh Figma `get_screenshot` @440w · MAE + side-by-side visual

```
VERDICT: FAIL
Screenshot fidelity: FAIL — none of 43/39/05/07 meet hard pixel PASS (≤~2–4px, no visible offset). Closest is 43 (MAE≈4.44) with remaining title AA/weight + rhythm deltas.
Liquid Glass: PARTIAL — 05 Back/Start frosted capsules present; 07 bottom chrome still drifts vs docs (botMae≈19). Content layers not glass-washed (OK).
Consistency (shared chrome/tokens): FAIL — 07 Cookbook active pill/icon density ≠ folders-home-expanded; 39 copy icon still heavier than Pestle thin stroke.
Control states: PASS for reviewed defaults (05 toggle OFF, presets unselected segmented; no missing default/disabled/loading invented). Hover/N/A on static Figma frames.
Violations:
1. 43 Household — title/body AA weight vs JPEG ref; Rename↔Owner vertical gaps not within 2–4px of docs.
2. 39 Account — Copy Support ID glyph stroke/weight; Active right inset; green/gray chroma shift vs account-settings.jpg.
3. 05 Timer — Duration picker fade band denser/abrupt vs create-timer.jpg; Name row separator weight; header capsule elevation residual.
4. 07 Folders — bottom NAV density (botMae≈19); list icon stroke + internal pad; Categories section gap vs folders-home-expanded.jpg.
Required redo:
- Re-touch 43 spacing/type until side-by-side shows no visible offset, then re-export.
- Replace 39 copy icon with Pestle-matched thin vector; fix Active inset.
- Rebuild 05 picker fade + Name separator to docs; re-measure midMae.
- Fix shared Bottom NAV / Folder row padding for 07; re-verify botMae.
- Re-run independent QA; only then check Issue checklist (pixel PASS only).
```

**PASS* does not count.** No Issue checklist items may be ticked from this batch.
