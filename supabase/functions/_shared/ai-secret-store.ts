/** AES-GCM secret store for AI provider keys (server-side only). */

import type { SupabaseClient } from "jsr:@supabase/supabase-js@2";
import { AppError } from "./errors.ts";
import { requireEnv } from "./auth.ts";

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

function base64ToBytes(value: string): Uint8Array {
  const binary = atob(value);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}

/** Resolve 32-byte master key from COOKAPP_AI_MASTER_KEY (base64 or raw). */
export function resolveMasterKeyBytes(raw?: string): Uint8Array {
  const value = raw ?? Deno.env.get("COOKAPP_AI_MASTER_KEY");
  if (!value) {
    throw new AppError(
      "server_misconfigured",
      "Missing COOKAPP_AI_MASTER_KEY for AI secret store",
      500,
    );
  }
  try {
    const decoded = base64ToBytes(value);
    if (decoded.length === 32) return decoded;
  } catch {
    // fall through to raw UTF-8 length check
  }
  const utf8 = encoder.encode(value);
  if (utf8.length === 32) return utf8;
  throw new AppError(
    "server_misconfigured",
    "COOKAPP_AI_MASTER_KEY must be 32 bytes (raw or base64)",
    500,
  );
}

async function importKey(rawKey: Uint8Array): Promise<CryptoKey> {
  const keyBytes = new Uint8Array(rawKey);
  return crypto.subtle.importKey("raw", keyBytes, "AES-GCM", false, [
    "encrypt",
    "decrypt",
  ]);
}

export async function encryptSecret(
  plaintext: string,
  masterKeyBytes?: Uint8Array,
): Promise<{ ciphertext: string; nonce: string; keyVersion: number }> {
  if (!plaintext || !plaintext.trim()) {
    throw new AppError("validation_error", "Secret value is required", 400);
  }
  const key = await importKey(masterKeyBytes ?? resolveMasterKeyBytes());
  const nonce = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: nonce },
    key,
    encoder.encode(plaintext),
  );
  return {
    ciphertext: bytesToBase64(new Uint8Array(encrypted)),
    nonce: bytesToBase64(nonce),
    keyVersion: 1,
  };
}

export async function decryptSecret(
  ciphertext: string,
  nonce: string,
  masterKeyBytes?: Uint8Array,
): Promise<string> {
  const key = await importKey(masterKeyBytes ?? resolveMasterKeyBytes());
  const plain = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: new Uint8Array(base64ToBytes(nonce)) },
    key,
    new Uint8Array(base64ToBytes(ciphertext)),
  );
  return decoder.decode(plain);
}

export function newSecretRef(providerId?: string): string {
  const id = providerId ?? crypto.randomUUID();
  return `ai_provider_${id}`;
}

export class AISecretStore {
  constructor(
    private readonly db: SupabaseClient,
    private readonly masterKeyBytes?: Uint8Array,
  ) {}

  /** Write/replace secret. Never returns plaintext. */
  async put(secretRef: string, plaintext: string): Promise<{ secretRef: string }> {
    const sealed = await encryptSecret(plaintext, this.masterKeyBytes);
    const now = new Date().toISOString();
    const { error } = await this.db.from("ai_secrets").upsert(
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
      throw new AppError("internal_error", "Failed to store AI secret", 500, {
        message: error.message,
      });
    }
    return { secretRef };
  }

  /** Server-only resolve. Callers must not log or return the value. */
  async getPlaintext(secretRef: string): Promise<string> {
    const { data, error } = await this.db
      .from("ai_secrets")
      .select("ciphertext, nonce")
      .eq("secret_ref", secretRef)
      .maybeSingle();
    if (error) {
      throw new AppError("internal_error", "Failed to load AI secret", 500, {
        message: error.message,
      });
    }
    if (!data) {
      throw new AppError("not_found", "AI secret not configured", 404);
    }
    return decryptSecret(
      data.ciphertext as string,
      data.nonce as string,
      this.masterKeyBytes,
    );
  }

  async delete(secretRef: string): Promise<void> {
    const { error } = await this.db
      .from("ai_secrets")
      .delete()
      .eq("secret_ref", secretRef);
    if (error) {
      throw new AppError("internal_error", "Failed to delete AI secret", 500, {
        message: error.message,
      });
    }
  }

  async isConfigured(secretRef: string | null | undefined): Promise<boolean> {
    if (!secretRef) return false;
    const { data, error } = await this.db
      .from("ai_secrets")
      .select("secret_ref")
      .eq("secret_ref", secretRef)
      .maybeSingle();
    if (error) return false;
    return Boolean(data);
  }
}

/** Require master key presence for write paths (clearer than encrypt failure). */
export function assertSecretStoreConfigured(): void {
  requireEnv("COOKAPP_AI_MASTER_KEY");
}
