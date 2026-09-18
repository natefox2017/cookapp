/**
 * Structured logging with secret redaction (Issue #57).
 * Never emit Authorization headers, API keys, passwords, or purchase tokens.
 */

import type { RequestContext } from "./request-context.ts";

export type LogLevel = "debug" | "info" | "warn" | "error";

const REDACTED = "[REDACTED]";

/** Exact / case-insensitive field names that always redact. */
const SENSITIVE_KEYS = new Set([
  "authorization",
  "password",
  "currentpassword",
  "newpassword",
  "oldpassword",
  "passwd",
  "secret",
  "api_key",
  "apikey",
  "api-key",
  "access_token",
  "accesstoken",
  "refresh_token",
  "refreshtoken",
  "id_token",
  "idtoken",
  "token",
  "bearer",
  "purchase_token",
  "purchasetoken",
  "receipt",
  "receipt_data",
  "receiptdata",
  "private_key",
  "privatekey",
  "client_secret",
  "clientsecret",
  "webhook_secret",
  "webhooksecret",
  "password_hash",
  "passwordhash",
  "token_hash",
  "tokenhash",
  "cookie",
  "set-cookie",
]);

/** Substring match on key names (normalized). */
const SENSITIVE_KEY_PARTS = [
  "password",
  "secret",
  "apikey",
  "api_key",
  "authorization",
  "purchase_token",
  "purchasetoken",
  "private_key",
  "client_secret",
  "access_token",
  "refresh_token",
  "webhook_secret",
  "receipt",
];

function normalizeKey(key: string): string {
  return key.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function keyLooksSensitive(key: string): boolean {
  const lower = key.toLowerCase();
  if (SENSITIVE_KEYS.has(lower) || SENSITIVE_KEYS.has(normalizeKey(key))) {
    return true;
  }
  const compact = normalizeKey(key);
  return SENSITIVE_KEY_PARTS.some((part) =>
    compact.includes(part.replace(/_/g, ""))
  );
}

/** Redact bearer / api-key style substrings inside free-form strings. */
export function redactString(value: string): string {
  let out = value;
  out = out.replace(
    /(Bearer\s+)[A-Za-z0-9\-._~+/]+=*/gi,
    `$1${REDACTED}`,
  );
  out = out.replace(
    /(Authorization\s*[:=]\s*["']?)[^"',\s]+/gi,
    `$1${REDACTED}`,
  );
  out = out.replace(
    /((?:api[_-]?key|access[_-]?token|refresh[_-]?token|client[_-]?secret|webhook[_-]?secret|purchase[_-]?token)\s*[:=]\s*["']?)[^"',\s]+/gi,
    `$1${REDACTED}`,
  );
  out = out.replace(
    /sk-[A-Za-z0-9]{10,}/g,
    REDACTED,
  );
  out = out.replace(
    /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g,
    REDACTED,
  );
  return out;
}

/**
 * Deep-redact objects / arrays / strings for safe logging and audit diffs.
 * Mutates nothing — returns a new value tree.
 */
export function redactSensitive(value: unknown, depth = 0): unknown {
  if (depth > 12) return REDACTED;
  if (value == null) return value;
  if (typeof value === "string") return redactString(value);
  if (typeof value === "number" || typeof value === "boolean") return value;
  if (Array.isArray(value)) {
    return value.map((item) => redactSensitive(item, depth + 1));
  }
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      if (keyLooksSensitive(key)) {
        out[key] = REDACTED;
      } else {
        out[key] = redactSensitive(child, depth + 1);
      }
    }
    return out;
  }
  return String(value);
}

export function log(
  level: LogLevel,
  event: string,
  fields: Record<string, unknown> = {},
  ctx?: Partial<RequestContext>,
): void {
  const safeFields = redactSensitive(fields) as Record<string, unknown>;
  const payload: Record<string, unknown> = {
    ts: new Date().toISOString(),
    level,
    event,
    ...safeFields,
  };
  if (ctx?.requestId) payload.request_id = ctx.requestId;
  if (ctx?.correlationId) payload.correlation_id = ctx.correlationId;
  if (ctx?.jobId) payload.job_id = ctx.jobId;

  const line = JSON.stringify(payload);
  switch (level) {
    case "error":
      console.error(line);
      break;
    case "warn":
      console.warn(line);
      break;
    default:
      console.log(line);
  }
}

/** Bind request context so callers do not repeat ids on every log line. */
export function createLogger(ctx: RequestContext) {
  return (
    level: LogLevel,
    event: string,
    fields: Record<string, unknown> = {},
  ) => log(level, event, fields, ctx);
}
