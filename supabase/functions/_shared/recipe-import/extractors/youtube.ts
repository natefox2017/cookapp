/**
 * YouTube adapter — official oEmbed + public timedtext captions.
 *
 * Evaluation (Open Source First):
 * - YouTube Data API v3 captions.download: official but requires OAuth of the
 *   video owner for most videos → not usable for third-party import.
 * - youtube-transcript / Innertube: unofficial scraping, fragile.
 * - Chosen: YouTube oEmbed (public, documented) for title/author/thumbnail,
 *   plus the public timedtext list/caption endpoints when available.
 * Missing captions stay null (Needs Review) — never invented.
 */

import { canonicalizeUrl } from "../../ssrf.ts";
import type { ExtractedContent } from "../types.ts";
import {
  extractImageCandidates,
  extractJsonLdRecipes,
  extractTitle,
  stripTags,
} from "./html.ts";
import { fetchSafeJson, fetchSafeText, oembedString } from "./fetch.ts";
import { youtubeVideoId } from "./ids.ts";

function decodeXml(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function parseTimedTextList(xml: string): string[] {
  const langs: string[] = [];
  const re = /lang_code="([^"]+)"/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(xml)) !== null) {
    langs.push(match[1]);
  }
  return langs;
}

export function parseTimedTextCaptions(xml: string): string {
  const parts: string[] = [];
  const re = /<text[^>]*>([\s\S]*?)<\/text>/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(xml)) !== null) {
    const text = decodeXml(match[1]);
    if (text) parts.push(text);
  }
  return parts.join(" ").trim();
}

function pickCaptionLang(langs: string[]): string | null {
  if (langs.length === 0) return null;
  const preferred = langs.find((l) =>
    l.toLowerCase() === "en" || l.toLowerCase().startsWith("en-")
  );
  return preferred ?? langs[0];
}

export async function extractYoutube(input: {
  source_url: string;
  htmlOverride?: string | null;
  fetchImpl?: typeof fetch;
}): Promise<ExtractedContent> {
  const notes: string[] = ["extractor:youtube_oembed"];
  const fetchImpl = input.fetchImpl ?? fetch;
  const videoId = youtubeVideoId(input.source_url);
  const canonical = videoId
    ? `https://www.youtube.com/watch?v=${videoId}`
    : canonicalizeUrl(input.source_url);

  if (!videoId) {
    notes.push("youtube_id_missing");
  }

  const oembedUrl =
    `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(canonical)}`;
  const oembed = await fetchSafeJson(oembedUrl, fetchImpl, "application/json");
  notes.push(...oembed.notes);

  let title: string | null = oembedString(oembed.data, "title");
  const author = oembedString(oembed.data, "author_name");
  const thumb = oembedString(oembed.data, "thumbnail_url");
  const captionParts = [title, author].filter((p): p is string => !!p);

  let transcript: string | null = null;
  if (videoId) {
    const list = await fetchSafeText(
      `https://www.youtube.com/api/timedtext?type=list&v=${encodeURIComponent(videoId)}`,
      fetchImpl,
      "application/xml,text/xml,text/plain",
    );
    notes.push(...list.notes.map((n) => `timedtext_list:${n}`));
    if (list.ok && list.text) {
      const langs = parseTimedTextList(list.text);
      const lang = pickCaptionLang(langs);
      if (!lang) {
        notes.push("transcript_missing");
      } else {
        const captions = await fetchSafeText(
          `https://www.youtube.com/api/timedtext?v=${encodeURIComponent(videoId)}&lang=${encodeURIComponent(lang)}`,
          fetchImpl,
          "application/xml,text/xml,text/plain",
        );
        notes.push(...captions.notes.map((n) => `timedtext:${n}`));
        if (captions.ok && captions.text) {
          transcript = parseTimedTextCaptions(captions.text) || null;
          if (transcript) notes.push("transcript_found");
          else notes.push("transcript_empty");
        } else {
          notes.push("transcript_missing");
        }
      }
    } else {
      notes.push("transcript_missing");
    }
  }

  let html = input.htmlOverride ?? null;
  const jsonLd = html ? extractJsonLdRecipes(html) : [];
  if (jsonLd.length) notes.push("json_ld_recipe_found");
  if (html) {
    title = title ?? extractTitle(html);
  }

  const fetchOk = oembed.ok || Boolean(html);
  if (!fetchOk) {
    notes.push("insufficient_source_evidence");
    const blocked = oembed.status === 401 || oembed.status === 403 || oembed.status === 404;
    if (blocked) notes.push("blocked_or_private");
  }
  if (!captionParts.length) notes.push("caption_missing");
  if (!transcript) notes.push("transcript_unavailable");

  return {
    source_type: "youtube",
    source_url: input.source_url,
    canonical_url: canonical,
    source_external_id: videoId,
    page_title: title,
    page_text: html ? stripTags(html).slice(0, 100_000) : captionParts.join("\n"),
    caption: captionParts.join(" — ") || null,
    transcript,
    metadata: {
      extractor: "youtube",
      author_name: author,
      oembed_ok: oembed.ok,
    },
    json_ld_recipes: jsonLd,
    image_candidates: [
      ...(thumb ? [{ url: thumb, alt: "youtube thumbnail" }] : []),
      ...(html ? extractImageCandidates(html) : []),
    ],
    fetch_ok: fetchOk,
    extract_notes: notes,
  };
}
