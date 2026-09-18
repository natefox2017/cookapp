/** Append-only Admin audit log writer (Issue #57). Never stores secret values. */

import { createServiceClient } from "./auth.ts";
import { log, redactSensitive } from "./logger.ts";
import type { RequestContext } from "./request-context.ts";
import { clientIp, clientUserAgent } from "./request-context.ts";

export type AuditActor = {
  adminId?: string | null;
  username?: string | null;
};

export type AuditWriteInput = {
  actor?: AuditActor | null;
  action: string;
  objectType: string;
  objectId?: string | null;
  before?: unknown;
  after?: unknown;
  ctx?: Partial<RequestContext>;
  req?: Request;
  ip?: string | null;
  userAgent?: string | null;
};

/**
 * Persist a privileged Admin action. Failures are logged but do not throw —
 * audit must not break the primary mutation path.
 */
export async function writeAdminAudit(input: AuditWriteInput): Promise<void> {
  try {
    const admin = createServiceClient();
    const beforeDiff =
      input.before === undefined
        ? null
        : (redactSensitive(input.before) as Record<string, unknown> | unknown);
    const afterDiff =
      input.after === undefined
        ? null
        : (redactSensitive(input.after) as Record<string, unknown> | unknown);

    const ip =
      input.ip ?? (input.req ? clientIp(input.req) : null);
    const userAgent =
      input.userAgent ?? (input.req ? clientUserAgent(input.req) : null);

    const row = {
      actor_admin_id: input.actor?.adminId ?? null,
      actor_username: input.actor?.username ?? null,
      action: input.action,
      object_type: input.objectType,
      object_id: input.objectId ?? null,
      before_diff: beforeDiff,
      after_diff: afterDiff,
      request_id: input.ctx?.requestId ?? null,
      correlation_id: input.ctx?.correlationId ?? null,
      job_id: input.ctx?.jobId ?? null,
      ip,
      user_agent: userAgent,
    };

    const { error } = await admin.from("admin_audit_logs").insert(row);
    if (error) {
      log(
        "error",
        "admin_audit_write_failed",
        { message: error.message, action: input.action },
        input.ctx,
      );
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown_error";
    log(
      "error",
      "admin_audit_write_exception",
      { message, action: input.action },
      input.ctx,
    );
  }
}

/** Safe before/after plan catalog fields (no secrets expected). */
export function planAuditSnapshot(row: Record<string, unknown>) {
  return {
    id: row.id ?? null,
    plan_key: row.plan_key ?? row.planKey ?? null,
    display_name: row.display_name ?? row.displayName ?? null,
    platform: row.platform ?? null,
    product_id: row.product_id ?? row.productId ?? null,
    price: row.price ?? null,
    currency: row.currency ?? null,
    billing_period: row.billing_period ?? row.billingPeriod ?? null,
    active: row.active ?? null,
    description: row.description ?? null,
  };
}
