/** Request / correlation / job ID helpers for Admin + Edge observability. */

const REQUEST_ID_HEADERS = [
  "x-request-id",
  "x-amzn-trace-id",
  "cf-ray",
] as const;

const CORRELATION_ID_HEADERS = [
  "x-correlation-id",
  "x-request-id",
] as const;

const JOB_ID_HEADERS = ["x-job-id"] as const;

export type RequestContext = {
  requestId: string;
  correlationId: string;
  jobId: string | null;
};

function firstHeader(req: Request, names: readonly string[]): string | null {
  for (const name of names) {
    const value = req.headers.get(name)?.trim();
    if (value) return value.slice(0, 128);
  }
  return null;
}

/** Generate a compact opaque id (uuid without dashes is fine for logs). */
export function newId(): string {
  return crypto.randomUUID();
}

/**
 * Resolve request / correlation / job ids from inbound headers.
 * Generates a request id when the client does not send one.
 * Correlation defaults to request id; job id is optional.
 */
export function resolveRequestContext(req: Request): RequestContext {
  const requestId = firstHeader(req, REQUEST_ID_HEADERS) ?? newId();
  const correlationId =
    firstHeader(req, CORRELATION_ID_HEADERS) ?? requestId;
  const jobId = firstHeader(req, JOB_ID_HEADERS);
  return { requestId, correlationId, jobId };
}

/** Response headers for clients / log aggregators. */
export function requestIdHeaders(ctx: RequestContext): Record<string, string> {
  const headers: Record<string, string> = {
    "X-Request-Id": ctx.requestId,
    "X-Correlation-Id": ctx.correlationId,
  };
  if (ctx.jobId) headers["X-Job-Id"] = ctx.jobId;
  return headers;
}

export function clientIp(req: Request): string | null {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first.slice(0, 128);
  }
  const realIp = req.headers.get("x-real-ip")?.trim();
  return realIp ? realIp.slice(0, 128) : null;
}

export function clientUserAgent(req: Request): string | null {
  const ua = req.headers.get("user-agent")?.trim();
  return ua ? ua.slice(0, 512) : null;
}
