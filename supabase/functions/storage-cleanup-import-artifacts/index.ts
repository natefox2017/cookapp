// TTL cleanup stub for recipe-import-artifacts.
// Operational job type: storage_cleanup_import_artifacts (see #54 / #60).
// Auth: Authorization Bearer <STORAGE_CLEANUP_SECRET> (server/cron only).
// Never expose SUPABASE_SERVICE_ROLE_KEY or storage secrets to clients.
// Deploy: supabase functions deploy storage-cleanup-import-artifacts --project-ref semsjyrqjnumpvanibip

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { publicCorsHeaders, handleCors } from "../_shared/cors.ts";
import { AppError, errorResponse, json } from "../_shared/errors.ts";
import { createServiceClient, requireEnv } from "../_shared/auth.ts";
import { log } from "../_shared/logger.ts";
import {
  cleanupExpiredImportArtifacts,
  createSupabaseMediaStorageProvider,
  JOB_TYPE_STORAGE_CLEANUP_IMPORT_ARTIFACTS,
} from "../_shared/media-storage/mod.ts";

function requireCleanupSecret(req: Request): void {
  const expected = Deno.env.get("STORAGE_CLEANUP_SECRET");
  if (!expected) {
    // Fall back to requiring service role presence so misconfig fails closed in prod.
    requireEnv("SUPABASE_SERVICE_ROLE_KEY");
    throw new AppError(
      "server_misconfigured",
      "STORAGE_CLEANUP_SECRET is not configured",
      500,
    );
  }
  const auth = req.headers.get("Authorization");
  if (auth !== `Bearer ${expected}`) {
    throw new AppError("unauthorized", "Invalid cleanup credentials", 401);
  }
}

Deno.serve(async (req) => {
  const cors = handleCors(req, "public");
  if (cors) return cors;
  const headers = publicCorsHeaders;

  try {
    if (req.method !== "POST") {
      throw new AppError("method_not_allowed", "POST required", 405);
    }

    requireCleanupSecret(req);

    let limit = 200;
    if (req.headers.get("content-type")?.includes("application/json")) {
      const body = await req.json().catch(() => ({})) as { limit?: unknown };
      if (typeof body.limit === "number" && body.limit > 0 && body.limit <= 1000) {
        limit = Math.floor(body.limit);
      }
    }

    const admin = createServiceClient();
    const provider = createSupabaseMediaStorageProvider(admin);

    log("info", "storage_cleanup_start", {
      job_type: JOB_TYPE_STORAGE_CLEANUP_IMPORT_ARTIFACTS,
      limit,
    });

    const result = await cleanupExpiredImportArtifacts(admin, provider, {
      limit,
    });

    log("info", "storage_cleanup_done", {
      job_type: result.job_type,
      scanned: result.scanned,
      deleted: result.deleted,
      failed: result.failed,
    });

    return json({ ok: true, ...result }, 200, headers);
  } catch (err) {
    return errorResponse(err, headers);
  }
});
