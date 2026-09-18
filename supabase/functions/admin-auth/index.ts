// Admin Dashboard auth: login / logout / session / change-password / bootstrap.
// Custom bearer sessions (not end-user Supabase Auth JWT).
// Issues: #51 (hardening) · #57 (audit / request ids) · legacy #32

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { publicCorsHeaders, handleCors } from "../_shared/cors.ts";
import { AppError, errorResponse, json } from "../_shared/errors.ts";
import { createServiceClient } from "../_shared/auth.ts";
import { createLogger } from "../_shared/logger.ts";
import {
  createAdminSession,
  requireAdminSession,
} from "../_shared/admin-session.ts";
import {
  isAdminProductionRuntime,
  isDefaultAdminCredentials,
  validateAdminPassword,
} from "../_shared/admin-password.ts";
import { writeAdminAudit } from "../_shared/audit.ts";
import { resolveRequestContext } from "../_shared/request-context.ts";

function routeAction(req: Request): string {
  const url = new URL(req.url);
  const parts = url.pathname.split("/").filter(Boolean);
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

async function loadAdminRow(adminId: string) {
  const admin = createServiceClient();
  const { data, error } = await admin
    .from("admin_accounts")
    .select("id, username, role, is_default_seed, must_change_password")
    .eq("id", adminId)
    .maybeSingle();
  if (error) {
    throw new AppError("internal_error", "Failed to load admin account", 500, {
      message: error.message,
    });
  }
  if (!data) throw new AppError("unauthorized", "Invalid admin account", 401);
  return data;
}

function mapAdmin(row: {
  id: string;
  username: string;
  role?: string | null;
  must_change_password?: boolean | null;
}) {
  return {
    id: row.id,
    username: row.username,
    role: row.role ?? "owner",
    mustChangePassword: Boolean(row.must_change_password),
  };
}

/** Production bootstrap requires COOKAPP_ADMIN_BOOTSTRAP_TOKEN (header or Bearer). */
function requireBootstrapAuthorization(req: Request): void {
  const expected = Deno.env.get("COOKAPP_ADMIN_BOOTSTRAP_TOKEN") ?? "";
  if (isAdminProductionRuntime()) {
    if (!expected) {
      throw new AppError(
        "server_misconfigured",
        "COOKAPP_ADMIN_BOOTSTRAP_TOKEN is required before production bootstrap",
        500,
      );
    }
  } else if (!expected) {
    return;
  }

  const header = req.headers.get("X-CookApp-Bootstrap-Token")?.trim() ?? "";
  const auth = req.headers.get("Authorization") ?? "";
  const bearer = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  const presented = header || bearer;
  if (!presented || presented !== expected) {
    throw new AppError("forbidden", "Invalid or missing bootstrap token", 403);
  }
}

Deno.serve(async (req) => {
  const cors = handleCors(req, "public");
  if (cors) return cors;

  const ctx = resolveRequestContext(req);
  const log = createLogger(ctx);

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

      if (
        isAdminProductionRuntime() &&
        isDefaultAdminCredentials(username, password)
      ) {
        log("warn", "admin_default_credentials_blocked", { username });
        await writeAdminAudit({
          actor: { username },
          action: "admin.login_failed",
          objectType: "admin_session",
          after: { reason: "default_credentials_blocked" },
          ctx,
          req,
        });
        throw new AppError(
          "forbidden",
          "Default admin credentials are disabled in production. Bootstrap an Owner password first.",
          403,
        );
      }

      const admin = createServiceClient();
      const { data, error } = await admin.rpc("admin_verify_credentials", {
        p_username: username,
        p_password: password,
      });

      if (error) {
        log("error", "admin_verify_failed", { message: error.message });
        await writeAdminAudit({
          actor: { username },
          action: "admin.login_failed",
          objectType: "admin_session",
          after: { reason: "verify_error" },
          ctx,
          req,
        });
        throw new AppError("internal_error", "Credential verification failed", 500);
      }

      const row = Array.isArray(data) ? data[0] : data;
      if (!row?.id) {
        await writeAdminAudit({
          actor: { username },
          action: "admin.login_failed",
          objectType: "admin_session",
          after: { reason: "invalid_credentials" },
          ctx,
          req,
        });
        throw new AppError("unauthorized", "Invalid username or password", 401);
      }

      const account = await loadAdminRow(row.id as string);
      if (
        isAdminProductionRuntime() &&
        account.is_default_seed &&
        isDefaultAdminCredentials(username, password)
      ) {
        await writeAdminAudit({
          actor: { username },
          action: "admin.login_failed",
          objectType: "admin_session",
          after: { reason: "default_seed_blocked" },
          ctx,
          req,
        });
        throw new AppError(
          "forbidden",
          "Default seed account cannot sign in to production. Call /admin-auth/bootstrap.",
          403,
        );
      }

      const session = await createAdminSession(account.id as string);
      log("info", "admin_login_ok", {
        admin_id: account.id,
        role: account.role,
      });
      await writeAdminAudit({
        actor: { adminId: account.id as string, username: account.username as string },
        action: "admin.login",
        objectType: "admin_session",
        objectId: account.id as string,
        after: { username: account.username, role: account.role },
        ctx,
        req,
      });
      return json(
        {
          token: session.token,
          expiresAt: session.expiresAt,
          admin: mapAdmin(account),
        },
        200,
        publicCorsHeaders,
        ctx,
      );
    }

    if (action === "bootstrap" && method === "POST") {
      requireBootstrapAuthorization(req);
      const body = await readJson(req);
      const username = String(body.username ?? "admin").trim().toLowerCase();
      const newPassword = String(body.newPassword ?? "");
      const currentPassword =
        body.currentPassword == null ? null : String(body.currentPassword);

      const strength = validateAdminPassword(newPassword);
      if (!strength.ok) {
        throw new AppError("validation_error", strength.message ?? "Weak password", 400);
      }

      const admin = createServiceClient();
      const { data, error } = await admin.rpc("admin_bootstrap_owner", {
        p_username: username,
        p_new_password: newPassword,
        p_current_password: currentPassword,
      });

      if (error) {
        log("warn", "admin_bootstrap_failed", { message: error.message });
        const msg = error.message ?? "Bootstrap failed";
        if (msg.includes("current default password")) {
          throw new AppError("unauthorized", "Current default password is incorrect", 401);
        }
        if (msg.includes("strength")) {
          throw new AppError("validation_error", "newPassword does not meet strength policy", 400);
        }
        if (msg.includes("not available")) {
          throw new AppError("conflict", "Bootstrap is not available for this environment", 409);
        }
        throw new AppError("validation_error", msg, 400);
      }

      const row = Array.isArray(data) ? data[0] : data;
      if (!row?.id) {
        throw new AppError("internal_error", "Bootstrap returned no account", 500);
      }

      const session = await createAdminSession(row.id as string);
      log("info", "admin_bootstrap_ok", { admin_id: row.id, role: row.role });
      await writeAdminAudit({
        actor: { adminId: row.id as string, username: row.username as string },
        action: "admin.bootstrap",
        objectType: "admin_account",
        objectId: row.id as string,
        after: { username: row.username, role: row.role ?? "owner" },
        ctx,
        req,
      });
      return json(
        {
          token: session.token,
          expiresAt: session.expiresAt,
          admin: {
            id: row.id,
            username: row.username,
            role: row.role ?? "owner",
            mustChangePassword: false,
          },
        },
        200,
        publicCorsHeaders,
        ctx,
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
      await writeAdminAudit({
        actor: { adminId: session.adminId, username: session.username },
        action: "admin.logout",
        objectType: "admin_session",
        objectId: session.sessionId,
        ctx,
        req,
      });
      return json({ ok: true }, 200, publicCorsHeaders, ctx);
    }

    if (action === "session" && method === "GET") {
      const session = await requireAdminSession(req);
      const account = await loadAdminRow(session.adminId);
      return json(
        {
          admin: mapAdmin(account),
        },
        200,
        publicCorsHeaders,
        ctx,
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
      const strength = validateAdminPassword(newPassword);
      if (!strength.ok) {
        throw new AppError("validation_error", strength.message ?? "Weak password", 400);
      }

      const admin = createServiceClient();
      const { data, error } = await admin.rpc("admin_change_password", {
        p_admin_id: session.adminId,
        p_current_password: currentPassword,
        p_new_password: newPassword,
      });

      if (error) {
        log("error", "admin_change_password_failed", { message: error.message });
        if ((error.message ?? "").includes("strength")) {
          throw new AppError("validation_error", "newPassword does not meet strength policy", 400);
        }
        throw new AppError("internal_error", "Password change failed", 500);
      }
      if (!data) {
        await writeAdminAudit({
          actor: { adminId: session.adminId, username: session.username },
          action: "admin.password_change_failed",
          objectType: "admin_account",
          objectId: session.adminId,
          after: { reason: "current_password_incorrect" },
          ctx,
          req,
        });
        throw new AppError("unauthorized", "Current password is incorrect", 401);
      }

      const account = await loadAdminRow(session.adminId);
      const next = await createAdminSession(session.adminId);
      log("info", "admin_password_changed", { admin_id: session.adminId });
      await writeAdminAudit({
        actor: { adminId: session.adminId, username: session.username },
        action: "admin.password_change",
        objectType: "admin_account",
        objectId: session.adminId,
        after: { password_changed: true },
        ctx,
        req,
      });
      return json(
        {
          ok: true,
          token: next.token,
          expiresAt: next.expiresAt,
          admin: mapAdmin(account),
        },
        200,
        publicCorsHeaders,
        ctx,
      );
    }

    throw new AppError(
      "not_found",
      `Unknown admin-auth route: ${method} ${action || "/"}`,
      404,
    );
  } catch (err) {
    return errorResponse(err, publicCorsHeaders, ctx);
  }
});
