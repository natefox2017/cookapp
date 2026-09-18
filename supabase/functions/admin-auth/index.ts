// Admin Dashboard auth: login / logout / session / change-password.
// Custom bearer sessions (not end-user Supabase Auth JWT).
// Deploy: supabase functions deploy admin-auth --project-ref semsjyrqjnumpvanibip
// Issue: #32

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { publicCorsHeaders, handleCors } from "../_shared/cors.ts";
import { AppError, errorResponse, json } from "../_shared/errors.ts";
import { createServiceClient } from "../_shared/auth.ts";
import { log } from "../_shared/logger.ts";
import {
  createAdminSession,
  requireAdminSession,
} from "../_shared/admin-session.ts";

function routeAction(req: Request): string {
  const url = new URL(req.url);
  const parts = url.pathname.split("/").filter(Boolean);
  // /functions/v1/admin-auth/<action>
  const idx = parts.findIndex((p) => p === "admin-auth");
  const action = idx >= 0 ? parts[idx + 1] : parts.at(-1);
  return (action ?? "").toLowerCase();
}

async function readJson(req: Request): Promise<Record<string, unknown>> {
  try {
    const body = await req.json();
    if (!body || typeof body !== "object") return {};
    return body as Record<string, unknown>;
  } catch {
    throw new AppError("validation_error", "Invalid JSON body", 400);
  }
}

Deno.serve(async (req) => {
  const cors = handleCors(req, "public");
  if (cors) return cors;

  try {
    const action = routeAction(req);
    const method = req.method.toUpperCase();

    if (action === "login" && method === "POST") {
      const body = await readJson(req);
      const username = String(body.username ?? "").trim().toLowerCase();
      const password = String(body.password ?? "");
      if (!username || !password) {
        throw new AppError("validation_error", "username and password are required", 400);
      }

      const admin = createServiceClient();
      const { data, error } = await admin.rpc("admin_verify_credentials", {
        p_username: username,
        p_password: password,
      });

      if (error) {
        log("error", "admin_verify_failed", { message: error.message });
        throw new AppError("internal_error", "Credential verification failed", 500);
      }

      const row = Array.isArray(data) ? data[0] : data;
      if (!row?.id) {
        throw new AppError("unauthorized", "Invalid username or password", 401);
      }

      const session = await createAdminSession(row.id as string);
      log("info", "admin_login_ok", { admin_id: row.id });
      return json(
        {
          token: session.token,
          expiresAt: session.expiresAt,
          admin: { id: row.id, username: row.username },
        },
        200,
        publicCorsHeaders,
      );
    }

    if (action === "logout" && method === "POST") {
      const session = await requireAdminSession(req);
      const admin = createServiceClient();
      const { error } = await admin
        .from("admin_sessions")
        .update({ revoked_at: new Date().toISOString() })
        .eq("id", session.sessionId);
      if (error) {
        log("error", "admin_logout_failed", { message: error.message });
        throw new AppError("internal_error", "Failed to revoke admin session", 500);
      }
      log("info", "admin_logout_ok", { admin_id: session.adminId });
      return json({ ok: true }, 200, publicCorsHeaders);
    }

    if (action === "session" && method === "GET") {
      const session = await requireAdminSession(req);
      return json(
        {
          admin: { id: session.adminId, username: session.username },
        },
        200,
        publicCorsHeaders,
      );
    }

    if (action === "change-password" && method === "POST") {
      const session = await requireAdminSession(req);
      const body = await readJson(req);
      const currentPassword = String(body.currentPassword ?? "");
      const newPassword = String(body.newPassword ?? "");
      if (!currentPassword || !newPassword) {
        throw new AppError(
          "validation_error",
          "currentPassword and newPassword are required",
          400,
        );
      }
      if (newPassword.length < 4) {
        throw new AppError("validation_error", "newPassword must be at least 4 characters", 400);
      }

      const admin = createServiceClient();
      const { data, error } = await admin.rpc("admin_change_password", {
        p_admin_id: session.adminId,
        p_current_password: currentPassword,
        p_new_password: newPassword,
      });

      if (error) {
        log("error", "admin_change_password_failed", { message: error.message });
        throw new AppError("internal_error", "Password change failed", 500);
      }
      if (!data) {
        throw new AppError("unauthorized", "Current password is incorrect", 401);
      }

      // Issue a fresh session for the caller after invalidating all sessions.
      const next = await createAdminSession(session.adminId);
      log("info", "admin_password_changed", { admin_id: session.adminId });
      return json(
        {
          ok: true,
          token: next.token,
          expiresAt: next.expiresAt,
          admin: { id: session.adminId, username: session.username },
        },
        200,
        publicCorsHeaders,
      );
    }

    throw new AppError(
      "not_found",
      `Unknown admin-auth route: ${method} ${action || "/"}`,
      404,
    );
  } catch (err) {
    return errorResponse(err, publicCorsHeaders);
  }
});
