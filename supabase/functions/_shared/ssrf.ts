/**
 * SSRF guards for outbound URL fetch (Recipe Import + AI Platform base_url).
 */

const BLOCKED_HOSTS = new Set([
  "localhost",
  "metadata.google.internal",
  "metadata.google",
]);

function isPrivateIpv4(hostname: string): boolean {
  const m = hostname.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
  if (!m) return false;
  const a = Number(m[1]);
  const b = Number(m[2]);
  if (a === 10) return true;
  if (a === 127) return true;
  if (a === 0) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
  return false;
}

function isPrivateIpv6(hostname: string): boolean {
  const h = hostname.toLowerCase();
  return (
    h === "::1" ||
    h === "::" ||
    h.startsWith("fc") ||
    h.startsWith("fd") ||
    h.startsWith("fe80:")
  );
}

export type UrlSafetyResult =
  | { ok: true; url: URL }
  | { ok: false; reason: string };

export function assertSafeOutboundUrl(
  raw: string,
  opts: { allowHttpLocalhost?: boolean } = {},
): UrlSafetyResult {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return { ok: false, reason: "invalid_url" };
  }

  const protocol = url.protocol.toLowerCase();
  const isLocalDev =
    opts.allowHttpLocalhost === true &&
    Deno.env.get("COOKAPP_ENV") === "development";

  if (protocol !== "https:" && !(isLocalDev && protocol === "http:")) {
    return { ok: false, reason: "https_required" };
  }

  const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (BLOCKED_HOSTS.has(host) || host.endsWith(".localhost") || host.endsWith(".local")) {
    if (!isLocalDev) return { ok: false, reason: "blocked_host" };
  }
  if (isPrivateIpv4(host) || isPrivateIpv6(host)) {
    if (!isLocalDev) return { ok: false, reason: "private_network" };
  }
  if (host === "metadata" || host.startsWith("169.254.")) {
    return { ok: false, reason: "metadata_endpoint" };
  }

  return { ok: true, url };
}

export function canonicalizeUrl(raw: string): string {
  const parsed = new URL(raw);
  parsed.hash = "";
  // Normalize trailing slash for non-root paths lightly
  if (parsed.pathname.length > 1 && parsed.pathname.endsWith("/")) {
    parsed.pathname = parsed.pathname.replace(/\/+$/, "");
  }
  return parsed.toString();
}
