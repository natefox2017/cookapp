/**
 * ContentExtractor — fetch + deterministic extract.
 * schema.org / JSON-LD Recipe ALWAYS preferred over AI reconstruction.
 */

import { assertSafeOutboundUrl, canonicalizeUrl } from "../ssrf.ts";
import type { ExtractedContent, SourceType } from "./types.ts";

export interface ExtractInput {
  source_type: SourceType;
  source_url: string | null;
  source_text?: string | null;
  /** Injected for tests — bypasses network. */
  htmlOverride?: string | null;
  fetchImpl?: typeof fetch;
}

function stripTags(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractTitle(html: string): string | null {
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (!m) return null;
  return stripTags(m[1]).trim() || null;
}

/** Parse <script type="application/ld+json"> blocks and collect Recipe nodes. */
export function extractJsonLdRecipes(html: string): unknown[] {
  const recipes: unknown[] = [];
  const re =
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(html)) !== null) {
    const raw = match[1].trim();
    if (!raw) continue;
    try {
      const parsed = JSON.parse(raw);
      collectRecipes(parsed, recipes);
    } catch {
      // ignore invalid JSON-LD blocks
    }
  }
  return recipes;
}

function collectRecipes(node: unknown, out: unknown[]): void {
  if (node == null) return;
  if (Array.isArray(node)) {
    for (const item of node) collectRecipes(item, out);
    return;
  }
  if (typeof node !== "object") return;
  const obj = node as Record<string, unknown>;
  if (Array.isArray(obj["@graph"])) {
    collectRecipes(obj["@graph"], out);
  }
  const typeVal = obj["@type"];
  const types = Array.isArray(typeVal)
    ? typeVal.map(String)
    : typeVal != null
    ? [String(typeVal)]
    : [];
  if (types.some((t) => t.toLowerCase() === "recipe" || t.endsWith("/recipe"))) {
    out.push(obj);
  }
}

function extractImageCandidates(html: string): ExtractedContent["image_candidates"] {
  const out: ExtractedContent["image_candidates"] = [];
  const og = html.match(
    /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
  );
  if (og?.[1]) out.push({ url: og[1], alt: "og:image" });
  const imgRe = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
  let m: RegExpExecArray | null;
  let count = 0;
  while ((m = imgRe.exec(html)) !== null && count < 8) {
    out.push({ url: m[1], alt: null });
    count += 1;
  }
  return out;
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
    return {
      source_type: "xiaohongshu",
      source_url: input.source_url,
      canonical_url: input.source_url ? canonicalizeUrl(input.source_url) : null,
      source_external_id: null,
      page_title: null,
      page_text: null,
      caption: null,
      transcript: null,
      metadata: {},
      json_ld_recipes: [],
      image_candidates: [],
      fetch_ok: false,
      extract_notes: ["xiaohongshu_extraction_not_enabled"],
    };
  }

  if (!input.source_url) {
    return {
      source_type: input.source_type,
      source_url: null,
      canonical_url: null,
      source_external_id: null,
      page_title: null,
      page_text: null,
      caption: null,
      transcript: null,
      metadata: {},
      json_ld_recipes: [],
      image_candidates: [],
      fetch_ok: false,
      extract_notes: ["missing_source_url"],
    };
  }

  let html = input.htmlOverride ?? null;
  let fetchOk = true;

  if (html == null) {
    const safety = assertSafeOutboundUrl(input.source_url);
    if (!safety.ok) {
      return {
        source_type: input.source_type,
        source_url: input.source_url,
        canonical_url: null,
        source_external_id: null,
        page_title: null,
        page_text: null,
        caption: null,
        transcript: null,
        metadata: { ssrf_reason: safety.reason },
        json_ld_recipes: [],
        image_candidates: [],
        fetch_ok: false,
        extract_notes: [`ssrf_blocked:${safety.reason}`],
      };
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
      // Re-validate redirects
      if (res.status >= 300 && res.status < 400) {
        const loc = res.headers.get("location");
        if (!loc) {
          fetchOk = false;
          notes.push("redirect_without_location");
        } else {
          const abs = new URL(loc, safety.url).toString();
          const recheck = assertSafeOutboundUrl(abs);
          if (!recheck.ok) {
            return {
              source_type: input.source_type,
              source_url: input.source_url,
              canonical_url: null,
              source_external_id: null,
              page_title: null,
              page_text: null,
              caption: null,
              transcript: null,
              metadata: { ssrf_reason: recheck.reason, redirect: abs },
              json_ld_recipes: [],
              image_candidates: [],
              fetch_ok: false,
              extract_notes: [`ssrf_blocked_redirect:${recheck.reason}`],
            };
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
    return {
      source_type: input.source_type,
      source_url: input.source_url,
      canonical_url: canonicalizeUrl(input.source_url),
      source_external_id: null,
      page_title: null,
      page_text: null,
      caption: null,
      transcript: null,
      metadata: {},
      json_ld_recipes: [],
      image_candidates: [],
      fetch_ok: false,
      extract_notes: notes.length ? notes : ["empty_html"],
    };
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
    metadata: { content_length: html.length },
    json_ld_recipes: jsonLd,
    image_candidates: extractImageCandidates(html),
    fetch_ok: fetchOk,
    extract_notes: notes,
  };
}
