/**
 * Instagram adapter — official oEmbed when a token is configured, else OG tags.
 *
 * Evaluation (Open Source First):
 * - Facebook Graph `instagram_oembed` is the documented API (app token required).
 * - Unofficial private Graph / mobile API scrapers are rejected.
 * - Without `INSTAGRAM_OEMBED_ACCESS_TOKEN`, we only use SSRF-safe HTML Open Graph
 *   tags if the page is actually returned. Login walls → insufficient evidence.
 */

import { canonicalizeUrl } from "../../ssrf.ts";
import type { ExtractedContent } from "../types.ts";
import {
  extractImageCandidates,
  extractJsonLdRecipes,
  extractMeta,
  extractTitle,
  stripTags,
} from "./html.ts";
import { fetchSafeJson, fetchSafeText, oembedString } from "./fetch.ts";
import { instagramShortcode } from "./ids.ts";

function instagramOembedToken(): string | null {
  const token = Deno.env.get("INSTAGRAM_OEMBED_ACCESS_TOKEN") ??
    Deno.env.get("FACEBOOK_OEMBED_ACCESS_TOKEN");
  return token && token.trim() ? token.trim() : null;
}

export async function extractInstagram(input: {
  source_url: string;
  htmlOverride?: string | null;
  fetchImpl?: typeof fetch;
}): Promise<ExtractedContent> {
  const notes: string[] = ["extractor:instagram"];
  const fetchImpl = input.fetchImpl ?? fetch;
  const shortcode = instagramShortcode(input.source_url);
  const canonical = canonicalizeUrl(input.source_url);
  if (!shortcode) notes.push("instagram_shortcode_missing");

  let title: string | null = null;
  let caption: string | null = null;
  let author: string | null = null;
  let thumb: string | null = null;
  let oembedOk = false;

  const token = instagramOembedToken();
  if (token) {
    notes.push("instagram_oembed_token_configured");
    const oembedUrl =
      `https://graph.facebook.com/v21.0/instagram_oembed?url=${encodeURIComponent(input.source_url)}&access_token=${encodeURIComponent(token)}`;
    const oembed = await fetchSafeJson(oembedUrl, fetchImpl, "application/json");
    notes.push(...oembed.notes.map((n) => `oembed:${n}`));
    oembedOk = oembed.ok;
    title = oembedString(oembed.data, "title");
    author = oembedString(oembed.data, "author_name");
    thumb = oembedString(oembed.data, "thumbnail_url");
    caption = oembedString(oembed.data, "title") ??
      oembedString(oembed.data, "author_name");
    if (!oembed.ok && (oembed.status === 401 || oembed.status === 403 || oembed.status === 404)) {
      notes.push("blocked_or_private");
    }
  } else {
    notes.push("instagram_oembed_token_missing");
  }

  let html = input.htmlOverride ?? null;
  if (!html && !oembedOk) {
    const page = await fetchSafeText(
      input.source_url,
      fetchImpl,
      "text/html,application/xhtml+xml",
    );
    notes.push(...page.notes.map((n) => `html:${n}`));
    if (page.ok) html = page.text;
    if (!page.ok && (page.status === 401 || page.status === 403 || page.status === 404)) {
      notes.push("blocked_or_private");
    }
  }

  const jsonLd = html ? extractJsonLdRecipes(html) : [];
  if (html) {
    title = title ?? extractMeta(html, "og:title") ?? extractTitle(html);
    caption = caption ?? extractMeta(html, "og:description") ?? title;
    author = author ?? extractMeta(html, "og:site_name");
    thumb = thumb ?? extractMeta(html, "og:image");
    if (jsonLd.length) notes.push("json_ld_recipe_found");
  }

  const fetchOk = oembedOk || Boolean(html && (title || caption));
  if (!fetchOk) notes.push("insufficient_source_evidence");
  if (!caption) notes.push("caption_missing");
  notes.push("transcript_unavailable");

  return {
    source_type: "instagram",
    source_url: input.source_url,
    canonical_url: canonical,
    source_external_id: shortcode,
    page_title: title,
    page_text: html ? stripTags(html).slice(0, 100_000) : caption,
    caption,
    transcript: null,
    metadata: {
      extractor: "instagram",
      author_name: author,
      oembed_ok: oembedOk,
    },
    json_ld_recipes: jsonLd,
    image_candidates: [
      ...(thumb ? [{ url: thumb, alt: "instagram image" }] : []),
      ...(html ? extractImageCandidates(html) : []),
    ],
    fetch_ok: fetchOk,
    extract_notes: notes,
  };
}
