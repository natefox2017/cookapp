/**
 * SSRF-safe JSON / text fetch for official oEmbed and caption endpoints.
 */

import { assertSafeOutboundUrl } from "../../ssrf.ts";

export async function fetchSafeJson(
  rawUrl: string,
  fetchImpl: typeof fetch,
  accept: string,
): Promise<{ ok: boolean; status: number; data: unknown; notes: string[] }> {
  const safety = assertSafeOutboundUrl(rawUrl);
  if (!safety.ok) {
    return {
      ok: false,
      status: 0,
      data: null,
      notes: [`ssrf_blocked:${safety.reason}`],
    };
  }
  try {
    const res = await fetchImpl(safety.url.toString(), {
      redirect: "follow",
      headers: {
        "User-Agent": "CookAppRecipeImportBot/1.0",
        Accept: accept,
      },
    });
    if (!res.ok) {
      return {
        ok: false,
        status: res.status,
        data: null,
        notes: [`http_${res.status}`],
      };
    }
    const data = await res.json();
    return { ok: true, status: res.status, data, notes: [] };
  } catch (err) {
    return {
      ok: false,
      status: 0,
      data: null,
      notes: [`fetch_error:${err instanceof Error ? err.message : "unknown"}`],
    };
  }
}

export async function fetchSafeText(
  rawUrl: string,
  fetchImpl: typeof fetch,
  accept: string,
): Promise<{ ok: boolean; status: number; text: string | null; notes: string[] }> {
  const safety = assertSafeOutboundUrl(rawUrl);
  if (!safety.ok) {
    return {
      ok: false,
      status: 0,
      text: null,
      notes: [`ssrf_blocked:${safety.reason}`],
    };
  }
  try {
    const res = await fetchImpl(safety.url.toString(), {
      redirect: "follow",
      headers: {
        "User-Agent": "CookAppRecipeImportBot/1.0",
        Accept: accept,
      },
    });
    if (!res.ok) {
      return {
        ok: false,
        status: res.status,
        text: null,
        notes: [`http_${res.status}`],
      };
    }
    return { ok: true, status: res.status, text: await res.text(), notes: [] };
  } catch (err) {
    return {
      ok: false,
      status: 0,
      text: null,
      notes: [`fetch_error:${err instanceof Error ? err.message : "unknown"}`],
    };
  }
}

export function oembedString(
  data: unknown,
  key: string,
): string | null {
  if (!data || typeof data !== "object") return null;
  const value = (data as Record<string, unknown>)[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}
