// Admin Dashboard: subscription plans / records / revenue.
// Auth: custom admin bearer (admin_sessions) via requireAdminSession.
// Deploy: supabase functions deploy admin-subscriptions --project-ref semsjyrqjnumpvanibip
// Issues: #35, #57

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { publicCorsHeaders, handleCors } from "../_shared/cors.ts";
import { AppError, errorResponse, json } from "../_shared/errors.ts";
import { createServiceClient } from "../_shared/auth.ts";
import { requireAdminSession } from "../_shared/admin-session.ts";
import { createLogger } from "../_shared/logger.ts";
import { planAuditSnapshot, writeAdminAudit } from "../_shared/audit.ts";
import { resolveRequestContext } from "../_shared/request-context.ts";

type Platform = "app_store" | "play_store";

function routeParts(req: Request): string[] {
  const url = new URL(req.url);
  const parts = url.pathname.split("/").filter(Boolean);
  const idx = parts.findIndex((p) => p === "admin-subscriptions");
  return idx >= 0 ? parts.slice(idx + 1) : parts.slice(-2);
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

function mapPlan(row: Record<string, unknown>) {
  return {
    id: row.id,
    planKey: row.plan_key,
    displayName: row.display_name,
    platform: row.platform,
    productId: row.product_id,
    price: Number(row.price),
    currency: row.currency,
    billingPeriod: row.billing_period,
    active: Boolean(row.active),
    description: row.description ?? null,
    updatedAt: row.updated_at,
  };
}

function parsePlanBody(body: Record<string, unknown>) {
  const planKey = String(body.planKey ?? "").trim();
  const displayName = String(body.displayName ?? "").trim();
  const platform = String(body.platform ?? "").trim() as Platform;
  const productId = String(body.productId ?? "").trim();
  const currency = String(body.currency ?? "USD").trim().toUpperCase() || "USD";
  const billingPeriod = String(body.billingPeriod ?? "").trim();
  const description =
    body.description == null || body.description === ""
      ? null
      : String(body.description);
  const price = Number(body.price);
  const active = Boolean(body.active ?? true);

  if (!planKey || !displayName || !productId) {
    throw new AppError(
      "validation_error",
      "planKey, displayName, and productId are required",
      400,
    );
  }
  if (platform !== "app_store" && platform !== "play_store") {
    throw new AppError("validation_error", "platform must be app_store or play_store", 400);
  }
  if (!["monthly", "yearly", "lifetime"].includes(billingPeriod)) {
    throw new AppError("validation_error", "invalid billingPeriod", 400);
  }
  if (!Number.isFinite(price) || price < 0) {
    throw new AppError("validation_error", "price must be a non-negative number", 400);
  }

  return {
    plan_key: planKey,
    display_name: displayName,
    platform,
    product_id: productId,
    price,
    currency,
    billing_period: billingPeriod,
    active,
    description,
  };
}

function mapStatus(status: string): string {
  if (status === "none") return "expired";
  return status;
}

function mapPlanLabel(plan: string | null, productId: string | null): string {
  if (plan === "pro" || plan === "lifetime" || plan === "free") return plan;
  const pid = (productId ?? "").toLowerCase();
  if (pid.includes("lifetime")) return "lifetime";
  if (pid.includes("pro") || pid.includes("monthly") || pid.includes("yearly")) return "pro";
  return plan || "free";
}

function monthKey(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-US", { month: "short", timeZone: "UTC" });
}

Deno.serve(async (req) => {
  const cors = handleCors(req, "public");
  if (cors) return cors;

  const ctx = resolveRequestContext(req);
  const log = createLogger(ctx);

  try {
    const session = await requireAdminSession(req);
    const actor = { adminId: session.adminId, username: session.username };
    const parts = routeParts(req);
    const method = req.method.toUpperCase();
    const admin = createServiceClient();
    const resource = (parts[0] ?? "").toLowerCase();
    const id = parts[1];

    if (resource === "plans" && method === "GET" && !id) {
      const { data, error } = await admin
        .from("subscription_plans")
        .select("*")
        .order("plan_key")
        .order("platform");
      if (error) throw new AppError("internal_error", error.message, 500);
      return json(
        (data ?? []).map((row) => mapPlan(row as Record<string, unknown>)),
        200,
        publicCorsHeaders,
        ctx,
      );
    }

    if (resource === "plans" && method === "POST" && !id) {
      const payload = parsePlanBody(await readJson(req));
      const { data, error } = await admin
        .from("subscription_plans")
        .insert(payload)
        .select("*")
        .single();
      if (error) {
        throw new AppError(
          error.code === "23505" ? "conflict" : "internal_error",
          error.message,
          error.code === "23505" ? 409 : 500,
        );
      }
      log("info", "admin_plan_created", { id: data.id });
      await writeAdminAudit({
        actor,
        action: "subscription_plan.create",
        objectType: "subscription_plan",
        objectId: String(data.id),
        after: planAuditSnapshot(data as Record<string, unknown>),
        ctx,
        req,
      });
      return json(mapPlan(data as Record<string, unknown>), 201, publicCorsHeaders, ctx);
    }

    if (resource === "plans" && method === "PUT" && id) {
      const { data: existing, error: existingError } = await admin
        .from("subscription_plans")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (existingError) throw new AppError("internal_error", existingError.message, 500);
      if (!existing) throw new AppError("not_found", "Plan not found", 404);

      const payload = parsePlanBody(await readJson(req));
      const { data, error } = await admin
        .from("subscription_plans")
        .update(payload)
        .eq("id", id)
        .select("*")
        .maybeSingle();
      if (error) throw new AppError("internal_error", error.message, 500);
      if (!data) throw new AppError("not_found", "Plan not found", 404);
      log("info", "admin_plan_updated", { id });
      await writeAdminAudit({
        actor,
        action: "subscription_plan.update",
        objectType: "subscription_plan",
        objectId: id,
        before: planAuditSnapshot(existing as Record<string, unknown>),
        after: planAuditSnapshot(data as Record<string, unknown>),
        ctx,
        req,
      });
      return json(mapPlan(data as Record<string, unknown>), 200, publicCorsHeaders, ctx);
    }

    if (resource === "plans" && method === "DELETE" && id) {
      const { data: existing, error: existingError } = await admin
        .from("subscription_plans")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (existingError) throw new AppError("internal_error", existingError.message, 500);
      if (!existing) throw new AppError("not_found", "Plan not found", 404);

      const { error, count } = await admin
        .from("subscription_plans")
        .delete({ count: "exact" })
        .eq("id", id);
      if (error) throw new AppError("internal_error", error.message, 500);
      if (!count) throw new AppError("not_found", "Plan not found", 404);
      log("info", "admin_plan_deleted", { id });
      await writeAdminAudit({
        actor,
        action: "subscription_plan.delete",
        objectType: "subscription_plan",
        objectId: id,
        before: planAuditSnapshot(existing as Record<string, unknown>),
        ctx,
        req,
      });
      return json({ ok: true }, 200, publicCorsHeaders, ctx);
    }

    if (resource === "records" && method === "GET") {
      const url = new URL(req.url);
      const platform = url.searchParams.get("platform");
      let query = admin
        .from("subscriptions")
        .select(
          "user_id, product_id, plan, status, store, expires_at, created_at, updated_at",
        )
        .order("updated_at", { ascending: false })
        .limit(500);
      if (platform === "app_store" || platform === "play_store") {
        query = query.eq("store", platform);
      }
      const { data, error } = await query;
      if (error) throw new AppError("internal_error", error.message, 500);

      const userIds = [...new Set((data ?? []).map((row) => row.user_id as string))];
      const profileMap = new Map<string, { display_name: string | null; email: string | null }>();
      if (userIds.length) {
        const { data: profiles } = await admin
          .from("profiles")
          .select("id, display_name, email")
          .in("id", userIds);
        for (const profile of profiles ?? []) {
          profileMap.set(profile.id as string, {
            display_name: profile.display_name as string | null,
            email: profile.email as string | null,
          });
        }
      }

      const rows = (data ?? []).map((row) => {
        const p = profileMap.get(row.user_id as string);
        const store =
          row.store === "app_store" || row.store === "play_store" ? row.store : null;
        return {
          id: row.user_id,
          user: {
            id: row.user_id,
            displayName: p?.display_name || "Unknown",
            email: p?.email || "",
          },
          plan: mapPlanLabel(row.plan as string | null, row.product_id as string | null),
          status: mapStatus(String(row.status ?? "expired")),
          platform: store,
          productId: row.product_id ?? null,
          amount: null as number | null,
          currency: null as string | null,
          startDate: String(row.created_at).slice(0, 10),
          expirationDate: row.expires_at
            ? String(row.expires_at).slice(0, 10)
            : null,
        };
      });

      // Attach latest purchase amount when available.
      if (userIds.length) {
        const { data: events } = await admin
          .from("purchase_events")
          .select("user_id, product_id, store, raw_event, created_at")
          .in("user_id", userIds)
          .order("created_at", { ascending: false })
          .limit(2000);
        const latest = new Map<string, { amount: number; currency: string }>();
        for (const event of events ?? []) {
          const key = `${event.user_id}:${event.product_id ?? ""}`;
          if (latest.has(key)) continue;
          const raw = (event.raw_event ?? {}) as Record<string, unknown>;
          const amount = Number(raw.price_in_purchased_currency ?? raw.price ?? NaN);
          const currency = String(raw.currency ?? "USD");
          if (Number.isFinite(amount)) {
            latest.set(key, { amount, currency });
          }
        }
        for (const row of rows) {
          const hit = latest.get(`${row.user.id}:${row.productId ?? ""}`);
          if (hit) {
            row.amount = hit.amount;
            row.currency = hit.currency;
          }
        }
      }

      return json(rows, 200, publicCorsHeaders, ctx);
    }

    if (resource === "revenue" && method === "GET") {
      const url = new URL(req.url);
      const platform = url.searchParams.get("platform");
      let query = admin
        .from("purchase_events")
        .select("store, raw_event, created_at, event_type")
        .order("created_at", { ascending: true })
        .limit(5000);
      if (platform === "app_store" || platform === "play_store") {
        query = query.eq("store", platform);
      }
      const { data, error } = await query;
      if (error) throw new AppError("internal_error", error.message, 500);

      const paidTypes = new Set([
        "INITIAL_PURCHASE",
        "RENEWAL",
        "NON_RENEWING_PURCHASE",
        "PRODUCT_CHANGE",
      ]);

      const byMonth = new Map<string, { apple: number; android: number; order: number }>();
      let appleRevenue = 0;
      let androidRevenue = 0;

      for (const event of data ?? []) {
        const type = String(event.event_type ?? "").toUpperCase();
        if (!paidTypes.has(type)) continue;
        const raw = (event.raw_event ?? {}) as Record<string, unknown>;
        const amount = Number(raw.price_in_purchased_currency ?? raw.price ?? 0);
        if (!Number.isFinite(amount) || amount <= 0) continue;
        const created = String(event.created_at);
        const key = monthKey(created);
        const order = new Date(created).getUTCFullYear() * 12 + new Date(created).getUTCMonth();
        const bucket = byMonth.get(key) ?? { apple: 0, android: 0, order };
        if (event.store === "app_store") {
          bucket.apple += amount;
          appleRevenue += amount;
        } else if (event.store === "play_store") {
          bucket.android += amount;
          androidRevenue += amount;
        }
        byMonth.set(key, bucket);
      }

      const series = [...byMonth.entries()]
        .sort((a, b) => a[1].order - b[1].order)
        .slice(-6)
        .map(([month, v]) => ({
          month,
          apple: Math.round(v.apple * 100) / 100,
          android: Math.round(v.android * 100) / 100,
          total: Math.round((v.apple + v.android) * 100) / 100,
        }));

      const { count: activePaid } = await admin
        .from("subscriptions")
        .select("*", { count: "exact", head: true })
        .in("status", ["active", "trialing"])
        .neq("plan", "free");

      // Rough MRR from active monthly catalog prices * paid actives split (fallback).
      const { data: monthlyPlans } = await admin
        .from("subscription_plans")
        .select("price, platform")
        .eq("billing_period", "monthly")
        .eq("active", true);
      const avgMonthly =
        (monthlyPlans ?? []).reduce((sum, p) => sum + Number(p.price), 0) /
        Math.max((monthlyPlans ?? []).length, 1);

      return json(
        {
          stats: {
            mrr: Math.round(avgMonthly * (activePaid ?? 0) * 100) / 100,
            appleRevenue: Math.round(appleRevenue * 100) / 100,
            androidRevenue: Math.round(androidRevenue * 100) / 100,
            activePaid: activePaid ?? 0,
          },
          series,
        },
        200,
        publicCorsHeaders,
        ctx,
      );
    }

    throw new AppError(
      "not_found",
      `Unknown admin-subscriptions route: ${method} /${parts.join("/")}`,
      404,
    );
  } catch (err) {
    return errorResponse(err, publicCorsHeaders, ctx);
  }
});
