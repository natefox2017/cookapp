// Admin Operations: Jobs & Syncs + Integrations status (Issue #60).
// Auth: custom admin bearer (verify_jwt=false).
// Manual run / retry: admin|owner (not readonly).
// Deploy: supabase functions deploy admin-operations --project-ref semsjyrqjnumpvanibip

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { publicCorsHeaders, handleCors } from "../_shared/cors.ts";
import { AppError, errorResponse, json } from "../_shared/errors.ts";
import { createServiceClient } from "../_shared/auth.ts";
import { requireAdminSession } from "../_shared/admin-session.ts";
import { resolveRequestContext } from "../_shared/request-context.ts";
import { writeAdminAudit } from "../_shared/audit.ts";
import { log } from "../_shared/logger.ts";
import {
  getJobById,
  isManualRunJobType,
  listUnifiedJobs,
  persistIntegrationStatus,
  probeAllIntegrations,
  probeAiGateway,
  probeAppStoreConnect,
  probeGooglePlay,
  probeRevenueCat,
  probeSupabase,
  retryJob,
  runManualJob,
  toAdminIntegration,
  toAdminJob,
  type IntegrationKey,
} from "../_shared/operations/mod.ts";

function routeParts(req: Request): string[] {
  const url = new URL(req.url);
  const parts = url.pathname.split("/").filter(Boolean);
  const idx = parts.findIndex((p) => p === "admin-operations");
  return idx >= 0 ? parts.slice(idx + 1) : parts.slice(-4);
}

function requireWriteRole(role: string): void {
  if (role === "readonly") {
    throw new AppError("forbidden", "Read-only role cannot mutate jobs", 403);
  }
  if (!["owner", "admin", "operator"].includes(role)) {
    throw new AppError("forbidden", "Insufficient role for job mutation", 403);
  }
}

async function readJson(req: Request): Promise<Record<string, unknown>> {
  try {
    const body = await req.json();
    if (!body || typeof body !== "object") return {};
    return body as Record<string, unknown>;
  } catch {
    return {};
  }
}

Deno.serve(async (req) => {
  const cors = handleCors(req, "public");
  if (cors) return cors;

  const ctx = resolveRequestContext(req);
  const headers = publicCorsHeaders;

  try {
    const session = await requireAdminSession(req);
    const parts = routeParts(req);
    const method = req.method.toUpperCase();
    const db = createServiceClient();
    const resource = (parts[0] ?? "").toLowerCase();
    const id = parts[1];
    const action = (parts[2] ?? "").toLowerCase();

    log("info", "admin_operations_request", {
      method,
      resource,
      id: id ?? null,
      action: action || null,
      role: session.role,
    }, ctx);

    // GET /jobs
    if (resource === "jobs" && method === "GET" && !id) {
      const url = new URL(req.url);
      const { data, total } = await listUnifiedJobs(db, {
        jobType: url.searchParams.get("jobType"),
        provider: url.searchParams.get("provider"),
        status: url.searchParams.get("status"),
        limit: Number(url.searchParams.get("limit") ?? 50),
        offset: Number(url.searchParams.get("offset") ?? 0),
      });
      return json(
        {
          data: data.map(toAdminJob),
          total,
          pageSize: Number(url.searchParams.get("limit") ?? 50),
          offset: Number(url.searchParams.get("offset") ?? 0),
        },
        200,
        headers,
        ctx,
      );
    }

    // POST /jobs/run
    if (resource === "jobs" && id === "run" && method === "POST") {
      requireWriteRole(session.role);
      const body = await readJson(req);
      const jobType = String(body.jobType ?? "");
      if (!isManualRunJobType(jobType)) {
        throw new AppError(
          "validation_error",
          `Unsupported or missing jobType: ${jobType || "(empty)"}`,
          400,
        );
      }
      const result = await runManualJob(db, jobType, {
        trigger: "manual",
        createdBy: session.adminId,
        ctx,
        metadata: (body.metadata as Record<string, unknown>) ?? {},
      });
      await writeAdminAudit({
        actor: { adminId: session.adminId, username: session.username },
        action: "operational_job.run",
        objectType: "operational_job",
        objectId: result.jobId,
        after: { jobType, status: result.status },
        ctx,
        req,
      });
      return json(result, 200, headers, ctx);
    }

    // GET /jobs/:id
    if (resource === "jobs" && id && method === "GET" && !action) {
      const job = await getJobById(db, id);
      if (!job) throw new AppError("not_found", "Job not found", 404);
      return json(toAdminJob(job), 200, headers, ctx);
    }

    // POST /jobs/:id/retry
    if (resource === "jobs" && id && action === "retry" && method === "POST") {
      requireWriteRole(session.role);
      const result = await retryJob(db, id, {
        createdBy: session.adminId,
        ctx,
        role: session.role,
      });
      await writeAdminAudit({
        actor: { adminId: session.adminId, username: session.username },
        action: "operational_job.retry",
        objectType: "operational_job",
        objectId: result.jobId,
        before: { parentJobId: id },
        after: { status: result.status, jobType: result.jobType },
        ctx,
        req,
      });
      return json(result, 200, headers, ctx);
    }

    // GET /integrations
    if (resource === "integrations" && method === "GET" && !id) {
      const probes = await probeAllIntegrations(db);
      await Promise.all(probes.map((p) => persistIntegrationStatus(db, p)));
      return json(
        {
          generatedAt: new Date().toISOString(),
          integrations: probes.map(toAdminIntegration),
        },
        200,
        headers,
        ctx,
      );
    }

    // POST /integrations/:key/check
    if (resource === "integrations" && id && action === "check" && method === "POST") {
      requireWriteRole(session.role);
      const key = id as IntegrationKey;
      let probe;
      switch (key) {
        case "supabase":
          probe = await probeSupabase(db);
          break;
        case "revenuecat":
          probe = await probeRevenueCat(db);
          break;
        case "app_store_connect":
          probe = await probeAppStoreConnect(db);
          break;
        case "ai_gateway":
          probe = await probeAiGateway(db);
          break;
        case "google_play":
          probe = probeGooglePlay();
          break;
        default:
          throw new AppError("not_found", `Unknown integration: ${id}`, 404);
      }
      await persistIntegrationStatus(db, probe);
      await writeAdminAudit({
        actor: { adminId: session.adminId, username: session.username },
        action: "integration.check",
        objectType: "integration",
        objectId: key,
        after: { status: probe.status, configComplete: probe.configComplete },
        ctx,
        req,
      });
      return json(toAdminIntegration(probe), 200, headers, ctx);
    }

    // GET /job-types
    if (resource === "job-types" && method === "GET") {
      const { data, error } = await db
        .from("operational_job_type_registry")
        .select("job_type, description, created_at")
        .order("job_type", { ascending: true });
      if (error) throw new AppError("internal_error", error.message, 500);
      return json(
        {
          data: (data ?? []).map((r) => ({
            jobType: r.job_type,
            description: r.description,
            createdAt: r.created_at,
          })),
        },
        200,
        headers,
        ctx,
      );
    }

    throw new AppError("not_found", "Admin operations route not found", 404);
  } catch (err) {
    return errorResponse(err, headers, ctx);
  }
});
