// Health / capability probe for the CookApp backend (authenticated).
// Returns module availability without leaking secrets.
// Closes: GitHub Issue #11

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { authCorsHeaders, handleCors } from "../_shared/cors.ts";
import { AppError, errorResponse, json } from "../_shared/errors.ts";
import { requireUser } from "../_shared/auth.ts";
import { log } from "../_shared/logger.ts";

Deno.serve(async (req) => {
  const cors = handleCors(req, "auth");
  if (cors) return cors;
  const headers = authCorsHeaders(req);

  try {
    if (req.method !== "GET") {
      throw new AppError("method_not_allowed", "GET required", 405);
    }

    const { user } = await requireUser(req);
    log("info", "health_ok", { user_id: user.id });

    return json(
      {
        ok: true,
        service: "cookapp-backend",
        modules: [
          "auth",
          "user",
          "recipe",
          "collection",
          "ingredient",
          "grocery",
          "meal_plan",
          "pantry",
          "category",
          "storage",
          "subscription",
        ],
        rest_base: "/rest/v1",
        openapi: "/functions/v1/openapi",
      },
      200,
      headers,
    );
  } catch (err) {
    return errorResponse(err, headers);
  }
});
