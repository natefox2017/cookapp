/** SSRF-safe validation for AI provider base URLs. */

import { AppError } from "./errors.ts";

const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "metadata.google.internal",
  "metadata",
  "instance-data",
]);

function isIpv4(host: string): boolean {
  return /^\d{1,3}(\.\d{1,3}){3}$/.test(host);
}

function ipv4ToInt(host: string): number {
  const parts = host.split(".").map((p) => Number(p));
  if (parts.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) {
    throw new AppError("validation_error", "Invalid IPv4 address in base_url", 400);
  }
  return ((parts[0]! << 24) >>> 0) + (parts[1]! << 16) + (parts[2]! << 8) + parts[3]!;
}

function isBlockedIpv4(host: string): boolean {
  const n = ipv4ToInt(host);
  const ranges: Array<[number, number]> = [
    [ipv4ToInt("0.0.0.0"), ipv4ToInt("0.255.255.255")],
    [ipv4ToInt("10.0.0.0"), ipv4ToInt("10.255.255.255")],
    [ipv4ToInt("127.0.0.0"), ipv4ToInt("127.255.255.255")],
    [ipv4ToInt("169.254.0.0"), ipv4ToInt("169.254.255.255")],
    [ipv4ToInt("172.16.0.0"), ipv4ToInt("172.31.255.255")],
    [ipv4ToInt("192.168.0.0"), ipv4ToInt("192.168.255.255")],
    [ipv4ToInt("100.64.0.0"), ipv4ToInt("100.127.255.255")],
  ];
  return ranges.some(([start, end]) => n >= start && n <= end);
}

function isBlockedIpv6(host: string): boolean {
  const h = host.toLowerCase();
  return (
    h === "::1" ||
    h === "::" ||
    h.startsWith("fc") ||
    h.startsWith("fd") ||
    h.startsWith("fe80")
  );
}

export type ValidateBaseUrlOptions = {
  /** Explicit local/dev allowlist only. Production must leave false. */
  allowLocalhost?: boolean;
  environment?: "development" | "production";
};

/**
 * Validate provider base_url before save / outbound request.
 * HTTPS required except explicit development localhost allowlist.
 */
export function validateAiBaseUrl(
  raw: string,
  options: ValidateBaseUrlOptions = {},
): string {
  const trimmed = String(raw ?? "").trim();
  if (!trimmed) {
    throw new AppError("validation_error", "base_url is required", 400);
  }

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    throw new AppError("validation_error", "base_url is not a valid URL", 400);
  }

  const allowLocal =
    options.allowLocalhost === true ||
    (options.environment === "development" &&
      Deno.env.get("COOKAPP_AI_ALLOW_LOCAL_BASE_URL") === "true");

  if (url.protocol !== "https:") {
    if (!(allowLocal && url.protocol === "http:" && isLocalHost(url.hostname))) {
      throw new AppError(
        "validation_error",
        "base_url must use https (http localhost only in explicit development)",
        400,
      );
    }
  }

  const hostname = url.hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (!hostname) {
    throw new AppError("validation_error", "base_url hostname is required", 400);
  }

  if (BLOCKED_HOSTNAMES.has(hostname) && !allowLocal) {
    throw new AppError(
      "validation_error",
      "base_url host is not allowed (SSRF protection)",
      400,
    );
  }

  if (hostname.endsWith(".local") && !allowLocal) {
    throw new AppError(
      "validation_error",
      "base_url .local hosts are not allowed",
      400,
    );
  }

  if (isIpv4(hostname)) {
    if (isBlockedIpv4(hostname) && !(allowLocal && hostname.startsWith("127."))) {
      throw new AppError(
        "validation_error",
        "base_url private/link-local IPs are not allowed",
        400,
      );
    }
  } else if (hostname.includes(":")) {
    if (isBlockedIpv6(hostname) && !allowLocal) {
      throw new AppError(
        "validation_error",
        "base_url private/link-local IPv6 is not allowed",
        400,
      );
    }
  }

  // Normalize: strip trailing slash for consistent storage
  const normalized = `${url.origin}${url.pathname}`.replace(/\/$/, "");
  return normalized || url.origin;
}

function isLocalHost(hostname: string): boolean {
  const h = hostname.replace(/^\[|\]$/g, "").toLowerCase();
  return h === "localhost" || h === "127.0.0.1" || h === "::1";
}

/** Redact Authorization / API keys from strings used in logs/errors. */
export function redactSecrets(value: string): string {
  return value
    .replace(/(Authorization:\s*Bearer\s+)[^\s]+/gi, "$1***")
    .replace(/(api[_-]?key["']?\s*[:=]\s*["']?)[^"'\s&]+/gi, "$1***")
    .replace(/sk-[A-Za-z0-9_-]{10,}/g, "sk-***");
}
