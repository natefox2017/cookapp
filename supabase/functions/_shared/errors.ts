/** Structured JSON responses + AppError helpers. */

import { publicCorsHeaders } from "./cors.ts";
import type { RequestContext } from "./request-context.ts";
import { requestIdHeaders } from "./request-context.ts";

export type ErrorCode =
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "validation_error"
  | "method_not_allowed"
  | "conflict"
  | "server_misconfigured"
  | "internal_error";

export class AppError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message: string,
    public readonly status = 400,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "AppError";
  }
}

function mergeHeaders(
  cors: Record<string, string>,
  ctx?: RequestContext,
): Record<string, string> {
  return {
    ...cors,
    ...(ctx ? requestIdHeaders(ctx) : {}),
    "Content-Type": "application/json",
  };
}

export function json(
  body: unknown,
  status = 200,
  cors: Record<string, string> = publicCorsHeaders,
  ctx?: RequestContext,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: mergeHeaders(cors, ctx),
  });
}

export function errorResponse(
  err: unknown,
  cors: Record<string, string> = publicCorsHeaders,
  ctx?: RequestContext,
): Response {
  const requestId = ctx?.requestId ?? null;
  if (err instanceof AppError) {
    return new Response(
      JSON.stringify({
        error: {
          code: err.code,
          message: err.message,
          details: err.details ?? null,
        },
        request_id: requestId,
      }),
      {
        status: err.status,
        headers: mergeHeaders(cors, ctx),
      },
    );
  }
  const message = err instanceof Error ? err.message : "unknown_error";
  console.error(
    JSON.stringify({
      ts: new Date().toISOString(),
      level: "error",
      event: "unhandled_error",
      message,
      request_id: requestId,
    }),
  );
  return new Response(
    JSON.stringify({
      error: {
        code: "internal_error",
        message: "An unexpected error occurred",
        details: null,
      },
      request_id: requestId,
    }),
    {
      status: 500,
      headers: mergeHeaders(cors, ctx),
    },
  );
}
