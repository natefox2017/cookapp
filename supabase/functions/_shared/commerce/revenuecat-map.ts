/**
 * RevenueCat event → payment_transactions row mapping (Issue #58).
 * Amounts from RC are estimated operational figures — never final_proceeds.
 */

import {
  mapCommercePlatform,
  mapCommerceStore,
  type CommerceEnvironment,
  type CommercePlatform,
  type CommerceStore,
  type PaymentTransactionStatus,
} from "./provider.ts";

const STATUS_MAP: Record<string, PaymentTransactionStatus> = {
  INITIAL_PURCHASE: "active",
  RENEWAL: "active",
  PRODUCT_CHANGE: "active",
  UNCANCELLATION: "active",
  NON_RENEWING_PURCHASE: "active",
  SUBSCRIPTION_EXTENDED: "active",
  TEMPORARY_ENTITLEMENT_GRANT: "active",
  CANCELLATION: "cancelled",
  EXPIRATION: "expired",
  BILLING_ISSUE: "billing_issue",
};

const PAID_EVENT_TYPES = new Set([
  "INITIAL_PURCHASE",
  "RENEWAL",
  "NON_RENEWING_PURCHASE",
  "PRODUCT_CHANGE",
]);

export type RevenueCatPaymentRow = {
  userId: string;
  platform: CommercePlatform | null;
  store: CommerceStore | null;
  environment: CommerceEnvironment | null;
  productId: string | null;
  entitlementId: string | null;
  transactionId: string | null;
  originalTransactionId: string | null;
  orderId: null;
  purchaseToken: null;
  eventType: string;
  status: PaymentTransactionStatus;
  purchaseAt: string | null;
  renewalAt: string | null;
  expiresAt: string | null;
  cancelAt: string | null;
  refundAt: string | null;
  currency: string | null;
  grossAmount: number | null;
  refundAmount: number | null;
  estimatedProceeds: null;
  finalProceeds: null;
  estimatedGrossUsd: number | null;
  territory: string | null;
  providerSource: "revenuecat";
  providerEventId: string | null;
};

function msToIso(ms: unknown): string | null {
  if (ms == null) return null;
  const n = typeof ms === "number" ? ms : Number(ms);
  if (!Number.isFinite(n) || n <= 0) return null;
  return new Date(n).toISOString();
}

function numOrNull(value: unknown): number | null {
  if (value == null || value === "") return null;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

function isRefundCancellation(event: Record<string, unknown>): boolean {
  const reason = String(event.cancellation_reason ?? "").toLowerCase();
  return reason === "customer_support" || reason === "refund";
}

/**
 * Map a sanitized RevenueCat `event` object into a payment_transactions payload.
 * Does not write to the database — callers pass this to upsert_payment_transaction RPC.
 */
export function mapRevenueCatEventToPaymentTransaction(input: {
  userId: string;
  event: Record<string, unknown>;
  /** Already-normalized store label from webhook (app_store / play_store / …). */
  store?: string | null;
  environment?: string | null;
  entitlementId?: string | null;
  expiresAtIso?: string | null;
  subscriptionStatus?: string | null;
}): RevenueCatPaymentRow {
  const event = input.event;
  const type = String(event.type ?? "").toUpperCase();
  const storeRaw =
    input.store ??
    String(event.store ?? "").toLowerCase() ??
    null;
  const store = mapCommerceStore(storeRaw);
  const platform = mapCommercePlatform(storeRaw);

  const environmentRaw = String(
    input.environment ?? event.environment ?? "PRODUCTION",
  ).toUpperCase();
  const environment: CommerceEnvironment =
    environmentRaw === "SANDBOX" ? "sandbox" : "production";

  const purchaseAt = msToIso(event.purchased_at_ms);
  const eventAt = msToIso(event.event_timestamp_ms);
  const expiresAt = input.expiresAtIso ?? msToIso(event.expiration_at_ms);

  const entitlementIds = Array.isArray(event.entitlement_ids)
    ? event.entitlement_ids.map(String)
    : [];
  const entitlementId =
    input.entitlementId ?? entitlementIds[0] ?? null;

  const grossAmount = numOrNull(event.price_in_purchased_currency);
  const estimatedGrossUsd = numOrNull(event.price);
  const currency =
    event.currency == null || event.currency === ""
      ? null
      : String(event.currency);

  let status: PaymentTransactionStatus =
    STATUS_MAP[type] ??
    (input.subscriptionStatus as PaymentTransactionStatus) ??
    "unknown";

  let cancelAt: string | null = null;
  let refundAt: string | null = null;
  let refundAmount: number | null = null;

  if (type === "CANCELLATION") {
    cancelAt = eventAt ?? new Date().toISOString();
    if (isRefundCancellation(event)) {
      status = "refunded";
      refundAt = cancelAt;
      refundAmount = grossAmount;
    }
  }

  const renewalAt = type === "RENEWAL" ? purchaseAt : null;
  const providerEventId = String(event.id ?? "").trim() || null;

  return {
    userId: input.userId,
    platform,
    store,
    environment,
    productId: String(event.product_id ?? "").trim() || null,
    entitlementId,
    transactionId: String(event.transaction_id ?? "").trim() || null,
    originalTransactionId:
      String(event.original_transaction_id ?? "").trim() || null,
    orderId: null,
    purchaseToken: null,
    eventType: type || String(event.type ?? "UNKNOWN"),
    status,
    purchaseAt,
    renewalAt,
    expiresAt,
    cancelAt,
    refundAt,
    currency,
    grossAmount,
    refundAmount,
    estimatedProceeds: null,
    finalProceeds: null,
    estimatedGrossUsd,
    territory: String(event.country_code ?? "").trim() || null,
    providerSource: "revenuecat",
    providerEventId,
  };
}

export function isPaidRevenueCatEventType(eventType: string): boolean {
  return PAID_EVENT_TYPES.has(String(eventType).toUpperCase());
}

/** RPC argument object matching upsert_payment_transaction. */
export function toUpsertPaymentTransactionArgs(row: RevenueCatPaymentRow) {
  return {
    p_user_id: row.userId,
    p_platform: row.platform,
    p_store: row.store,
    p_environment: row.environment,
    p_product_id: row.productId,
    p_entitlement_id: row.entitlementId,
    p_transaction_id: row.transactionId,
    p_original_transaction_id: row.originalTransactionId,
    p_order_id: row.orderId,
    p_purchase_token: row.purchaseToken,
    p_event_type: row.eventType,
    p_status: row.status,
    p_purchase_at: row.purchaseAt,
    p_renewal_at: row.renewalAt,
    p_expires_at: row.expiresAt,
    p_cancel_at: row.cancelAt,
    p_refund_at: row.refundAt,
    p_currency: row.currency,
    p_gross_amount: row.grossAmount,
    p_refund_amount: row.refundAmount,
    p_estimated_proceeds: row.estimatedProceeds,
    p_final_proceeds: row.finalProceeds,
    p_estimated_gross_usd: row.estimatedGrossUsd,
    p_territory: row.territory,
    p_provider_source: row.providerSource,
    p_provider_event_id: row.providerEventId,
  };
}

/** Mask Google Play purchase tokens for Admin responses. */
export function maskPurchaseToken(
  token: string | null | undefined,
): string | null {
  if (!token) return null;
  if (token.length <= 4) return "••••";
  return `••••${token.slice(-4)}`;
}
