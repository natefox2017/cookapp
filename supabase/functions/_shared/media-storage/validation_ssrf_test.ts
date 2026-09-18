/**
 * Unit tests: path / MIME / size validation + SSRF guards.
 * Run: deno test --allow-none supabase/functions/_shared/media-storage/
 */

import {
  assertEquals,
  assertRejects,
  assertThrows,
} from "jsr:@std/assert@1";
import { AppError } from "../errors.ts";
import {
  assertImportArtifactObjectKey,
  assertMimeAllowed,
  assertSafeObjectKey,
  assertSignedUrlExpiry,
  assertSizeAllowed,
  assertUserScopedObjectKey,
  buildImportArtifactObjectKey,
  MAX_SIGNED_URL_SECONDS,
  MEDIA_BUCKETS,
  validateUploadRequest,
} from "./mod.ts";
import { assertSafeFetchUrl, safeFetchUrl } from "./ssrf.ts";

const JOB =
  "11111111-1111-4111-8111-111111111111";
const USER =
  "22222222-2222-4222-8222-222222222222";

Deno.test("assertSafeObjectKey rejects traversal and absolute paths", () => {
  assertThrows(() => assertSafeObjectKey("../x"), AppError);
  assertThrows(() => assertSafeObjectKey("/abs"), AppError);
  assertThrows(() => assertSafeObjectKey("a//b"), AppError);
  assertThrows(() => assertSafeObjectKey("a/./b"), AppError);
  assertThrows(() => assertSafeObjectKey(""), AppError);
  assertSafeObjectKey(`${USER}/avatar.jpg`);
});

Deno.test("import artifact object_key must start with job UUID", () => {
  assertThrows(
    () => assertImportArtifactObjectKey("not-a-uuid/cover.jpg"),
    AppError,
  );
  assertThrows(() => assertImportArtifactObjectKey(`${JOB}`), AppError);
  assertImportArtifactObjectKey(`${JOB}/cover.jpg`);
});

Deno.test("user-scoped keys must match user id", () => {
  assertThrows(
    () => assertUserScopedObjectKey(`${JOB}/avatar.jpg`, USER),
    AppError,
  );
  assertUserScopedObjectKey(`${USER}/avatar.jpg`, USER);
});

Deno.test("MIME allowlist per bucket", () => {
  assertEquals(
    assertMimeAllowed(MEDIA_BUCKETS.avatars, "image/jpeg"),
    "image/jpeg",
  );
  assertThrows(
    () => assertMimeAllowed(MEDIA_BUCKETS.avatars, "video/mp4"),
    AppError,
  );
  assertEquals(
    assertMimeAllowed(
      MEDIA_BUCKETS.recipeImportArtifacts,
      "video/mp4",
    ),
    "video/mp4",
  );
  assertThrows(
    () =>
      assertMimeAllowed(
        MEDIA_BUCKETS.recipeImportArtifacts,
        "application/x-msdownload",
      ),
    AppError,
  );
});

Deno.test("size limits enforced", () => {
  assertSizeAllowed(MEDIA_BUCKETS.avatars, 1024);
  assertThrows(() => assertSizeAllowed(MEDIA_BUCKETS.avatars, 0), AppError);
  assertThrows(
    () => assertSizeAllowed(MEDIA_BUCKETS.avatars, 6 * 1024 * 1024),
    AppError,
  );
  assertSizeAllowed(
    MEDIA_BUCKETS.recipeImportArtifacts,
    40 * 1024 * 1024,
  );
});

Deno.test("extension must match MIME", () => {
  validateUploadRequest({
    bucket: MEDIA_BUCKETS.recipeImportArtifacts,
    objectKey: `${JOB}/cover.jpg`,
    mimeType: "image/jpeg",
    sizeBytes: 100,
    kind: "import_artifact",
  });
  assertThrows(
    () =>
      validateUploadRequest({
        bucket: MEDIA_BUCKETS.recipeImportArtifacts,
        objectKey: `${JOB}/cover.png`,
        mimeType: "image/jpeg",
        sizeBytes: 100,
        kind: "import_artifact",
      }),
    AppError,
  );
});

Deno.test("buildImportArtifactObjectKey shapes path", () => {
  const key = buildImportArtifactObjectKey({
    jobId: JOB,
    kind: "cover_candidate",
    mimeType: "image/webp",
  });
  assertEquals(key, `${JOB}/cover.webp`);
});

Deno.test("signed URL expiry cannot be permanent", () => {
  assertEquals(assertSignedUrlExpiry(60), 60);
  assertThrows(() => assertSignedUrlExpiry(0), AppError);
  assertThrows(() => assertSignedUrlExpiry(-1), AppError);
  assertThrows(
    () => assertSignedUrlExpiry(MAX_SIGNED_URL_SECONDS + 1),
    AppError,
  );
});

Deno.test("SSRF: blocks localhost, private IPs, metadata, non-http", () => {
  assertThrows(() => assertSafeFetchUrl("file:///etc/passwd"), AppError);
  assertThrows(() => assertSafeFetchUrl("http://localhost/x"), AppError);
  assertThrows(() => assertSafeFetchUrl("http://127.0.0.1/x"), AppError);
  assertThrows(() => assertSafeFetchUrl("http://10.0.0.5/x"), AppError);
  assertThrows(() => assertSafeFetchUrl("http://192.168.1.1/x"), AppError);
  assertThrows(() => assertSafeFetchUrl("http://169.254.169.254/latest"), AppError);
  assertThrows(
    () => assertSafeFetchUrl("http://user:pass@example.com/x"),
    AppError,
  );
  const ok = assertSafeFetchUrl("https://cdn.example.com/img.jpg");
  assertEquals(ok.hostname, "cdn.example.com");
});

Deno.test("SSRF: redirect target re-validated", async () => {
  const calls: string[] = [];
  const fetchImpl: typeof fetch = (input) => {
    const url = String(input);
    calls.push(url);
    if (url.includes("good.example")) {
      return Promise.resolve(
        new Response(null, {
          status: 302,
          headers: { Location: "http://127.0.0.1/secret" },
        }),
      );
    }
    return Promise.resolve(new Response("nope", { status: 200 }));
  };

  await assertRejects(
    () =>
      safeFetchUrl("https://good.example/a.jpg", {
        maxBytes: 1024,
        allowedMimeTypes: ["image/jpeg"],
      }, fetchImpl),
    AppError,
  );
  assertEquals(calls.length, 1);
});

Deno.test("SSRF: successful fetch respects size and MIME", async () => {
  const bytes = new Uint8Array([1, 2, 3, 4]);
  const fetchImpl: typeof fetch = () =>
    Promise.resolve(
      new Response(bytes, {
        status: 200,
        headers: { "content-type": "image/jpeg" },
      }),
    );

  const result = await safeFetchUrl(
    "https://cdn.example.com/a.jpg",
    {
      maxBytes: 1024,
      allowedMimeTypes: ["image/jpeg"],
    },
    fetchImpl,
  );
  assertEquals(result.sizeBytes, 4);
  assertEquals(result.mimeType, "image/jpeg");

  await assertRejects(
    () =>
      safeFetchUrl("https://cdn.example.com/a.jpg", {
        maxBytes: 2,
        allowedMimeTypes: ["image/jpeg"],
      }, fetchImpl),
    AppError,
  );
});
