/**
 * Commerce mapping unit tests (Issue #58).
 * Run: deno test --allow-env supabase/functions/_shared/commerce/
 */

import {
  assertEquals,
  assertNotEquals,
} from "jsr:@std/assert@1";
import {
  googlePlayCommerceProvider,
  mapCommercePlatform,
  mapCommerceStore,
  normalizeAdminStoreFilter,
  revenueCatCommerceProvider,
} from "./provider.ts";
import {
  isPaidRevenueCatEventType,
  mapRevenueCatEventToPaymentTransaction,
  maskPurchaseToken,
  toUpsertPaymentTransactionArgs,
} from "./revenuecat-map.ts";

Deno.test("mapCommerceStore normalizes play_store → google_play", () => {
  assertEquals(mapCommerceStore("play_store"), "google_play");
  assertEquals(mapCommerceStore("PLAY_STORE"), "google_play");
  assertEquals(mapCommerceStore("google_play"), "google_play");
  assertEquals(mapCommerceStore("app_store"), "app_store");
  assertEquals(mapCommerceStore("MAC_APP_STORE"), "app_store");
});

Deno.test("mapCommercePlatform derives ios/android from store", () => {
  assertEquals(mapCommercePlatform("app_store"), "ios");
  assertEquals(mapCommercePlatform("play_store"), "android");
  assertEquals(mapCommercePlatform("stripe"), null);
});

Deno.test("Google Play provider is reserved (no live sync)", () => {
  assertEquals(googlePlayCommerceProvider.status, "reserved_not_implemented");
  assertEquals(googlePlayCommerceProvider.id, "google_play");
  assertEquals(revenueCatCommerceProvider.status, "active");
});

Deno.test("normalizeAdminStoreFilter accepts play_store alias", () => {
  assertEquals(normalizeAdminStoreFilter("play_store"), "google_play");
  assertEquals(normalizeAdminStoreFilter("google_play"), "google_play");
  assertEquals(normalizeAdminStoreFilter("app_store"), "app_store");
  assertEquals(normalizeAdminStoreFilter("stripe"), null);
});

Deno.test("mapRevenueCatEventToPaymentTransaction maps INITIAL_PURCHASE", () => {
  const row = mapRevenueCatEventToPaymentTransaction({
    userId: "11111111-1111-4111-8111-111111111111",
    store: "app_store",
    environment: "production",
    event: {
      id: "rc_evt_1",
      type: "INITIAL_PURCHASE",
      product_id: "com.natefox.cookapp.pro.monthly",
      entitlement_ids: ["pro"],
      purchased_at_ms: 1_700_000_000_000,
      expiration_at_ms: 1_700_259_200_000,
      currency: "USD",
      price: 4.99,
      price_in_purchased_currency: 4.99,
      country_code: "US",
      transaction_id: "2000000123456789",
      original_transaction_id: "2000000123456789",
    },
  });

  assertEquals(row.providerSource, "revenuecat");
  assertEquals(row.providerEventId, "rc_evt_1");
  assertEquals(row.platform, "ios");
  assertEquals(row.store, "app_store");
  assertEquals(row.status, "active");
  assertEquals(row.grossAmount, 4.99);
  assertEquals(row.estimatedGrossUsd, 4.99);
  assertEquals(row.finalProceeds, null);
  assertEquals(row.estimatedProceeds, null);
  assertEquals(row.orderId, null);
  assertEquals(row.purchaseToken, null);
  assertEquals(row.territory, "US");
  assertEquals(isPaidRevenueCatEventType(row.eventType), true);
});

Deno.test("mapRevenueCatEventToPaymentTransaction maps Play Store → google_play", () => {
  const row = mapRevenueCatEventToPaymentTransaction({
    userId: "11111111-1111-4111-8111-111111111111",
    store: "play_store",
    event: {
      id: "rc_evt_android",
      type: "RENEWAL",
      product_id: "cookapp_pro_monthly",
      purchased_at_ms: 1_700_000_000_000,
      currency: "EUR",
      price: 5.49,
      price_in_purchased_currency: 4.99,
      country_code: "DE",
    },
  });
  assertEquals(row.platform, "android");
  assertEquals(row.store, "google_play");
  assertEquals(row.renewalAt, row.purchaseAt);
  assertEquals(row.currency, "EUR");
  assertEquals(row.grossAmount, 4.99);
  assertEquals(row.estimatedGrossUsd, 5.49);
});

Deno.test("refund cancellation sets refund fields; final_proceeds stays null", () => {
  const row = mapRevenueCatEventToPaymentTransaction({
    userId: "11111111-1111-4111-8111-111111111111",
    store: "app_store",
    event: {
      id: "rc_evt_refund",
      type: "CANCELLATION",
      cancellation_reason: "REFUND",
      price_in_purchased_currency: 4.99,
      currency: "USD",
      event_timestamp_ms: 1_700_100_000_000,
    },
  });
  assertEquals(row.status, "refunded");
  assertEquals(row.refundAmount, 4.99);
  assertNotEquals(row.refundAt, null);
  assertEquals(row.finalProceeds, null);
});

Deno.test("idempotent upsert args keep stable provider key", () => {
  const event = {
    id: "rc_evt_dup",
    type: "INITIAL_PURCHASE",
    product_id: "com.natefox.cookapp.pro.monthly",
    price_in_purchased_currency: 4.99,
    currency: "USD",
  };
  const a = toUpsertPaymentTransactionArgs(
    mapRevenueCatEventToPaymentTransaction({
      userId: "11111111-1111-4111-8111-111111111111",
      store: "app_store",
      event,
    }),
  );
  const b = toUpsertPaymentTransactionArgs(
    mapRevenueCatEventToPaymentTransaction({
      userId: "11111111-1111-4111-8111-111111111111",
      store: "app_store",
      event,
    }),
  );
  assertEquals(a.p_provider_source, "revenuecat");
  assertEquals(a.p_provider_event_id, "rc_evt_dup");
  assertEquals(a.p_provider_event_id, b.p_provider_event_id);
  assertEquals(a.p_final_proceeds, null);
  assertEquals(JSON.stringify(a), JSON.stringify(b));
});

Deno.test("maskPurchaseToken never returns full token", () => {
  assertEquals(maskPurchaseToken(null), null);
  assertEquals(maskPurchaseToken("abcd"), "••••");
  assertEquals(maskPurchaseToken("purchase-token-xyz9"), "••••xyz9");
  assertEquals(
    maskPurchaseToken("purchase-token-xyz9")?.includes("purchase-token"),
    false,
  );
});
