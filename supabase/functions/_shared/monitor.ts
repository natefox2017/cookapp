/**
 * Basic monitoring hooks (Issue #57 / V2 §13).
 * Emit structured failure events only — never invent "Operational" status.
 */

import { log, type LogLevel } from "./logger.ts";
import type { RequestContext } from "./request-context.ts";

export type MonitorKind =
  | "provider_error"
  | "import_failure"
  | "webhook_failure"
  | "job_failure"
  | "sync_failure";

export type MonitorEvent = {
  kind: MonitorKind;
  source: string;
  reason: string;
  /** Optional stable code for aggregation (e.g. auth_failed, timeout). */
  code?: string;
  fields?: Record<string, unknown>;
  ctx?: Partial<RequestContext>;
  level?: LogLevel;
};

/**
 * Record an observable failure for provider / import / webhook / job paths.
 * Downstream aggregators can count these events; UI must not map absence
 * of events to a decorative "Operational" badge.
 */
export function recordMonitorEvent(event: MonitorEvent): void {
  log(
    event.level ?? "error",
    `monitor.${event.kind}`,
    {
      source: event.source,
      reason: event.reason,
      code: event.code ?? null,
      ...(event.fields ?? {}),
    },
    event.ctx,
  );
}
