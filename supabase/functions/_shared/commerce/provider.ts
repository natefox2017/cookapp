/**
 * Commerce provider interfaces + store/platform enums (Issue #58).
 *
 * Google Play is Future Reserved: schema/enum compatibility only.
 * No live sync, credentials, jobs, or mock Android revenue in this module.
 */

export type CommercePlatform = "ios" | "android";

/** Canonical store values on payment_transactions. */
export type CommerceStore =
  | "app_store"
  | "google_play"
  | "stripe"
  | "promotional"
  | "rc_billing"
  | "unknown";

/** Legacy webhook / subscriptions.store labels still used operationally. */
export type LegacyStoreLabel =
  | "app_store"
  | "play_store"
  | "stripe"
  | "promotional"
  | "rc_billing"
  | "unknown";

export type CommerceEnvironment = "sandbox" | "production";

export type CommerceProviderSource =
  | "revenuecat"
  | "app_store"
  | "google_play"
  | "apple_financial"
  | "manual";

export type PaymentTransactionStatus =
  | "active"
  | "trialing"
  | "cancelled"
  | "expired"
  | "billing_issue"
  | "refunded"
  | "unknown";

/**
 * Unified commerce ingest surface for future store providers.
 * RevenueCat webhook uses mapRevenueCatEvent → upsert_payment_transaction RPC.
 * GooglePlayCommerceProvider remains a reserved stub until Android work starts.
 */
export interface CommerceProvider {
  readonly id: CommerceProviderSource;
  readonly platform: CommercePlatform | "multi";
  readonly status: "active" | "reserved_not_implemented";
}

export const revenueCatCommerceProvider: CommerceProvider = {
  id: "revenuecat",
  platform: "multi",
  status: "active",
};

/** Reserved — do not instantiate sync jobs or invent Android rows. */
export const googlePlayCommerceProvider: CommerceProvider = {
  id: "google_play",
  platform: "android",
  status: "reserved_not_implemented",
};

export const appleAppStoreCommerceProvider: CommerceProvider = {
  id: "app_store",
  platform: "ios",
  status: "reserved_not_implemented",
};

export function mapCommerceStore(
  store: string | null | undefined,
): CommerceStore | null {
  const s = String(store ?? "").toLowerCase();
  switch (s) {
    case "app_store":
    case "mac_app_store":
      return "app_store";
    case "play_store":
    case "google_play":
      return "google_play";
    case "stripe":
      return "stripe";
    case "promotional":
      return "promotional";
    case "rc_billing":
      return "rc_billing";
    case "unknown":
      return "unknown";
    default:
      return s ? (s as CommerceStore) : null;
  }
}

export function mapCommercePlatform(
  store: string | null | undefined,
): CommercePlatform | null {
  const mapped = mapCommerceStore(store);
  if (mapped === "app_store") return "ios";
  if (mapped === "google_play") return "android";
  return null;
}

/** Admin list filter: legacy play_store alias → google_play. */
export function normalizeAdminStoreFilter(
  value: string | null | undefined,
): CommerceStore | LegacyStoreLabel | null {
  const v = String(value ?? "").trim().toLowerCase();
  if (!v) return null;
  if (v === "play_store" || v === "google_play") return "google_play";
  if (v === "app_store") return "app_store";
  return null;
}
