/** Shared request-id for Admin Edge Functions (Issue #52). */

export function resolveRequestId(req: Request): string {
  const incoming = req.headers.get("x-request-id")?.trim();
  if (incoming && incoming.length <= 128) return incoming;
  return crypto.randomUUID();
}

export function withRequestId(
  headers: Record<string, string>,
  requestId: string,
): Record<string, string> {
  return {
    ...headers,
    "X-Request-Id": requestId,
  };
}
