/** SourceResolver — detect platform from URL or text paste. */

import type { SourceType } from "./types.ts";

export interface ResolveInput {
  source_url?: string | null;
  source_text?: string | null;
}

export interface ResolveResult {
  ok: boolean;
  source_type: SourceType;
  source_url: string | null;
  canonical_host: string | null;
  error_code?: "RESOLVE_FAILED" | "SOURCE_UNSUPPORTED";
  error_message?: string;
}

function hostOf(raw: string): string | null {
  try {
    return new URL(raw).hostname.toLowerCase();
  } catch {
    return null;
  }
}

export function resolveSource(input: ResolveInput): ResolveResult {
  const text = (input.source_text ?? "").trim();
  const url = (input.source_url ?? "").trim();

  if (!url && text) {
    return {
      ok: true,
      source_type: "text",
      source_url: null,
      canonical_host: null,
    };
  }

  if (!url) {
    return {
      ok: false,
      source_type: "web",
      source_url: null,
      canonical_host: null,
      error_code: "RESOLVE_FAILED",
      error_message: "source_url or source_text is required",
    };
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return {
      ok: false,
      source_type: "web",
      source_url: url,
      canonical_host: null,
      error_code: "RESOLVE_FAILED",
      error_message: "Invalid source_url",
    };
  }

  const host = parsed.hostname.toLowerCase();

  if (
    host.includes("tiktok.com") ||
    host === "vm.tiktok.com" ||
    host === "vt.tiktok.com"
  ) {
    return { ok: true, source_type: "tiktok", source_url: url, canonical_host: host };
  }
  if (
    host.includes("instagram.com") ||
    host === "instagr.am"
  ) {
    return {
      ok: true,
      source_type: "instagram",
      source_url: url,
      canonical_host: host,
    };
  }
  if (
    host.includes("youtube.com") ||
    host === "youtu.be" ||
    host.includes("youtube-nocookie.com")
  ) {
    return {
      ok: true,
      source_type: "youtube",
      source_url: url,
      canonical_host: host,
    };
  }
  if (
    host.includes("xiaohongshu.com") ||
    host.includes("xhslink.com") ||
    host === "xhs.cn"
  ) {
    // Detected but extraction not enabled in this issue.
    return {
      ok: true,
      source_type: "xiaohongshu",
      source_url: url,
      canonical_host: host,
    };
  }

  return {
    ok: true,
    source_type: "web",
    source_url: url,
    canonical_host: hostOf(url),
  };
}
