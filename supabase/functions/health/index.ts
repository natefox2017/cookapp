// Health / capability probe for the CookApp backend (authenticated).
// Returns module availability without leaking secrets.
// Closes: GitHub Issue #11

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { handleCors } from "../_shared/cors.ts";
import { errorResponse, json } from "../_shared/errors.ts";
import { requireUser } from "../_shared/auth.ts";
import { log } from "../_shared/logger.ts";

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  try {
    if (req.method !== "GET") {
      return json({ error: { code: "method_not_allowed", message: "GET required" } }, 405);
    }

    const { user } = await requireUser(req);
    log("info", "health_ok", { user_id: user.id });

    return json({
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
    });
  } catch (err) {
    return errorResponse(err);
  }
});
