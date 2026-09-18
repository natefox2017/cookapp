/** Media/Text Normalizer — prefer JSON-LD deterministic recipe. */

import { structuredFromJsonLd } from "./anti-hallucination.ts";
import type { ExtractedContent, NormalizedContent } from "./types.ts";

export function normalizeContent(extracted: ExtractedContent): NormalizedContent {
  const jsonLd = (extracted.json_ld_recipes[0] ?? null) as Record<string, unknown> | null;
  const deterministic = jsonLd
    ? structuredFromJsonLd(jsonLd, extracted.canonical_url, extracted.source_type)
    : null;

  const textParts = [
    extracted.page_title,
    extracted.caption,
    extracted.transcript,
    extracted.page_text,
  ].filter((p): p is string => !!p && p.trim().length > 0);

  return {
    text: textParts.join("\n\n").slice(0, 120_000),
    json_ld_recipe: jsonLd,
    deterministic_recipe: deterministic,
    image_candidates: extracted.image_candidates,
    source_type: extracted.source_type,
    canonical_url: extracted.canonical_url,
  };
}
