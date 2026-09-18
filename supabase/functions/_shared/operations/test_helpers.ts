/**
 * Pure helpers for Deno tests without a live Supabase client.
 */

export { clearTableExistsCache } from "./table-probe.ts";
export { isManualRunJobType } from "./types.ts";
export {
  mapOperationalJob,
  providerForJobType,
  toAdminJob,
} from "./jobs.ts";
export { probeGooglePlay } from "./integrations.ts";

import type { KpiAvailability } from "./types.ts";

export function kpiAvailabilityRules(input: {
  iosDownloads: number | null;
  onlySeedRows: boolean;
  paymentTxPresent: boolean;
  purchaseEventCount: number;
}): {
  downloadsIos: { availability: KpiAvailability; value: number | null };
  downloadsAndroid: { availability: KpiAvailability; value: number | null };
  revenueApple: { availability: KpiAvailability; value: number | null };
  revenueAndroid: { availability: KpiAvailability; value: number | null };
} {
  const downloadsIos = input.onlySeedRows || input.iosDownloads == null
    ? { availability: "no_data" as const, value: null }
    : { availability: "available" as const, value: input.iosDownloads };

  const revenueApple = input.paymentTxPresent
    ? {
      availability: (input.purchaseEventCount > 0
        ? "available"
        : "no_data") as KpiAvailability,
      value: input.purchaseEventCount > 0 ? 1 : null,
    }
    : input.purchaseEventCount > 0
    ? { availability: "estimated" as const, value: 1 }
    : { availability: "no_data" as const, value: null };

  return {
    downloadsIos,
    downloadsAndroid: {
      availability: "future_reserved",
      value: null,
    },
    revenueApple,
    revenueAndroid: {
      availability: "future_reserved",
      value: null,
    },
  };
}

export function futureReservedAndroidGuard(stats: {
  revenueApple: number | null;
  revenueAndroid: number | null;
  downloadsIos: number | null;
  downloadsAndroid: number | null;
  downloadsTotal: number | null;
}) {
  return {
    ...stats,
    revenueAndroid: null,
    downloadsAndroid: null,
  };
}
