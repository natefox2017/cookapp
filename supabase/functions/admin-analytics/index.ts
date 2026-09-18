// Admin Analytics aggregation API (Issue #60 / #47).
// Real tables only; Google Play Future Reserved; source + freshness on KPIs.
// Deploy: supabase functions deploy admin-analytics --project-ref semsjyrqjnumpvanibip

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { publicCorsHeaders, handleCors } from "../_shared/cors.ts";
import { AppError, errorResponse, json } from "../_shared/errors.ts";
import { createServiceClient } from "../_shared/auth.ts";
import { requireAdminSession } from "../_shared/admin-session.ts";
import { resolveRequestContext } from "../_shared/request-context.ts";
import { log } from "../_shared/logger.ts";
import { buildAnalyticsAggregation } from "../_shared/operations/mod.ts";

Deno.serve(async (req) => {
  const cors = handleCors(req, "public");
  if (cors) return cors;

  const ctx = resolveRequestContext(req);
  const headers = publicCorsHeaders;

  try {
    await requireAdminSession(req);
    if (req.method.toUpperCase() !== "GET") {
      throw new AppError("method_not_allowed", "Only GET is supported", 405);
    }

    const url = new URL(req.url);
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");

    log("info", "admin_analytics_request", { from, to }, ctx);

    const db = createServiceClient();
    const payload = await buildAnalyticsAggregation(db, { from, to });
    return json(payload, 200, headers, ctx);
  } catch (err) {
    return errorResponse(err, headers, ctx);
  }
});
