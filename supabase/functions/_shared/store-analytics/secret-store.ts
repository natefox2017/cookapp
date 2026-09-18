/** AES-GCM secret store for App Store / Play integration keys (server-side only). */

import type { SupabaseClient } from "jsr:@supabase/supabase-js@2";
import { AppError } from "../errors.ts";
import {
  decryptSecret,
  encryptSecret,
  resolveMasterKeyBytes,
} from "../ai-secret-store.ts";

function resolveStoreMasterKeyBytes(): Uint8Array {
  const storeKey = Deno.env.get("COOKAPP_STORE_MASTER_KEY");
  if (storeKey) return resolveMasterKeyBytes(storeKey);
  // Reuse AI master key when Owner has not provisioned a separate store key.
  return resolveMasterKeyBytes();
}

export function newStoreSecretRef(provider: string): string {
  return `store_${provider}_private_key`;
}

export class StoreSecretStore {
  constructor(private readonly db: SupabaseClient) {}

  async put(secretRef: string, plaintext: string): Promise<{ secretRef: string }> {
    const sealed = await encryptSecret(plaintext, resolveStoreMasterKeyBytes());
    const now = new Date().toISOString();
    const { error } = await this.db.from("store_secrets").upsert(
      {
        secret_ref: secretRef,
        ciphertext: sealed.ciphertext,
        nonce: sealed.nonce,
        key_version: sealed.keyVersion,
        updated_at: now,
      },
      { onConflict: "secret_ref" },
    );
    if (error) {
      throw new AppError("internal_error", "Failed to store integration secret", 500, {
        message: error.message,
      });
    }
    return { secretRef };
  }

  async getPlaintext(secretRef: string): Promise<string> {
    const { data, error } = await this.db
      .from("store_secrets")
      .select("ciphertext, nonce")
      .eq("secret_ref", secretRef)
      .maybeSingle();
    if (error) {
      throw new AppError("internal_error", "Failed to load integration secret", 500, {
        message: error.message,
      });
    }
    if (!data) {
      throw new AppError("not_found", "Store secret not configured", 404);
    }
    return decryptSecret(
      data.ciphertext as string,
      data.nonce as string,
      resolveStoreMasterKeyBytes(),
    );
  }

  async isConfigured(secretRef: string | null | undefined): Promise<boolean> {
    if (!secretRef) return false;
    const { data, error } = await this.db
      .from("store_secrets")
      .select("secret_ref")
      .eq("secret_ref", secretRef)
      .maybeSingle();
    if (error) return false;
    return Boolean(data);
  }
}

/** Prefer DB secrets; fall back to Supabase Edge env (OWNER_CONFIG). */
export async function resolveAppleCredentials(
  db: SupabaseClient,
): Promise<{
  configured: boolean;
  credentials: {
    issuerId: string;
    keyId: string;
    privateKeyPem: string;
    vendorNumber: string | null;
    appAppleId: string | null;
  } | null;
  source: "database" | "env" | "none";
}> {
  const { data: integration } = await db
    .from("store_integrations")
    .select(
      "issuer_id, key_id, vendor_number, app_apple_id, secret_ref, status",
    )
    .eq("provider", "apple_app_store")
    .maybeSingle();

  const envIssuer = Deno.env.get("ASC_ISSUER_ID")?.trim() || "";
  const envKeyId = Deno.env.get("ASC_KEY_ID")?.trim() || "";
  const envPem = Deno.env.get("ASC_PRIVATE_KEY_P8")?.trim() || "";
  const envVendor = Deno.env.get("ASC_VENDOR_NUMBER")?.trim() || null;
  const envAppId = Deno.env.get("ASC_APP_APPLE_ID")?.trim() || null;

  if (integration?.secret_ref && integration.issuer_id && integration.key_id) {
    const store = new StoreSecretStore(db);
    try {
      const pem = await store.getPlaintext(integration.secret_ref as string);
      if (pem.trim()) {
        return {
          configured: true,
          source: "database",
          credentials: {
            issuerId: String(integration.issuer_id),
            keyId: String(integration.key_id),
            privateKeyPem: pem,
            vendorNumber: (integration.vendor_number as string | null) ?? envVendor,
            appAppleId: (integration.app_apple_id as string | null) ?? envAppId,
          },
        };
      }
    } catch {
      // fall through to env
    }
  }

  if (envIssuer && envKeyId && envPem) {
    return {
      configured: true,
      source: "env",
      credentials: {
        issuerId: envIssuer,
        keyId: envKeyId,
        privateKeyPem: envPem.replace(/\\n/g, "\n"),
        vendorNumber: envVendor,
        appAppleId: envAppId,
      },
    };
  }

  return { configured: false, credentials: null, source: "none" };
}
