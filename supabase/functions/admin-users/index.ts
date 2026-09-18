// Admin Dashboard: user list / detail with registration meta + payment history.
// Auth: custom admin bearer via requireAdminSession.
// Issue: #44

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { publicCorsHeaders, handleCors } from "../_shared/cors.ts";
import { AppError, errorResponse, json } from "../_shared/errors.ts";
import { createServiceClient } from "../_shared/auth.ts";
import { requireAdminSession } from "../_shared/admin-session.ts";

type RegistrationType = "apple" | "google" | "email" | "unknown";
type DeviceType = "iphone" | "ipad" | "android" | "web" | "unknown";

function routeParts(req: Request): string[] {
  const url = new URL(req.url);
  const parts = url.pathname.split("/").filter(Boolean);
  const idx = parts.findIndex((p) => p === "admin-users");
  return idx >= 0 ? parts.slice(idx + 1) : [];
}

function mapRegistration(value: unknown): RegistrationType {
  const v = String(value ?? "unknown");
  if (v === "apple" || v === "google" || v === "email" || v === "unknown") return v;
  return "unknown";
}

function mapDevice(value: unknown): DeviceType {
  const v = String(value ?? "unknown");
  if (v === "iphone" || v === "ipad" || v === "android" || v === "web" || v === "unknown") {
    return v;
  }
  return "unknown";
}

function mapPlan(plan: unknown, productId: unknown): "free" | "pro" | "lifetime" {
  const p = String(plan ?? "");
  if (p === "pro" || p === "lifetime" || p === "free") return p;
  const pid = String(productId ?? "").toLowerCase();
  if (pid.includes("lifetime")) return "lifetime";
  if (pid.includes("pro") || pid.includes("month") || pid.includes("year")) return "pro";
  return "free";
}

function emptyStats() {
  return {
    total: 0,
    byRegistrationType: { apple: 0, google: 0, email: 0, unknown: 0 },
    byDeviceType: { iphone: 0, ipad: 0, android: 0, web: 0, unknown: 0 },
    withPayments: 0,
  };
}

Deno.serve(async (req) => {
  const cors = handleCors(req, "public");
  if (cors) return cors;

  try {
    await requireAdminSession(req);
    if (req.method.toUpperCase() !== "GET") {
      throw new AppError("method_not_allowed", "Only GET is supported", 405);
    }

    const parts = routeParts(req);
    const admin = createServiceClient();

    // GET /admin-users/:id
    if (parts.length === 1 && parts[0]) {
      const id = parts[0];
      const { data: profile, error } = await admin
        .from("profiles")
        .select(
          "id, email, display_name, avatar, locale, timezone, created_at, registration_type, device_type, registration_ip, account_status",
        )
        .eq("id", id)
        .maybeSingle();
      if (error) throw new AppError("internal_error", error.message, 500);
      if (!profile) throw new AppError("not_found", "User not found", 404);

      const { data: sub } = await admin
        .from("subscriptions")
        .select("plan, product_id, status, expires_at")
        .eq("user_id", id)
        .maybeSingle();

      const { count: recipeCount } = await admin
        .from("recipes")
        .select("*", { count: "exact", head: true })
        .eq("user_id", id);

      const { data: events } = await admin
        .from("purchase_events")
        .select("id, event_type, product_id, store, environment, raw_event, created_at")
        .eq("user_id", id)
        .order("created_at", { ascending: false })
        .limit(100);

      const paymentRecords = (events ?? []).map((event) => {
        const raw = (event.raw_event ?? {}) as Record<string, unknown>;
        const amount = Number(raw.price_in_purchased_currency ?? raw.price ?? NaN);
        return {
          id: event.id,
          eventType: event.event_type,
          productId: event.product_id ?? null,
          store: event.store ?? null,
          amount: Number.isFinite(amount) ? amount : null,
          currency: (raw.currency as string) ?? "USD",
          environment: event.environment ?? null,
          createdAt: event.created_at,
        };
      });

      return json(
        {
          id: profile.id,
          email: profile.email ?? "",
          displayName: profile.display_name || "Unknown",
          avatarUrl: profile.avatar ?? null,
          subscription: mapPlan(sub?.plan, sub?.product_id),
          recipeCount: recipeCount ?? 0,
          favoriteCount: 0,
          createdAt: profile.created_at,
          status: profile.account_status ?? "active",
          registrationType: mapRegistration(profile.registration_type),
          deviceType: mapDevice(profile.device_type),
          registrationIp: profile.registration_ip
            ? String(profile.registration_ip)
            : null,
          lastLoginAt: null,
          locale: profile.locale ?? "en-US",
          timezone: profile.timezone ?? "UTC",
          paymentRecords,
        },
        200,
        publicCorsHeaders,
      );
    }

    // GET /admin-users
    if (parts.length === 0) {
      const url = new URL(req.url);
      const q = (url.searchParams.get("q") ?? "").trim().toLowerCase();
      const status = url.searchParams.get("status") ?? "all";
      const subscription = url.searchParams.get("subscription") ?? "all";
      const registrationType = url.searchParams.get("registrationType") ?? "all";
      const deviceType = url.searchParams.get("deviceType") ?? "all";
      const page = Math.max(1, Number(url.searchParams.get("page") ?? 1) || 1);
      const pageSize = Math.min(
        100,
        Math.max(1, Number(url.searchParams.get("pageSize") ?? 20) || 20),
      );

      let query = admin
        .from("profiles")
        .select(
          "id, email, display_name, avatar, created_at, registration_type, device_type, registration_ip, account_status",
        )
        .order("created_at", { ascending: false })
        .limit(1000);

      if (status !== "all") query = query.eq("account_status", status);
      if (registrationType !== "all") {
        query = query.eq("registration_type", registrationType);
      }
      if (deviceType !== "all") query = query.eq("device_type", deviceType);

      const { data, error } = await query;
      if (error) throw new AppError("internal_error", error.message, 500);

      const userIds = (data ?? []).map((row) => row.id as string);
      const subMap = new Map<string, { plan: unknown; product_id: unknown }>();
      const paidUsers = new Set<string>();

      if (userIds.length) {
        const { data: subs } = await admin
          .from("subscriptions")
          .select("user_id, plan, product_id")
          .in("user_id", userIds);
        for (const row of subs ?? []) {
          subMap.set(row.user_id as string, row);
        }
        const { data: paid } = await admin
          .from("purchase_events")
          .select("user_id, raw_event")
          .in("user_id", userIds)
          .limit(5000);
        for (const event of paid ?? []) {
          const raw = (event.raw_event ?? {}) as Record<string, unknown>;
          const amount = Number(raw.price_in_purchased_currency ?? raw.price ?? 0);
          if (Number.isFinite(amount) && amount > 0) {
            paidUsers.add(event.user_id as string);
          }
        }
      }

      let rows = (data ?? []).map((profile) => {
        const sub = subMap.get(profile.id as string);
        return {
          id: profile.id as string,
          email: (profile.email as string) ?? "",
          displayName: (profile.display_name as string) || "Unknown",
          avatarUrl: (profile.avatar as string) ?? null,
          subscription: mapPlan(sub?.plan, sub?.product_id),
          recipeCount: 0,
          favoriteCount: 0,
          createdAt: profile.created_at as string,
          status: (profile.account_status as string) ?? "active",
          registrationType: mapRegistration(profile.registration_type),
          deviceType: mapDevice(profile.device_type),
          registrationIp: profile.registration_ip
            ? String(profile.registration_ip)
            : null,
        };
      });

      if (q) {
        rows = rows.filter(
          (row) =>
            row.email.toLowerCase().includes(q) ||
            row.displayName.toLowerCase().includes(q) ||
            (row.registrationIp ?? "").includes(q),
        );
      }
      if (subscription !== "all") {
        rows = rows.filter((row) => row.subscription === subscription);
      }

      const stats = emptyStats();
      stats.total = rows.length;
      for (const row of rows) {
        stats.byRegistrationType[row.registrationType] += 1;
        stats.byDeviceType[row.deviceType] += 1;
        if (paidUsers.has(row.id)) stats.withPayments += 1;
      }

      const start = (page - 1) * pageSize;
      return json(
        {
          data: rows.slice(start, start + pageSize),
          total: rows.length,
          page,
          pageSize,
          stats,
        },
        200,
        publicCorsHeaders,
      );
    }

    throw new AppError("not_found", `Unknown admin-users route: ${parts.join("/")}`, 404);
  } catch (err) {
    return errorResponse(err, publicCorsHeaders);
  }
});
