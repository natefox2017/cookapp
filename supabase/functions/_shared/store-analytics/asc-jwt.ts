/**
 * Minimal ES256 JWT for App Store Connect API (no third-party JWT deps).
 * Claims: iss, iat, exp (<= 20m), aud=appstoreconnect-v1; header kid + alg=ES256.
 */

import { AppError } from "../errors.ts";

const encoder = new TextEncoder();

function base64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlFromString(value: string): string {
  return base64Url(encoder.encode(value));
}

function pemToPkcs8Bytes(pem: string): Uint8Array {
  const cleaned = pem
    .replace(/-----BEGIN [^-]+-----/g, "")
    .replace(/-----END [^-]+-----/g, "")
    .replace(/\s+/g, "");
  if (!cleaned) {
    throw new AppError("validation_error", "ASC private key PEM is empty", 400);
  }
  const binary = atob(cleaned);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}

/** Convert IEEE-P1363 (r||s) signature to DER if needed — ASC accepts raw ES256 JWT. */
export async function createAscJwt(input: {
  issuerId: string;
  keyId: string;
  privateKeyPem: string;
  /** Max 1200 seconds per Apple. */
  ttlSeconds?: number;
  nowSeconds?: number;
}): Promise<string> {
  const ttl = Math.min(Math.max(input.ttlSeconds ?? 1190, 60), 1200);
  const now = input.nowSeconds ?? Math.floor(Date.now() / 1000);
  const header = {
    alg: "ES256",
    kid: input.keyId,
    typ: "JWT",
  };
  const payload = {
    iss: input.issuerId,
    iat: now,
    exp: now + ttl,
    aud: "appstoreconnect-v1",
  };

  const headerPart = base64UrlFromString(JSON.stringify(header));
  const payloadPart = base64UrlFromString(JSON.stringify(payload));
  const signingInput = `${headerPart}.${payloadPart}`;

  const key = await crypto.subtle.importKey(
    "pkcs8",
    new Uint8Array(pemToPkcs8Bytes(input.privateKeyPem)),
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"],
  );

  const signature = new Uint8Array(
    await crypto.subtle.sign(
      { name: "ECDSA", hash: "SHA-256" },
      key,
      encoder.encode(signingInput),
    ),
  );

  return `${signingInput}.${base64Url(signature)}`;
}
