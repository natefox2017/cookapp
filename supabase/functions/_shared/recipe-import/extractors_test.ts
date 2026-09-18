/**
 * TikTok / Instagram / YouTube extractor fixtures (#55 / #61).
 * Run: deno test --allow-env supabase/functions/_shared/recipe-import/
 */

import { assertEquals, assertStringIncludes } from "jsr:@std/assert@1";
import { extractContent } from "./content-extractor.ts";
import {
  instagramShortcode,
  tiktokVideoId,
  youtubeVideoId,
} from "./extractors/ids.ts";
import { parseTimedTextCaptions, parseTimedTextList } from "./extractors/youtube.ts";

const YOUTUBE_OEMBED = {
  title: "Weeknight Tomato Pasta",
  author_name: "Cook Channel",
  thumbnail_url: "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
};

const TIKTOK_OEMBED = {
  title: "Garlic noodles in 5 minutes",
  author_name: "@homekitchen",
  thumbnail_url: "https://example.com/tiktok-thumb.jpg",
};

const TIMEDTEXT_LIST = `<?xml version="1.0"?><transcript_list>
  <track lang_code="es" />
  <track lang_code="en" />
</transcript_list>`;

const TIMEDTEXT_EN = `<?xml version="1.0"?><transcript>
  <text start="0">Boil water</text>
  <text start="2">Add pasta and tomatoes</text>
</transcript>`;

const INSTAGRAM_HTML = `<!doctype html><html><head>
<meta property="og:title" content="Sheet pan salmon">
<meta property="og:description" content="Lemon salmon with asparagus">
<meta property="og:image" content="https://example.com/ig.jpg">
<title>Instagram</title>
</head><body>login wall leftover</body></html>`;

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function textResponse(body: string, status = 200, type = "text/xml"): Response {
  return new Response(body, { status, headers: { "content-type": type } });
}

Deno.test("platform ids parse from canonical URLs", () => {
  assertEquals(youtubeVideoId("https://youtu.be/dQw4w9WgXcQ"), "dQw4w9WgXcQ");
  assertEquals(
    youtubeVideoId("https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=12"),
    "dQw4w9WgXcQ",
  );
  assertEquals(
    youtubeVideoId("https://www.youtube.com/shorts/dQw4w9WgXcQ"),
    "dQw4w9WgXcQ",
  );
  assertEquals(tiktokVideoId("https://www.tiktok.com/@x/video/7123456789"), "7123456789");
  assertEquals(instagramShortcode("https://www.instagram.com/p/AbC_123/"), "AbC_123");
  assertEquals(instagramShortcode("https://www.instagram.com/reel/Zz9/"), "Zz9");
});

Deno.test("YouTube adapter uses oEmbed + timedtext, not generic HTML only", async () => {
  const fetchImpl: typeof fetch = async (input) => {
    const url = String(input);
    if (url.includes("oembed")) return jsonResponse(YOUTUBE_OEMBED);
    if (url.includes("timedtext") && url.includes("type=list")) {
      return textResponse(TIMEDTEXT_LIST);
    }
    if (url.includes("timedtext")) return textResponse(TIMEDTEXT_EN);
    return textResponse("unexpected", 500);
  };

  const extracted = await extractContent({
    source_type: "youtube",
    source_url: "https://youtu.be/dQw4w9WgXcQ",
    fetchImpl,
  });

  assertEquals(extracted.fetch_ok, true);
  assertEquals(extracted.source_external_id, "dQw4w9WgXcQ");
  assertEquals(extracted.caption?.includes("Weeknight Tomato Pasta"), true);
  assertEquals(extracted.transcript?.includes("Add pasta"), true);
  assertStringIncludes(extracted.extract_notes.join(","), "extractor:youtube_oembed");
  assertEquals(extracted.metadata.extractor, "youtube");
});

Deno.test("YouTube private/blocked video does not invent captions", async () => {
  const fetchImpl: typeof fetch = async () => jsonResponse({ error: "not found" }, 404);
  const extracted = await extractContent({
    source_type: "youtube",
    source_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    fetchImpl,
  });
  assertEquals(extracted.fetch_ok, false);
  assertEquals(extracted.caption, null);
  assertEquals(extracted.transcript, null);
  assertEquals(extracted.extract_notes.includes("blocked_or_private"), true);
  assertEquals(extracted.extract_notes.includes("insufficient_source_evidence"), true);
});

Deno.test("TikTok adapter uses official oEmbed caption", async () => {
  const fetchImpl: typeof fetch = async (input) => {
    const url = String(input);
    if (url.includes("tiktok.com/oembed")) return jsonResponse(TIKTOK_OEMBED);
    return textResponse("nope", 500);
  };
  const extracted = await extractContent({
    source_type: "tiktok",
    source_url: "https://www.tiktok.com/@homekitchen/video/7123456789",
    fetchImpl,
  });
  assertEquals(extracted.fetch_ok, true);
  assertEquals(extracted.source_external_id, "7123456789");
  assertEquals(extracted.caption?.includes("Garlic noodles"), true);
  assertEquals(extracted.transcript, null);
  assertStringIncludes(extracted.extract_notes.join(","), "extractor:tiktok_oembed");
});

Deno.test("TikTok blocked source stays insufficient evidence", async () => {
  const fetchImpl: typeof fetch = async () => jsonResponse({}, 403);
  const extracted = await extractContent({
    source_type: "tiktok",
    source_url: "https://www.tiktok.com/@x/video/1",
    fetchImpl,
  });
  assertEquals(extracted.fetch_ok, false);
  assertEquals(extracted.caption, null);
  assertEquals(extracted.extract_notes.includes("blocked_or_private"), true);
});

Deno.test("Instagram adapter uses OG tags when oEmbed token is missing", async () => {
  Deno.env.delete("INSTAGRAM_OEMBED_ACCESS_TOKEN");
  Deno.env.delete("FACEBOOK_OEMBED_ACCESS_TOKEN");
  const extracted = await extractContent({
    source_type: "instagram",
    source_url: "https://www.instagram.com/p/AbC_123/",
    htmlOverride: INSTAGRAM_HTML,
  });
  assertEquals(extracted.fetch_ok, true);
  assertEquals(extracted.source_external_id, "AbC_123");
  assertEquals(extracted.caption, "Lemon salmon with asparagus");
  assertEquals(extracted.transcript, null);
  assertStringIncludes(extracted.extract_notes.join(","), "instagram_oembed_token_missing");
});

Deno.test("Instagram private HTML wall is blocked/insufficient", async () => {
  Deno.env.delete("INSTAGRAM_OEMBED_ACCESS_TOKEN");
  const fetchImpl: typeof fetch = async () => textResponse("login", 403, "text/html");
  const extracted = await extractContent({
    source_type: "instagram",
    source_url: "https://www.instagram.com/p/private1/",
    fetchImpl,
  });
  assertEquals(extracted.fetch_ok, false);
  assertEquals(extracted.caption, null);
  assertEquals(extracted.extract_notes.includes("blocked_or_private"), true);
  assertEquals(extracted.extract_notes.includes("insufficient_source_evidence"), true);
});

Deno.test("timedtext helpers parse list + captions", () => {
  assertEquals(parseTimedTextList(TIMEDTEXT_LIST), ["es", "en"]);
  assertEquals(parseTimedTextCaptions(TIMEDTEXT_EN), "Boil water Add pasta and tomatoes");
});
