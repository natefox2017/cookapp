// Serves OpenAPI 3.1 schema for CookApp backend (public read).
// Schema source: supabase/openapi/openapi.yaml (repo SoT)
// Closes: GitHub Issue #11

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { handleCors, publicCorsHeaders } from "../_shared/cors.ts";
import openapiSpec from "./spec.json" with { type: "json" };

const OPENAPI_JSON = JSON.stringify(openapiSpec);

Deno.serve(async (req) => {
  const cors = handleCors(req, "public");
  if (cors) return cors;

  if (req.method !== "GET") {
    return new Response(
      JSON.stringify({ error: { code: "method_not_allowed", message: "GET required" } }),
      {
        status: 405,
        headers: { ...publicCorsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  return new Response(OPENAPI_JSON, {
    headers: {
      ...publicCorsHeaders,
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=300",
    },
  });
});
