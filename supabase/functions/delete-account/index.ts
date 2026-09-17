// Account deletion: verifies JWT, purges user storage, deletes auth user via service role.
// Never expose SUPABASE_SERVICE_ROLE_KEY to clients.
// Deploy: supabase functions deploy delete-account --project-ref semsjyrqjnumpvanibip
// Closes: GitHub Issue #11

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { handleCors } from "../_shared/cors.ts";
import { AppError, errorResponse, json } from "../_shared/errors.ts";
import { requireUser, createServiceClient } from "../_shared/auth.ts";
import { log } from "../_shared/logger.ts";

const BUCKETS = ["avatars", "recipe-covers", "recipe-images"] as const;

async function purgeUserStorage(
  admin: ReturnType<typeof createServiceClient>,
  userId: string,
): Promise<void> {
  for (const bucket of BUCKETS) {
    const { data: entries, error: listError } = await admin.storage
      .from(bucket)
      .list(userId, { limit: 1000 });
    if (listError) {
      log("warn", "storage_list_failed", { bucket, message: listError.message });
      continue;
    }
    if (!entries?.length) continue;
    const paths = entries.map((e) => `${userId}/${e.name}`);
    const { error: removeError } = await admin.storage.from(bucket).remove(paths);
    if (removeError) {
      log("warn", "storage_remove_failed", {
        bucket,
        message: removeError.message,
        count: paths.length,
      });
    }
  }
}

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  try {
    if (req.method !== "POST") {
      throw new AppError("method_not_allowed", "POST required", 405);
    }

    const { user } = await requireUser(req);
    const admin = createServiceClient();

    log("info", "account_delete_start", { user_id: user.id });

    await purgeUserStorage(admin, user.id);

    // Cascades: profiles, recipes, collections, grocery, meal_plans, pantry, subscriptions
    const { error } = await admin.auth.admin.deleteUser(user.id);
    if (error) {
      log("error", "account_delete_failed", { message: error.message });
      throw new AppError("internal_error", error.message, 500);
    }

    log("info", "account_delete_ok", { user_id: user.id });
    return json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
});
