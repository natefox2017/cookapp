/**
 * Admin Dashboard / Analytics aggregation (Issue #60 / #47).
 * Real tables only · source + freshness · Google Play Future Reserved.
 */

import type { SupabaseClient } from "jsr:@supabase/supabase-js@2";
import { CONTRACT_TABLES, tableExists } from "./table-probe.ts";
import type { KpiAvailability, KpiMetric } from "./types.ts";

const PAID_TYPES = new Set([
  "INITIAL_PURCHASE",
  "RENEWAL",
  "NON_RENEWING_PURCHASE",
  "PRODUCT_CHANGE",
]);

function monthShort(iso: string): string {
  return new Date(iso).toLocaleString("en-US", { month: "short", timeZone: "UTC" });
}

function monthOrder(iso: string): number {
  const d = new Date(iso);
  return d.getUTCFullYear() * 12 + d.getUTCMonth();
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function mapPlan(plan: unknown, productId: unknown): "free" | "pro" | "lifetime" {
  const p = String(plan ?? "");
  if (p === "pro" || p === "lifetime" || p === "free") return p;
  const pid = String(productId ?? "").toLowerCase();
  if (pid.includes("lifetime")) return "lifetime";
  if (pid.includes("pro") || pid.includes("month") || pid.includes("year")) {
    return "pro";
  }
  return "free";
}

function eventAmount(raw: Record<string, unknown> | null): number {
  if (!raw) return 0;
  const amount = Number(raw.price_in_purchased_currency ?? raw.price ?? 0);
  return Number.isFinite(amount) ? amount : 0;
}

function kpi(
  partial: Omit<KpiMetric, "estimated"> & { estimated?: boolean },
): KpiMetric {
  return {
    ...partial,
    estimated: partial.estimated ?? partial.availability === "estimated",
    note: partial.note ?? null,
    dateRange: partial.dateRange ?? null,
    unit: partial.unit ?? null,
  };
}

function futureReserved(key: string, label: string): KpiMetric {
  return kpi({
    key,
    label,
    value: null,
    source: null,
    freshness: null,
    availability: "future_reserved",
    note: "Google Play / Android Future Reserved — not connected; never fake zeros",
  });
}

type SeriesPoint = {
  month: string;
  users: number;
  recipes: number;
  revenue: number | null;
  revenueApple: number | null;
  revenueAndroid: number | null;
  downloadsIos: number | null;
  downloadsAndroid: number | null;
};

async function aggregateRevenueFromPaymentTransactions(
  db: SupabaseClient,
): Promise<{
  apple: number;
  count: number;
  freshness: string | null;
  byMonth: Map<string, { apple: number; order: number }>;
  availability: KpiAvailability;
  source: string;
} | null> {
  const exists = await tableExists(db, CONTRACT_TABLES.paymentTransactions);
  if (!exists) return null;

  const { data, error } = await db
    .from(CONTRACT_TABLES.paymentTransactions)
    .select(
      "store, platform, gross_amount, refund_amount, purchase_at, created_at, event_type",
    )
    .order("created_at", { ascending: false })
    .limit(5000);

  if (error) return null;

  let apple = 0;
  let count = 0;
  let freshness: string | null = null;
  const byMonth = new Map<string, { apple: number; order: number }>();

  for (const row of data ?? []) {
    const store = String(row.store ?? "");
    if (store === "google_play" || row.platform === "android") continue;
    const gross = Number(row.gross_amount ?? 0);
    const refund = Number(row.refund_amount ?? 0);
    const net = Number.isFinite(gross) ? gross - (Number.isFinite(refund) ? refund : 0) : 0;
    if (net === 0 && gross === 0) continue;
    count += 1;
    apple += net;
    const ts = String(row.purchase_at ?? row.created_at);
    if (!freshness || Date.parse(ts) > Date.parse(freshness)) freshness = ts;
    const key = monthShort(ts);
    const order = monthOrder(ts);
    const bucket = byMonth.get(key) ?? { apple: 0, order };
    bucket.apple += net;
    byMonth.set(key, bucket);
  }

  return {
    apple: round2(apple),
    count,
    freshness,
    byMonth,
    availability: count > 0 ? "available" : "no_data",
    source: "payment_transactions",
  };
}

async function aggregateRevenueFromPurchaseEvents(
  db: SupabaseClient,
): Promise<{
  apple: number;
  count: number;
  freshness: string | null;
  byMonth: Map<string, { apple: number; order: number }>;
  recent: Array<Record<string, unknown>>;
}> {
  const { data, error } = await db
    .from("purchase_events")
    .select("id, user_id, event_type, store, raw_event, created_at, product_id")
    .order("created_at", { ascending: false })
    .limit(5000);

  if (error) throw error;

  let apple = 0;
  let count = 0;
  let freshness: string | null = null;
  const byMonth = new Map<string, { apple: number; order: number }>();
  const recentPaid: Array<Record<string, unknown>> = [];

  const eventsAsc = [...(data ?? [])].reverse();
  for (const event of eventsAsc) {
    const type = String(event.event_type ?? "").toUpperCase();
    if (!PAID_TYPES.has(type)) continue;
    // Apple only — never fold Play into live KPIs.
    if (event.store !== "app_store") continue;
    const raw = (event.raw_event ?? {}) as Record<string, unknown>;
    const amount = eventAmount(raw);
    if (amount <= 0) continue;
    count += 1;
    apple += amount;
    const created = String(event.created_at);
    freshness = created;
    const key = monthShort(created);
    const order = monthOrder(created);
    const bucket = byMonth.get(key) ?? { apple: 0, order };
    bucket.apple += amount;
    byMonth.set(key, bucket);
  }

  for (const event of data ?? []) {
    const type = String(event.event_type ?? "").toUpperCase();
    if (!PAID_TYPES.has(type)) continue;
    if (event.store !== "app_store") continue;
    recentPaid.push(event);
    if (recentPaid.length >= 8) break;
  }

  return {
    apple: round2(apple),
    count,
    freshness,
    byMonth,
    recent: recentPaid,
  };
}

async function aggregateIosDownloads(
  db: SupabaseClient,
): Promise<{
  total: number | null;
  freshness: string | null;
  source: string | null;
  availability: KpiAvailability;
  byMonth: Map<string, { ios: number; order: number }>;
  note: string | null;
}> {
  const hasDaily = await tableExists(db, CONTRACT_TABLES.storeAnalyticsDaily);
  if (hasDaily) {
    const { data, error } = await db
      .from(CONTRACT_TABLES.storeAnalyticsDaily)
      .select(
        "metric_date, platform, store, metric_key, metric_value, provider_source, synced_at, data_status",
      )
      .eq("platform", "ios")
      .in("metric_key", [
        "total_downloads",
        "first_time_downloads",
        "redownloads",
      ])
      .order("metric_date", { ascending: true })
      .limit(5000);

    if (!error && data && data.length > 0) {
      let total = 0;
      let freshness: string | null = null;
      let sawNull = false;
      const byMonth = new Map<string, { ios: number; order: number }>();
      for (const row of data) {
        if (row.metric_value == null) {
          sawNull = true;
          continue;
        }
        const v = Number(row.metric_value);
        if (!Number.isFinite(v)) continue;
        total += v;
        const ts = String(row.synced_at ?? row.metric_date);
        if (!freshness || Date.parse(ts) > Date.parse(freshness)) freshness = ts;
        const key = monthShort(String(row.metric_date));
        const order = monthOrder(String(row.metric_date));
        const bucket = byMonth.get(key) ?? { ios: 0, order };
        bucket.ios += v;
        byMonth.set(key, bucket);
      }
      return {
        total: byMonth.size > 0 ? total : null,
        freshness,
        source: "store_analytics_daily",
        availability: byMonth.size > 0
          ? "available"
          : sawNull
          ? "no_data"
          : "no_data",
        byMonth,
        note: sawNull
          ? "Some Apple rows had null metric_value (insufficient/not returned) — not coerced to 0"
          : null,
      };
    }
    if (!error && (!data || data.length === 0)) {
      return {
        total: null,
        freshness: null,
        source: "store_analytics_daily",
        availability: "no_data",
        byMonth: new Map(),
        note:
          "store_analytics_daily present but empty — missing Apple data is not filled with 0",
      };
    }
  }

  // Interim: app_download_stats — exclude seed (demo) and android.
  const { data, error } = await db
    .from("app_download_stats")
    .select("platform, year_month, downloads, source, updated_at")
    .eq("platform", "ios")
    .neq("source", "seed")
    .order("year_month", { ascending: true });

  if (error) throw error;

  const rows = data ?? [];
  if (rows.length === 0) {
    // Check whether only seed rows exist — still no_data for production truth.
    const { count: seedCount } = await db
      .from("app_download_stats")
      .select("*", { count: "exact", head: true })
      .eq("platform", "ios")
      .eq("source", "seed");

    return {
      total: null,
      freshness: null,
      source: hasDaily ? "store_analytics_daily" : "app_download_stats",
      availability: hasDaily
        ? "schema_pending"
        : (seedCount ?? 0) > 0
        ? "no_data"
        : "not_configured",
      byMonth: new Map(),
      note: hasDaily
        ? "ASC daily table unavailable or empty; awaiting #59 sync"
        : (seedCount ?? 0) > 0
        ? "Only seed demo download rows present — excluded from production KPIs"
        : "No non-seed iOS download rows; ASC not configured",
    };
  }

  let total = 0;
  let freshness: string | null = null;
  const byMonth = new Map<string, { ios: number; order: number }>();
  for (const row of rows) {
    const count = Number(row.downloads) || 0;
    total += count;
    const ym = String(row.year_month);
    const key = monthShort(ym);
    const order = monthOrder(ym);
    const bucket = byMonth.get(key) ?? { ios: 0, order };
    bucket.ios += count;
    byMonth.set(key, bucket);
    const u = row.updated_at ? String(row.updated_at) : ym;
    if (!freshness || Date.parse(u) > Date.parse(freshness)) freshness = u;
  }

  return {
    total,
    freshness,
    source: "app_download_stats",
    availability: "available",
    byMonth,
    note: "Interim source until store_analytics_daily (#59) is populated",
  };
}

export async function buildDashboardAggregation(db: SupabaseClient) {
  const now = new Date();
  const monthStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
  ).toISOString();

  const [
    { count: totalUsers },
    { count: newUsersThisMonth },
    { count: suspendedUsers },
    { count: totalRecipes },
    { count: collections },
    { count: activePaidUsers },
    { data: profiles },
    { data: subscriptions },
    { data: recentProfiles },
    { data: recentRecipes },
    { data: monthlyPlans },
    { count: importNeedsReview },
    { count: importFailed },
    { count: importImported },
  ] = await Promise.all([
    db.from("profiles").select("*", { count: "exact", head: true }),
    db
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .gte("created_at", monthStart),
    db
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("account_status", "suspended"),
    db.from("recipes").select("*", { count: "exact", head: true }),
    db.from("collections").select("*", { count: "exact", head: true }),
    db
      .from("subscriptions")
      .select("*", { count: "exact", head: true })
      .in("status", ["active", "trialing"])
      .neq("plan", "free"),
    db.from("profiles").select("registration_type, device_type, created_at"),
    db.from("subscriptions").select("user_id, plan, product_id, status, updated_at"),
    db
      .from("profiles")
      .select(
        "id, email, display_name, registration_type, device_type, registration_ip, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(5),
    db
      .from("recipes")
      .select("id, title, user_id, created_at")
      .order("created_at", { ascending: false })
      .limit(5),
    db
      .from("subscription_plans")
      .select("price")
      .eq("billing_period", "monthly")
      .eq("active", true),
    db
      .from("recipe_import_jobs")
      .select("*", { count: "exact", head: true })
      .eq("status", "needs_review"),
    db
      .from("recipe_import_jobs")
      .select("*", { count: "exact", head: true })
      .eq("status", "failed"),
    db
      .from("recipe_import_jobs")
      .select("*", { count: "exact", head: true })
      .eq("status", "imported"),
  ]);

  const paymentTx = await aggregateRevenueFromPaymentTransactions(db);
  const purchaseFallback = await aggregateRevenueFromPurchaseEvents(db);
  const downloads = await aggregateIosDownloads(db);

  const revenueApple = paymentTx?.apple ?? purchaseFallback.apple;
  const paymentCount = paymentTx?.count ?? purchaseFallback.count;
  const revenueFreshness = paymentTx?.freshness ?? purchaseFallback.freshness;
  const revenueSource = paymentTx?.source ?? "purchase_events";
  const revenueAvailability: KpiAvailability = paymentTx
    ? paymentTx.availability
    : paymentCount > 0
    ? "estimated"
    : "no_data";
  const revenueByMonth = paymentTx?.byMonth ?? purchaseFallback.byMonth;

  const byRegistrationType = {
    apple: 0,
    google: 0,
    email: 0,
    unknown: 0,
  };
  const byDeviceType = {
    iphone: 0,
    ipad: 0,
    android: 0,
    web: 0,
    unknown: 0,
  };
  for (const row of profiles ?? []) {
    const reg = String(row.registration_type ?? "unknown");
    if (reg in byRegistrationType) {
      byRegistrationType[reg as keyof typeof byRegistrationType] += 1;
    } else {
      byRegistrationType.unknown += 1;
    }
    const device = String(row.device_type ?? "unknown");
    if (device in byDeviceType) {
      byDeviceType[device as keyof typeof byDeviceType] += 1;
    } else {
      byDeviceType.unknown += 1;
    }
  }

  const byPlan = { free: 0, pro: 0, lifetime: 0 };
  let subsFreshness: string | null = null;
  for (const row of subscriptions ?? []) {
    byPlan[mapPlan(row.plan, row.product_id)] += 1;
    const u = row.updated_at ? String(row.updated_at) : null;
    if (u && (!subsFreshness || Date.parse(u) > Date.parse(subsFreshness))) {
      subsFreshness = u;
    }
  }
  const knownSubs = (subscriptions ?? []).length;
  byPlan.free += Math.max((totalUsers ?? 0) - knownSubs, 0);

  const usersByMonth = new Map<string, { count: number; order: number }>();
  const recipesByMonth = new Map<string, { count: number; order: number }>();

  const { data: allProfilesForGrowth } = await db
    .from("profiles")
    .select("created_at")
    .order("created_at", { ascending: true })
    .limit(10000);
  for (const row of allProfilesForGrowth ?? []) {
    const created = String(row.created_at);
    const key = monthShort(created);
    const order = monthOrder(created);
    const bucket = usersByMonth.get(key) ?? { count: 0, order };
    bucket.count += 1;
    usersByMonth.set(key, bucket);
  }

  const { data: allRecipesForGrowth } = await db
    .from("recipes")
    .select("created_at")
    .order("created_at", { ascending: true })
    .limit(10000);
  for (const row of allRecipesForGrowth ?? []) {
    const created = String(row.created_at);
    const key = monthShort(created);
    const order = monthOrder(created);
    const bucket = recipesByMonth.get(key) ?? { count: 0, order };
    bucket.count += 1;
    recipesByMonth.set(key, bucket);
  }

  const allOrders = new Map<string, number>();
  for (const [k, v] of usersByMonth) allOrders.set(k, v.order);
  for (const [k, v] of recipesByMonth) allOrders.set(k, v.order);
  for (const [k, v] of revenueByMonth) allOrders.set(k, v.order);
  for (const [k, v] of downloads.byMonth) allOrders.set(k, v.order);

  const orderedMonths = [...allOrders.entries()]
    .sort((a, b) => a[1] - b[1])
    .slice(-6)
    .map(([month]) => month);

  let cumUsers = 0;
  let cumRecipes = 0;
  const minOrder = orderedMonths.length
    ? Math.min(...orderedMonths.map((m) => allOrders.get(m)!))
    : 0;
  for (const [month, v] of usersByMonth) {
    if ((allOrders.get(month) ?? 0) < minOrder) cumUsers += v.count;
  }
  for (const [month, v] of recipesByMonth) {
    if ((allOrders.get(month) ?? 0) < minOrder) cumRecipes += v.count;
  }

  const series: SeriesPoint[] = orderedMonths.map((month) => {
    cumUsers += usersByMonth.get(month)?.count ?? 0;
    cumRecipes += recipesByMonth.get(month)?.count ?? 0;
    const rev = revenueByMonth.get(month) ?? { apple: 0, order: 0 };
    const dl = downloads.byMonth.get(month);
    return {
      month,
      users: cumUsers,
      recipes: cumRecipes,
      revenue: round2(rev.apple),
      revenueApple: round2(rev.apple),
      revenueAndroid: null,
      downloadsIos: dl ? dl.ios : null,
      downloadsAndroid: null,
    };
  });

  const growth = series.map((p) => ({
    month: p.month,
    users: p.users,
    recipes: p.recipes,
  }));

  const avgMonthly =
    (monthlyPlans ?? []).reduce((sum, p) => sum + Number(p.price), 0) /
    Math.max((monthlyPlans ?? []).length, 1);
  const revenueMrr = round2(avgMonthly * (activePaidUsers ?? 0));

  const recentPaid = paymentTx
    ? []
    : purchaseFallback.recent;
  const payUserIds = [
    ...new Set(
      recentPaid.map((e) => e.user_id).filter(Boolean),
    ),
  ] as string[];
  const labelByUser = new Map<string, string>();
  if (payUserIds.length) {
    const { data: payProfiles } = await db
      .from("profiles")
      .select("id, email, display_name")
      .in("id", payUserIds);
    for (const p of payProfiles ?? []) {
      labelByUser.set(
        p.id,
        String(p.display_name || p.email || p.id.slice(0, 8)),
      );
    }
  }

  const recentPayments = recentPaid.map((event) => {
    const raw = (event.raw_event ?? {}) as Record<string, unknown>;
    const amount = eventAmount(raw);
    return {
      id: event.id,
      userLabel: labelByUser.get(String(event.user_id)) ?? "Unknown user",
      eventType: String(event.event_type ?? ""),
      store: String(event.store ?? "unknown"),
      amount: amount > 0 ? round2(amount) : amount === 0 ? 0 : null,
      currency: String(raw.currency ?? "USD"),
      createdAt: String(event.created_at),
      source: "purchase_events",
      estimated: true,
    };
  });

  type Activity = {
    id: string;
    type: "user" | "recipe" | "collection" | "subscription" | "payment" | "download";
    title: string;
    subtitle: string;
    createdAt: string;
  };
  const recent: Activity[] = [];

  for (const p of recentProfiles ?? []) {
    recent.push({
      id: `user_${p.id}`,
      type: "user",
      title: `${p.display_name || p.email || "User"} joined`,
      subtitle: [
        p.registration_type ?? "unknown",
        p.device_type ?? "unknown",
        p.registration_ip ?? "",
      ]
        .filter(Boolean)
        .join(" · "),
      createdAt: String(p.created_at),
    });
  }

  const recipeOwnerIds = [
    ...new Set((recentRecipes ?? []).map((r) => r.user_id).filter(Boolean)),
  ] as string[];
  const recipeOwnerLabel = new Map<string, string>();
  if (recipeOwnerIds.length) {
    const { data: owners } = await db
      .from("profiles")
      .select("id, email, display_name")
      .in("id", recipeOwnerIds);
    for (const o of owners ?? []) {
      recipeOwnerLabel.set(o.id, String(o.email || o.display_name || o.id));
    }
  }
  for (const r of recentRecipes ?? []) {
    recent.push({
      id: `recipe_${r.id}`,
      type: "recipe",
      title: String(r.title ?? "Recipe"),
      subtitle: `Recipe created by ${
        recipeOwnerLabel.get(r.user_id) ?? "unknown"
      }`,
      createdAt: String(r.created_at),
    });
  }

  for (const pay of recentPayments.slice(0, 3)) {
    recent.push({
      id: `payment_${pay.id}`,
      type: "payment",
      title: `${pay.eventType}`,
      subtitle: `${pay.userLabel} · ${pay.store} · ${
        pay.amount == null ? "—" : `$${pay.amount}`
      } (estimated)`,
      createdAt: pay.createdAt,
    });
  }

  recent.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));

  const profilesFreshness = (recentProfiles ?? [])[0]?.created_at
    ? String((recentProfiles ?? [])[0].created_at)
    : null;

  const kpis: KpiMetric[] = [
    kpi({
      key: "new_users_this_month",
      label: "New users (month)",
      value: newUsersThisMonth ?? 0,
      source: "cookapp_db.profiles",
      freshness: profilesFreshness,
      availability: "available",
      dateRange: { from: monthStart, to: now.toISOString() },
    }),
    kpi({
      key: "total_users",
      label: "Total users",
      value: totalUsers ?? 0,
      source: "cookapp_db.profiles",
      freshness: profilesFreshness,
      availability: "available",
    }),
    kpi({
      key: "active_paid_users",
      label: "Active paid users",
      value: activePaidUsers ?? 0,
      source: "cookapp_db.subscriptions",
      freshness: subsFreshness,
      availability: "available",
      note: "Entitlement mirror from RevenueCat webhook",
    }),
    kpi({
      key: "revenue_apple_estimated",
      label: "Apple revenue (estimated)",
      value: paymentCount > 0 || revenueAvailability === "available"
        ? revenueApple
        : null,
      unit: "currency",
      source: revenueSource,
      freshness: revenueFreshness,
      availability: revenueAvailability,
      estimated: revenueAvailability === "estimated",
      note: paymentTx
        ? "Normalized payment_transactions (#58)"
        : "From purchase_events — not final Apple Financial proceeds",
    }),
    futureReserved("revenue_android", "Android revenue"),
    kpi({
      key: "revenue_mrr_estimated",
      label: "MRR (estimated)",
      value: revenueMrr,
      unit: "currency",
      source: "subscription_plans+subscriptions",
      freshness: subsFreshness,
      availability: "estimated",
      note: "Active paid × average monthly plan price",
    }),
    kpi({
      key: "downloads_ios",
      label: "iOS downloads",
      value: downloads.total,
      source: downloads.source,
      freshness: downloads.freshness,
      availability: downloads.availability,
      note: downloads.note,
    }),
    futureReserved("downloads_android", "Android downloads"),
    kpi({
      key: "import_needs_review",
      label: "Imports needing review",
      value: importNeedsReview ?? 0,
      source: "cookapp_db.recipe_import_jobs",
      freshness: null,
      availability: "available",
    }),
    kpi({
      key: "import_failed",
      label: "Import failures",
      value: importFailed ?? 0,
      source: "cookapp_db.recipe_import_jobs",
      freshness: null,
      availability: "available",
    }),
    kpi({
      key: "import_imported",
      label: "Imports succeeded",
      value: importImported ?? 0,
      source: "cookapp_db.recipe_import_jobs",
      freshness: null,
      availability: "available",
    }),
  ];

  const paymentTransactionsSchemaPending = !(await tableExists(
    db,
    CONTRACT_TABLES.paymentTransactions,
  ));
  const storeAnalyticsSchemaPending = !(await tableExists(
    db,
    CONTRACT_TABLES.storeAnalyticsDaily,
  ));

  return {
    generatedAt: now.toISOString(),
    kpis,
    platforms: {
      ios: { availability: "available" as const },
      android: {
        availability: "future_reserved" as const,
        status: "not_connected" as const,
        note: "Google Play Future Reserved — hidden from live KPI cards",
      },
    },
    schema: {
      paymentTransactions: paymentTransactionsSchemaPending
        ? "schema_pending"
        : "present",
      storeAnalyticsDaily: storeAnalyticsSchemaPending
        ? "schema_pending"
        : "present",
      contractsDoc: "docs/backend/AGGREGATION_CONTRACTS.md",
    },
    // Legacy Admin UI shape — Android numeric fields forced null (never fake 0).
    stats: {
      totalUsers: totalUsers ?? 0,
      totalRecipes: totalRecipes ?? 0,
      collections: collections ?? 0,
      favorites: 0,
      newUsersThisMonth: newUsersThisMonth ?? 0,
      activePaidUsers: activePaidUsers ?? 0,
      suspendedUsers: suspendedUsers ?? 0,
      revenueTotal: revenueAvailability === "no_data" ? null : revenueApple,
      revenueMrr,
      revenueApple: revenueAvailability === "no_data" ? null : revenueApple,
      revenueAndroid: null,
      paymentTransactions: paymentCount,
      downloadsTotal: downloads.total,
      downloadsIos: downloads.total,
      downloadsAndroid: null,
    },
    growth,
    series,
    userBreakdown: {
      byRegistrationType: [
        { key: "apple", label: "Apple", value: byRegistrationType.apple },
        { key: "google", label: "Google", value: byRegistrationType.google },
        { key: "email", label: "Email", value: byRegistrationType.email },
        { key: "unknown", label: "Unknown", value: byRegistrationType.unknown },
      ],
      byDeviceType: [
        { key: "iphone", label: "iPhone", value: byDeviceType.iphone },
        { key: "ipad", label: "iPad", value: byDeviceType.ipad },
        { key: "android", label: "Android", value: byDeviceType.android },
        { key: "web", label: "Web", value: byDeviceType.web },
        { key: "unknown", label: "Unknown", value: byDeviceType.unknown },
      ],
      byPlan: [
        { key: "free", label: "Free", value: byPlan.free },
        { key: "pro", label: "Pro", value: byPlan.pro },
        { key: "lifetime", label: "Lifetime", value: byPlan.lifetime },
      ],
    },
    recent: recent.slice(0, 8),
    recentPayments,
  };
}

export async function buildAnalyticsAggregation(
  db: SupabaseClient,
  options?: { from?: string | null; to?: string | null },
) {
  const dashboard = await buildDashboardAggregation(db);
  const downloadsKpi = dashboard.kpis.find((k) => k.key === "downloads_ios");
  const androidDl = dashboard.kpis.find((k) => k.key === "downloads_android");
  const importOk = dashboard.kpis.find((k) => k.key === "import_imported");
  const importFail = dashboard.kpis.find((k) => k.key === "import_failed");
  const importReview = dashboard.kpis.find((k) =>
    k.key === "import_needs_review"
  );

  const { data: bySourceType } = await db
    .from("recipe_import_jobs")
    .select("source_type, status");

  const importBySource: Record<string, { total: number; imported: number; failed: number }> = {};
  for (const row of bySourceType ?? []) {
    const src = String(row.source_type ?? "unknown");
    const bucket = importBySource[src] ?? { total: 0, imported: 0, failed: 0 };
    bucket.total += 1;
    if (row.status === "imported") bucket.imported += 1;
    if (row.status === "failed") bucket.failed += 1;
    importBySource[src] = bucket;
  }

  return {
    generatedAt: dashboard.generatedAt,
    dateRange: {
      from: options?.from ?? null,
      to: options?.to ?? null,
    },
    downloads: {
      ios: downloadsKpi,
      android: androidDl,
      series: dashboard.series.map((s) => ({
        month: s.month,
        downloadsIos: s.downloadsIos,
        downloadsAndroid: null,
      })),
    },
    userGrowth: {
      source: "cookapp_db.profiles",
      series: dashboard.growth,
    },
    importQuality: {
      source: "cookapp_db.recipe_import_jobs",
      imported: importOk?.value ?? 0,
      failed: importFail?.value ?? 0,
      needsReview: importReview?.value ?? 0,
      bySourceType: Object.entries(importBySource).map(([key, v]) => ({
        key,
        ...v,
      })),
    },
    revenue: {
      apple: dashboard.kpis.find((k) => k.key === "revenue_apple_estimated"),
      android: dashboard.kpis.find((k) => k.key === "revenue_android"),
      note: "Analytics must not merge Financial Report final proceeds with RC estimates",
    },
    platforms: dashboard.platforms,
    schema: dashboard.schema,
  };
}
