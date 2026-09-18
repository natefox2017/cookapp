# Independent QA — missing-ref batch 4

Compared live Figma exports in `batch4/figma/` to owner pack under `docs/ui-screenshots/missing-ref/16-21/` (copies in `batch4/refs/`). Side-by-sides in `batch4/sides/`. Rules: ui-screenshots (ignore status bar / Dynamic Island / keyboard), ui-fidelity, ui-consistency-lock, liquid-glass (chrome only).

```
VERDICT: PASS
Screenshot fidelity: PASS* for 16/17/18/19 — structure + IA match owner; 21 PASS* vs formal Add Recipe Menu (IMG_4446 is Search browse, not this formal page). Residuals = photo encode (18), servings glyph (16), badge carrot art (18).
Liquid Glass: PASS — More / list / search pills / Scope Include / Add Recipe popover on nav/chrome layer; content cards/history remain opaque media (not glass slabs).
Consistency (shared chrome/tokens): PASS — green Large Search title, Glass More, list+search bottom chrome reused across 16/17/19; Scope menu matches Include IA.
Control states: PASS* — History present (16); Focused empty (17); Results query=1 (18); Scope History-only check (19); Add Recipe menu default (21). Hover/disabled N/A for static Design QA frames.
Violations: (none blocking)
  1. 18 card photos / Matches Ingredient badge art residual vs owner encode (PASS*).
  2. 16 servings badge is numeric-only (no people glyph) (PASS*).
  3. 21 owner pack still IMG_4446 is Search section-browse — formal tree page is Cookbook Add Recipe Menu; do not invent merge of the two (PASS* / mapping note).
Required redo: none for this batch gate — address residuals in a later polish pass if Owner rejects PASS*.
```

Per-page: **16 PASS*** · **17 PASS*** · **18 PASS*** · **19 PASS*** · **21 PASS***
