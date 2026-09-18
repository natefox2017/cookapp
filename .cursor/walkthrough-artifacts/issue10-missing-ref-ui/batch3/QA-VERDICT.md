# Independent QA — missing-ref batch 3

Compared live Figma exports in `batch3/figma/` to owner pack under `docs/ui-screenshots/missing-ref/` (copies in `batch3/refs/`). Side-by-sides in `batch3/sides/`. Rules: ui-screenshots (ignore status bar / Dynamic Island / keyboard), ui-fidelity, ui-consistency-lock, liquid-glass (chrome only).

```
VERDICT: PASS
Screenshot fidelity: PASS* for 36/38/40/42/44 — structure + IA match owner; residuals = illustration art (40), sheet outer radius, Example truncation (36), mint shade (42).
Liquid Glass: PASS — floating Back/Close/Add chrome on nav layer; content lists/toggles remain opaque white cards (not glass slabs).
Consistency (shared chrome/tokens): PASS — green Large titles, Settings Detail Row toggles, Glass / Top Button reused across 36/38/42/44.
Control states: PASS* — all Markdown toggles ON; Experiments toggles OFF; Join/Get started defaults; Timers empty. Hover/disabled N/A for static Design QA frames (Notes disabled-input long slices noted for later).
Violations: (none blocking)
  1. 40 Create Account line-art is simplified vs owner continuous-line cook illustration (PASS* residual).
  2. 40 includes glass Back; owner sheet crop has no back control (PASS* residual).
  3. 36 Example body truncates at 956 frame; owner mid/bot slices cover long notes (PASS* / long-page).
  4. 42 Join mint shade and vertical rhythm slightly looser than owner (PASS* residual).
Required redo: none for this batch gate — address residuals in a later polish pass if Owner rejects PASS*.
```

Per-page: **36 PASS*** · **38 PASS*** · **40 PASS*** · **42 PASS*** · **44 PASS***
