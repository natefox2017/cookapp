/**
 * SSRF protections for server-side URL fetches (import media, etc.).
 * Blocks localhost, private/link-local ranges, cloud metadata, non-http(s).
 */

import { AppError } from "../errors.ts";

const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "metadata.google.internal",
  "metadata.google",
  "kubernetes.default",
  "kubernetes.default.svc",
]);

function ipv4ToInt(ip: string): number | null {
  const parts = ip.split(".");
  if (parts.length !== 4) return null;
  let n = 0;
  for (const p of parts) {
    if (!/^\d{1,3}$/.test(p)) return null;
    const v = Number(p);
    if (v < 0 || v > 255) return null;
    n = (n << 8) + v;
  }
  return n >>> 0;
}

function isBlockedIpv4(ip: string): boolean {
  const n = ipv4ToInt(ip);
  if (n === null) return true;
  // Force unsigned compares — JS bitwise ops are Int32; high bits go negative.
  const u = (mask: number, prefix: number) => ((n & mask) >>> 0) === (prefix >>> 0);
  // 0.0.0.0/8
  if (u(0xff000000, 0x00000000)) return true;
  // 10.0.0.0/8
  if (u(0xff000000, 0x0a000000)) return true;
  // 127.0.0.0/8
  if (u(0xff000000, 0x7f000000)) return true;
  // 169.254.0.0/16 (link-local / cloud metadata)
  if (u(0xffff0000, 0xa9fe0000)) return true;
  // 172.16.0.0/12
  if (u(0xfff00000, 0xac100000)) return true;
  // 192.168.0.0/16
  if (u(0xffff0000, 0xc0a80000)) return true;
  // 100.64.0.0/10 (CGNAT)
  if (u(0xffc00000, 0x64400000)) return true;
  // 192.0.0.0/24, 192.0.2.0/24, 198.51.100.0/24, 203.0.113.0/24 (docs)
  if (u(0xffffff00, 0xc0000000)) return true;
  if (u(0xffffff00, 0xc0000200)) return true;
  if (u(0xffffff00, 0xc6336400)) return true;
  if (u(0xffffff00, 0xcb007100)) return true;
  // 224.0.0.0/4 multicast, 240.0.0.0/4 reserved
  if (((n & 0xf0000000) >>> 0) >= 0xe0000000) return true;
  return false;
}

function isBlockedIpv6(host: string): boolean {
  const h = host.toLowerCase().replace(/^\[|\]$/g, "");
  if (h === "::1" || h === "::") return true;
  // Unique local fc00::/7, link-local fe80::/10, multicast ff00::/8
  if (h.startsWith("fc") || h.startsWith("fd")) return true;
  if (h.startsWith("fe8") || h.startsWith("fe9") || h.startsWith("fea") ||
    h.startsWith("feb"))
  {
    return true;
  }
  if (h.startsWith("ff")) return true;
  // IPv4-mapped :ffff:x.x.x.x
  const mapped = h.match(/:ffff:(\d+\.\d+\.\d+\.\d+)$/i);
  if (mapped) return isBlockedIpv4(mapped[1]!);
  return false;
}

function hostnameLooksLikeIpv4(host: string): boolean {
  return /^\d{1,3}(\.\d{1,3}){3}$/.test(host);
}

/**
 * Validate that a URL is safe to fetch from the server.
 * Does not perform DNS; callers must re-validate after redirects.
 */
export function assertSafeFetchUrl(rawUrl: string): URL {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new AppError("validation_error", "invalid fetch URL", 400);
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new AppError(
      "validation_error",
      "only http/https URLs are allowed",
      400,
    );
  }

  if (url.username || url.password) {
    throw new AppError(
      "validation_error",
      "URLs with credentials are not allowed",
      400,
    );
  }

  const host = url.hostname.toLowerCase();
  if (!host) {
    throw new AppError("validation_error", "URL host is required", 400);
  }

  if (BLOCKED_HOSTNAMES.has(host) || host.endsWith(".localhost") ||
    host.endsWith(".local") || host.endsWith(".internal"))
  {
    throw new AppError(
      "validation_error",
      "URL host is not allowed (SSRF protection)",
      400,
    );
  }

  if (hostnameLooksLikeIpv4(host) && isBlockedIpv4(host)) {
    throw new AppError(
      "validation_error",
      "URL resolves to a private or reserved address",
      400,
    );
  }

  if (host.includes(":") && isBlockedIpv6(host)) {
    throw new AppError(
      "validation_error",
      "URL resolves to a private or reserved address",
      400,
    );
  }

  // Common metadata hostnames / suffixes
  if (
    host === "metadata" ||
    host.endsWith(".metadata.google.internal") ||
    host === "169.254.169.254"
  ) {
    throw new AppError(
      "validation_error",
      "URL host is not allowed (SSRF protection)",
      400,
    );
  }

  return url;
}

export type SafeFetchOptions = {
  maxBytes: number;
  timeoutMs?: number;
  allowedMimeTypes?: readonly string[];
  /** Max redirects; each redirect URL is re-validated. */
  maxRedirects?: number;
};

export type SafeFetchResult = {
  body: Uint8Array;
  mimeType: string;
  finalUrl: string;
  sizeBytes: number;
};

/**
 * Fetch a remote URL with SSRF checks, size cap, and redirect re-validation.
 * Intended for import-artifact ingest paths that pull external media.
 */
export async function safeFetchUrl(
  rawUrl: string,
  options: SafeFetchOptions,
  fetchImpl: typeof fetch = fetch,
): Promise<SafeFetchResult> {
  const timeoutMs = options.timeoutMs ?? 15_000;
  const maxRedirects = options.maxRedirects ?? 3;
  let current = assertSafeFetchUrl(rawUrl).toString();

  for (let hop = 0; hop <= maxRedirects; hop++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetchImpl(current, {
        method: "GET",
        redirect: "manual",
        signal: controller.signal,
        headers: {
          Accept: "*/*",
          "User-Agent": "CookAppMediaFetcher/1.0",
        },
      });

      if ([301, 302, 303, 307, 308].includes(res.status)) {
        const loc = res.headers.get("location");
        if (!loc) {
          throw new AppError("validation_error", "redirect without Location", 400);
        }
        const next = new URL(loc, current).toString();
        assertSafeFetchUrl(next);
        current = next;
        continue;
      }

      if (!res.ok) {
        throw new AppError(
          "validation_error",
          `upstream fetch failed with status ${res.status}`,
          400,
        );
      }

      const contentType = (res.headers.get("content-type") ??
        "application/octet-stream").split(";")[0]!.trim().toLowerCase();
      if (
        options.allowedMimeTypes &&
        !options.allowedMimeTypes.includes(contentType)
      ) {
        throw new AppError(
          "validation_error",
          `fetched content-type not allowed: ${contentType}`,
          400,
        );
      }

      const contentLength = res.headers.get("content-length");
      if (contentLength && Number(contentLength) > options.maxBytes) {
        throw new AppError(
          "validation_error",
          "fetched content exceeds size limit",
          400,
        );
      }

      const reader = res.body?.getReader();
      if (!reader) {
        throw new AppError("validation_error", "empty fetch body", 400);
      }

      const chunks: Uint8Array[] = [];
      let total = 0;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        total += value.byteLength;
        if (total > options.maxBytes) {
          try {
            await reader.cancel();
          } catch {
            /* ignore */
          }
          throw new AppError(
            "validation_error",
            "fetched content exceeds size limit",
            400,
          );
        }
        chunks.push(value);
      }

      const body = new Uint8Array(total);
      let offset = 0;
      for (const c of chunks) {
        body.set(c, offset);
        offset += c.byteLength;
      }

      if (total === 0) {
        throw new AppError("validation_error", "empty fetch body", 400);
      }

      return {
        body,
        mimeType: contentType,
        finalUrl: current,
        sizeBytes: total,
      };
    } catch (err) {
      if (err instanceof AppError) throw err;
      if (err instanceof DOMException && err.name === "AbortError") {
        throw new AppError("validation_error", "fetch timed out", 400);
      }
      throw new AppError(
        "validation_error",
        err instanceof Error ? err.message : "fetch failed",
        400,
      );
    } finally {
      clearTimeout(timer);
    }
  }

  throw new AppError("validation_error", "too many redirects", 400);
}
