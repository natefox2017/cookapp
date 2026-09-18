// Admin Dashboard: users list / detail / registration stats.
// Auth: custom admin bearer (admin_sessions) via requireAdminSession.
// Deploy: supabase functions deploy admin-users --project-ref semsjyrqjnumpvanibip
// Issue: #44

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { publicCorsHeaders, handleCors } from "../_shared/cors.ts";
import { AppError, errorResponse, json } from "../_shared/errors.ts";
import { createServiceClient } from "../_shared/auth.ts";
import { requireAdminSession } from "../_shared/admin-session.ts";

type Provider = "apple" | "google" | "email" | "unknown";
type Device = "ios" | "android" | "web" | "unknown";
type Plan = "free" | "pro" | "lifetime";
type Status = "active" | "suspended" | "deleted";

function routeParts(req: Request): string[] {
  const url = new URL(req.url);
  const parts = url.pathname.split("/").filter(Boolean);
  const idx = parts.findIndex((p) => p === "admin-users");
  return idx >= 0 ? parts.slice(idx + 1) : [];
}

function normalizeProvider(value: unknown): Provider {
  const v = String(value ?? "").toLowerCase();
  if (v === "apple" || v === "google" || v === "email") return v;
  return "unknown";
}

function normalizeDevice(value: unknown): Device {
  const v = String(value ?? "").toLowerCase();
  if (v === "ios" || v === "android" || v === "web") return v;
  return "unknown";
}

function normalizeStatus(value: unknown): Status {
  const v = String(value ?? "active").toLowerCase();
  if (v === "suspended" || v === "deleted") return v;
  return "active";
}

function mapPlan(plan: string | null, productId: string | null): Plan {
  if (plan === "pro" || plan === "lifetime" || plan === "free") return plan;
  const pid = (productId ?? "").toLowerCase();
  if (pid.includes("lifetime")) return "lifetime";
  if (pid.includes("pro") || pid.includes("monthly") || pid.includes("yearly")) {
    return "pro";
  }
  return "free";
}

function mapStore(store: unknown): "app_store" | "play_store" | null {
  if (store === "app_store" || store === "play_store") return store;
  return null;
}

function mapPayment(row: Record<string, unknown>) {
  const raw = (row.raw_event ?? {}) as Record<string, unknown>;
  const amount = Number(raw.price_in_purchased_currency ?? raw.price ?? NaN);
  return {
    id: row.id,
    eventType: String(row.event_type ?? ""),
    productId: (row.product_id as string | null) ?? null,
    store: mapStore(row.store),
    amount: Number.isFinite(amount) ? amount : null,
    currency: raw.currency ? String(raw.currency) : null,
    environment: (row.environment as string | null) ?? null,
    purchasedAt: row.created_at,
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
    const resource = (parts[0] ?? "").toLowerCase();

    if (resource === "stats") {
      const { data, error } = await admin
        .from("profiles")
        .select("registration_provider, device_type");
      if (error) throw new AppError("internal_error", error.message, 500);

      const providerOrder: Provider[] = ["apple", "google", "email", "unknown"];
      const deviceOrder: Device[] = ["ios", "android", "web", "unknown"];
      const providerLabels: Record<Provider, string> = {
        apple: "Apple",
        google: "Google",
        email: "Email",
        unknown: "Unknown",
      };
      const deviceLabels: Record<Device, string> = {
        ios: "iOS",
        android: "Android",
        web: "Web",
        unknown: "Unknown",
      };

      const providerCounts = Object.fromEntries(
        providerOrder.map((k) => [k, 0]),
      ) as Record<Provider, number>;
      const deviceCounts = Object.fromEntries(
        deviceOrder.map((k) => [k, 0]),
      ) as Record<Device, number>;

      for (const row of data ?? []) {
        providerCounts[normalizeProvider(row.registration_provider)] += 1;
        deviceCounts[normalizeDevice(row.device_type)] += 1;
      }

      return json(
        {
          total: (data ?? []).length,
          byProvider: providerOrder.map((key) => ({
            key,
            label: providerLabels[key],
            count: providerCounts[key],
          })),
          byDevice: deviceOrder.map((key) => ({
            key,
            label: deviceLabels[key],
            count: deviceCounts[key],
          })),
        },
        200,
        publicCorsHeaders,
      );
    }

    // Detail: GET /admin-users/:id
    if (resource && resource !== "stats" && parts.length === 1) {
      const id = parts[0];
      const { data: profile, error } = await admin
        .from("profiles")
        .select(
          "id, email, display_name, avatar, locale, timezone, created_at, registration_ip, registration_provider, device_type, account_status",
        )
        .eq("id", id)
        .maybeSingle();
      if (error) throw new AppError("internal_error", error.message, 500);
      if (!profile) throw new AppError("not_found", "User not found", 404);

      const [{ data: sub }, { count: recipeCount }, { data: events }] =
        await Promise.all([
          admin
            .from("subscriptions")
            .select("plan, product_id, status")
            .eq("user_id", id)
            .maybeSingle(),
          admin
            .from("recipes")
            .select("*", { count: "exact", head: true })
            .eq("user_id", id),
          admin
            .from("purchase_events")
            .select(
              "id, event_type, product_id, store, environment, raw_event, created_at",
            )
            .eq("user_id", id)
            .order("created_at", { ascending: false })
            .limit(100),
        ]);

      return json(
        {
          id: profile.id,
          email: profile.email ?? "",
          displayName: profile.display_name || "Unknown",
          avatarUrl: profile.avatar ?? null,
          subscription: mapPlan(
            (sub?.plan as string | null) ?? null,
            (sub?.product_id as string | null) ?? null,
          ),
          recipeCount: recipeCount ?? 0,
          favoriteCount: 0,
          createdAt: profile.created_at,
          status: normalizeStatus(profile.account_status),
          registrationProvider: normalizeProvider(profile.registration_provider),
          deviceType: normalizeDevice(profile.device_type),
          lastLoginAt: null,
          locale: profile.locale || "en-US",
          timezone: profile.timezone || "UTC",
          registrationIp: profile.registration_ip ?? null,
          payments: (events ?? []).map((row) =>
            mapPayment(row as Record<string, unknown>)
          ),
        },
        200,
        publicCorsHeaders,
      );
    }

    // List: GET /admin-users
    if (!resource) {
      const url = new URL(req.url);
      const q = (url.searchParams.get("q") ?? "").trim().toLowerCase();
      const status = url.searchParams.get("status");
      const subscription = url.searchParams.get("subscription");
      const registrationProvider = url.searchParams.get("registrationProvider");
      const deviceType = url.searchParams.get("deviceType");
      const page = Math.max(1, Number(url.searchParams.get("page") ?? 1) || 1);
      const pageSize = Math.min(
        100,
        Math.max(1, Number(url.searchParams.get("pageSize") ?? 20) || 20),
      );

      let query = admin
        .from("profiles")
        .select(
          "id, email, display_name, avatar, created_at, registration_provider, device_type, account_status",
          { count: "exact" },
        )
        .order("created_at", { ascending: false });

      if (status === "active" || status === "suspended" || status === "deleted") {
        query = query.eq("account_status", status);
      }
      if (
        registrationProvider === "apple" ||
        registrationProvider === "google" ||
        registrationProvider === "email" ||
        registrationProvider === "unknown"
      ) {
        query = query.eq("registration_provider", registrationProvider);
      }
      if (
        deviceType === "ios" ||
        deviceType === "android" ||
        deviceType === "web" ||
        deviceType === "unknown"
      ) {
        query = query.eq("device_type", deviceType);
      }

      const { data: profiles, error, count } = await query;
      if (error) throw new AppError("internal_error", error.message, 500);

      let rows = profiles ?? [];
      if (q) {
        rows = rows.filter((row) => {
          const email = String(row.email ?? "").toLowerCase();
          const name = String(row.display_name ?? "").toLowerCase();
          return email.includes(q) || name.includes(q);
        });
      }

      const userIds = rows.map((row) => row.id as string);
      const subMap = new Map<string, { plan: string | null; product_id: string | null }>();
      const recipeMap = new Map<string, number>();

      if (userIds.length) {
        const [{ data: subs }, { data: recipeRows }] = await Promise.all([
          admin
            .from("subscriptions")
            .select("user_id, plan, product_id")
            .in("user_id", userIds),
          admin.from("recipes").select("user_id").in("user_id", userIds),
        ]);
        for (const sub of subs ?? []) {
          subMap.set(sub.user_id as string, {
            plan: (sub.plan as string | null) ?? null,
            product_id: (sub.product_id as string | null) ?? null,
          });
        }
        for (const recipe of recipeRows ?? []) {
          const uid = recipe.user_id as string;
          recipeMap.set(uid, (recipeMap.get(uid) ?? 0) + 1);
        }
      }

      let mapped = rows.map((row) => {
        const sub = subMap.get(row.id as string);
        return {
          id: row.id,
          email: row.email ?? "",
          displayName: row.display_name || "Unknown",
          avatarUrl: row.avatar ?? null,
          subscription: mapPlan(sub?.plan ?? null, sub?.product_id ?? null),
          recipeCount: recipeMap.get(row.id as string) ?? 0,
          favoriteCount: 0,
          createdAt: row.created_at,
          status: normalizeStatus(row.account_status),
          registrationProvider: normalizeProvider(row.registration_provider),
          deviceType: normalizeDevice(row.device_type),
        };
      });

      if (subscription === "free" || subscription === "pro" || subscription === "lifetime") {
        mapped = mapped.filter((row) => row.subscription === subscription);
      }

      const total = q || subscription
        ? mapped.length
        : count ?? mapped.length;
      const start = (page - 1) * pageSize;
      const pageRows = mapped.slice(start, start + pageSize);

      return json(
        {
          data: pageRows,
          total,
          page,
          pageSize,
        },
        200,
        publicCorsHeaders,
      );
    }

    throw new AppError(
      "not_found",
      `Unknown admin-users route: GET /${parts.join("/")}`,
      404,
    );
  } catch (err) {
    return errorResponse(err, publicCorsHeaders);
  }
});
