/**
 * TikTok adapter — official oEmbed.
 *
 * Evaluation (Open Source First):
 * - TikTok oEmbed (`https://www.tiktok.com/oembed`) is the documented public API.
 * - Unofficial downloaders / headless scrapers are rejected (ToS + fragility).
 * TikTok does not publish a public transcript API; transcript stays null.
 */

import { canonicalizeUrl } from "../../ssrf.ts";
import type { ExtractedContent } from "../types.ts";
import { fetchSafeJson, oembedString } from "./fetch.ts";
import { tiktokVideoId } from "./ids.ts";

export async function extractTiktok(input: {
  source_url: string;
  fetchImpl?: typeof fetch;
}): Promise<ExtractedContent> {
  const notes: string[] = ["extractor:tiktok_oembed"];
  const fetchImpl = input.fetchImpl ?? fetch;
  const videoId = tiktokVideoId(input.source_url);
  const canonical = canonicalizeUrl(input.source_url);
  if (!videoId) notes.push("tiktok_id_missing");

  const oembedUrl =
    `https://www.tiktok.com/oembed?url=${encodeURIComponent(input.source_url)}`;
  const oembed = await fetchSafeJson(oembedUrl, fetchImpl, "application/json");
  notes.push(...oembed.notes);

  const title = oembedString(oembed.data, "title");
  const author = oembedString(oembed.data, "author_name");
  const thumb = oembedString(oembed.data, "thumbnail_url");
  const caption = [title, author].filter((p): p is string => !!p).join(" — ") ||
    null;

  if (!oembed.ok) {
    notes.push("insufficient_source_evidence");
    if (oembed.status === 401 || oembed.status === 403 || oembed.status === 404) {
      notes.push("blocked_or_private");
    }
  }
  if (!caption) notes.push("caption_missing");
  notes.push("transcript_unavailable");

  return {
    source_type: "tiktok",
    source_url: input.source_url,
    canonical_url: canonical,
    source_external_id: videoId,
    page_title: title,
    page_text: caption,
    caption,
    transcript: null,
    metadata: {
      extractor: "tiktok",
      author_name: author,
      oembed_ok: oembed.ok,
    },
    json_ld_recipes: [],
    image_candidates: thumb ? [{ url: thumb, alt: "tiktok thumbnail" }] : [],
    fetch_ok: oembed.ok,
    extract_notes: notes,
  };
}
