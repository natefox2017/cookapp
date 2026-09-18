/**
 * ContentExtractor — fetch + deterministic extract.
 * schema.org / JSON-LD Recipe ALWAYS preferred over AI reconstruction.
 * TikTok / Instagram / YouTube use platform adapters (not generic HTML only).
 */

import { assertSafeOutboundUrl, canonicalizeUrl } from "../ssrf.ts";
import type { ExtractedContent, SourceType } from "./types.ts";
import {
  extractImageCandidates,
  extractJsonLdRecipes,
  extractTitle,
  stripTags,
} from "./extractors/html.ts";
import { extractYoutube } from "./extractors/youtube.ts";
import { extractTiktok } from "./extractors/tiktok.ts";
import { extractInstagram } from "./extractors/instagram.ts";

export { extractJsonLdRecipes } from "./extractors/html.ts";

export interface ExtractInput {
  source_type: SourceType;
  source_url: string | null;
  source_text?: string | null;
  /** Injected for tests — bypasses network. */
  htmlOverride?: string | null;
  fetchImpl?: typeof fetch;
}

function emptyExtract(
  source_type: SourceType,
  source_url: string | null,
  notes: string[],
  extras: Partial<ExtractedContent> = {},
): ExtractedContent {
  return {
    source_type,
    source_url,
    canonical_url: source_url ? canonicalizeUrl(source_url) : null,
    source_external_id: null,
    page_title: null,
    page_text: null,
    caption: null,
    transcript: null,
    metadata: {},
    json_ld_recipes: [],
    image_candidates: [],
    fetch_ok: false,
    extract_notes: notes,
    ...extras,
  };
}

export async function extractContent(
  input: ExtractInput,
): Promise<ExtractedContent> {
  const notes: string[] = [];

  if (input.source_type === "text") {
    const text = (input.source_text ?? "").trim();
    return {
      source_type: "text",
      source_url: null,
      canonical_url: null,
      source_external_id: null,
      page_title: null,
      page_text: text,
      caption: text,
      transcript: null,
      metadata: {},
      json_ld_recipes: [],
      image_candidates: [],
      fetch_ok: true,
      extract_notes: ["text_paste"],
    };
  }

  if (input.source_type === "xiaohongshu") {
    return emptyExtract("xiaohongshu", input.source_url, [
      "xiaohongshu_extraction_not_enabled",
    ]);
  }

  if (!input.source_url) {
    return emptyExtract(input.source_type, null, ["missing_source_url"]);
  }

  if (input.source_type === "youtube") {
    return await extractYoutube({
      source_url: input.source_url,
      htmlOverride: input.htmlOverride,
      fetchImpl: input.fetchImpl,
    });
  }
  if (input.source_type === "tiktok") {
    return await extractTiktok({
      source_url: input.source_url,
      fetchImpl: input.fetchImpl,
    });
  }
  if (input.source_type === "instagram") {
    return await extractInstagram({
      source_url: input.source_url,
      htmlOverride: input.htmlOverride,
      fetchImpl: input.fetchImpl,
    });
  }

  let html = input.htmlOverride ?? null;
  let fetchOk = true;

  if (html == null) {
    const safety = assertSafeOutboundUrl(input.source_url);
    if (!safety.ok) {
      return emptyExtract(input.source_type, input.source_url, [
        `ssrf_blocked:${safety.reason}`,
      ], { canonical_url: null, metadata: { ssrf_reason: safety.reason } });
    }

    const fetchFn = input.fetchImpl ?? fetch;
    try {
      const res = await fetchFn(safety.url.toString(), {
        redirect: "manual",
        headers: {
          "User-Agent": "CookAppRecipeImportBot/1.0",
          Accept: "text/html,application/xhtml+xml",
        },
      });
      if (res.status >= 300 && res.status < 400) {
        const loc = res.headers.get("location");
        if (!loc) {
          fetchOk = false;
          notes.push("redirect_without_location");
        } else {
          const abs = new URL(loc, safety.url).toString();
          const recheck = assertSafeOutboundUrl(abs);
          if (!recheck.ok) {
            return emptyExtract(input.source_type, input.source_url, [
              `ssrf_blocked_redirect:${recheck.reason}`,
            ], {
              canonical_url: null,
              metadata: { ssrf_reason: recheck.reason, redirect: abs },
            });
          }
          const res2 = await fetchFn(recheck.url.toString(), {
            redirect: "follow",
            headers: {
              "User-Agent": "CookAppRecipeImportBot/1.0",
              Accept: "text/html,application/xhtml+xml",
            },
          });
          if (!res2.ok) {
            fetchOk = false;
            notes.push(`http_${res2.status}`);
          } else {
            html = await res2.text();
          }
        }
      } else if (!res.ok) {
        fetchOk = false;
        notes.push(`http_${res.status}`);
      } else {
        html = await res.text();
      }
    } catch (err) {
      fetchOk = false;
      notes.push(`fetch_error:${err instanceof Error ? err.message : "unknown"}`);
    }
  }

  if (!html) {
    return emptyExtract(
      input.source_type,
      input.source_url,
      notes.length ? notes : ["empty_html"],
    );
  }

  const jsonLd = extractJsonLdRecipes(html);
  if (jsonLd.length > 0) {
    notes.push("json_ld_recipe_found");
  } else {
    notes.push("json_ld_recipe_missing");
  }

  return {
    source_type: input.source_type,
    source_url: input.source_url,
    canonical_url: canonicalizeUrl(input.source_url),
    source_external_id: null,
    page_title: extractTitle(html),
    page_text: stripTags(html).slice(0, 100_000),
    caption: null,
    transcript: null,
    metadata: { content_length: html.length, extractor: "web_html" },
    json_ld_recipes: jsonLd,
    image_candidates: extractImageCandidates(html),
    fetch_ok: fetchOk,
    extract_notes: notes,
  };
}
