// Admin catalog APIs: ops nav (recipes / ingredients / taxonomy / settings).
// Personal-list routes (collections / grocery / meal-plans / pantry) are API-only — not Admin pages (#98).
// Auth: custom admin bearer via requireAdminSession.
// Deploy: supabase functions deploy admin-catalog --project-ref semsjyrqjnumpvanibip
// Issue: #92 (parent #49)

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { publicCorsHeaders, handleCors } from "../_shared/cors.ts";
import { AppError, errorResponse, json } from "../_shared/errors.ts";
import { createServiceClient } from "../_shared/auth.ts";
import { requireAdminSession } from "../_shared/admin-session.ts";
import { writeAdminAudit } from "../_shared/audit.ts";
import { resolveRequestContext } from "../_shared/request-context.ts";
import {
  foldMealPlans,
  mapCollection,
  mapGroceryItem,
  mapIngredientRow,
  mapPantryItem,
  mapRecipeDetail,
  mapRecipeSummary,
  matchesTaxonomyFilter,
  mergePersistedSettings,
  persistableSettings,
  recipePayloadToColumns,
  slugify,
  type NameLookup,
} from "../_shared/admin-catalog/mod.ts";

const SETTINGS_KEY = "admin_settings";

function routeParts(req: Request): string[] {
  const url = new URL(req.url);
  const parts = url.pathname.split("/").filter(Boolean);
  const idx = parts.findIndex((p) => p === "admin-catalog");
  return idx >= 0 ? parts.slice(idx + 1) : [];
}

async function readJson(req: Request): Promise<Record<string, unknown>> {
  try {
    const body = await req.json();
    if (!body || typeof body !== "object") return {};
    return body as Record<string, unknown>;
  } catch {
    throw new AppError("validation_error", "Invalid JSON body", 400);
  }
}

type Db = ReturnType<typeof createServiceClient>;

async function loadLookup(db: Db, table: string): Promise<NameLookup> {
  const { data, error } = await db.from(table).select("id, name");
  if (error) throw new AppError("internal_error", error.message, 500);
  const map: NameLookup = new Map();
  for (const row of data ?? []) {
    map.set(String(row.id), String(row.name ?? row.id));
  }
  return map;
}

async function loadProfileMap(db: Db, userIds: string[]) {
  const unique = [...new Set(userIds.filter(Boolean))];
  const map = new Map<
    string,
    { email: string; displayName: string; avatarUrl: string | null }
  >();
  if (!unique.length) return map;
  const { data, error } = await db
    .from("profiles")
    .select("id, email, display_name, avatar")
    .in("id", unique);
  if (error) throw new AppError("internal_error", error.message, 500);
  for (const row of data ?? []) {
    const email = String(row.email ?? "");
    const displayName = String(row.display_name ?? email ?? "Unknown");
    map.set(String(row.id), {
      email,
      displayName: displayName || email || "Unknown",
      avatarUrl: (row.avatar as string | null) ?? null,
    });
  }
  return map;
}

function taxonomyTable(kind: string): "cuisines" | "meal_categories" | "tags" {
  if (kind === "cuisine" || kind === "cuisines") return "cuisines";
  if (kind === "category" || kind === "categories") return "meal_categories";
  if (kind === "tags" || kind === "tag") return "tags";
  throw new AppError("validation_error", "kind must be cuisine, category, or tags", 400);
}

function usageColumn(table: "cuisines" | "meal_categories" | "tags"): string {
  if (table === "cuisines") return "cuisine";
  if (table === "meal_categories") return "category";
  return "tags";
}

Deno.serve(async (req) => {
  const cors = handleCors(req, "public");
  if (cors) return cors;
  const ctx = resolveRequestContext(req);

  try {
    const session = await requireAdminSession(req);
    const actor = { adminId: session.adminId, username: session.username };
    const db = createServiceClient();
    const parts = routeParts(req);
    const method = req.method.toUpperCase();
    const resource = (parts[0] ?? "").toLowerCase();

    if (resource === "recipes") {
      return await handleRecipes(req, method, parts.slice(1), db, actor, ctx);
    }
    if (resource === "collections") {
      if (method !== "GET") throw new AppError("method_not_allowed", "GET only", 405);
      return await handleCollections(db, ctx);
    }
    if (resource === "ingredients") {
      return await handleIngredients(req, method, parts.slice(1), db, actor, ctx);
    }
    if (resource === "grocery") {
      if (method !== "GET") throw new AppError("method_not_allowed", "GET only", 405);
      return await handleGrocery(parts.slice(1), db, ctx);
    }
    if (resource === "meal-plans") {
      if (method !== "GET") throw new AppError("method_not_allowed", "GET only", 405);
      return await handleMealPlans(db, ctx);
    }
    if (resource === "pantry") {
      if (method !== "GET") throw new AppError("method_not_allowed", "GET only", 405);
      return await handlePantry(db, ctx);
    }
    if (resource === "taxonomy") {
      return await handleTaxonomy(req, method, parts.slice(1), db, actor, ctx);
    }
    if (resource === "settings") {
      return await handleSettings(req, method, db, actor, ctx);
    }

    throw new AppError("not_found", "Unknown admin-catalog resource", 404);
  } catch (err) {
    return errorResponse(err, publicCorsHeaders, ctx);
  }
});

async function handleRecipes(
  req: Request,
  method: string,
  parts: string[],
  db: Db,
  actor: { adminId: string; username: string },
  ctx: ReturnType<typeof resolveRequestContext>,
) {
  const cuisineLookup = await loadLookup(db, "cuisines");
  const categoryLookup = await loadLookup(db, "meal_categories");
  const tagLookup = await loadLookup(db, "tags");
  const id = parts[0];

  if (!id) {
    if (method !== "GET") throw new AppError("method_not_allowed", "GET only", 405);
    const url = new URL(req.url);
    const q = url.searchParams.get("q")?.trim().toLowerCase() ?? "";
    const cuisine = url.searchParams.get("cuisine") ?? undefined;
    const category = url.searchParams.get("category") ?? undefined;
    const tag = url.searchParams.get("tag") ?? undefined;

    const { data, error } = await db
      .from("recipes")
      .select(
        "id, user_id, title, cover_image, cuisine, category, tags, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw new AppError("internal_error", error.message, 500);

    const rows = data ?? [];
    const profiles = await loadProfileMap(
      db,
      rows.map((r) => String(r.user_id)),
    );
    const mapped = rows
      .filter((row) => {
        if (q && !String(row.title ?? "").toLowerCase().includes(q)) return false;
        if (!matchesTaxonomyFilter(row.cuisine as string | null, cuisine, cuisineLookup)) {
          return false;
        }
        if (
          !matchesTaxonomyFilter(row.category as string | null, category, categoryLookup)
        ) {
          return false;
        }
        if (tag) {
          const tags = Array.isArray(row.tags) ? row.tags.map((t) => String(t)) : [];
          const needle = tag.trim().toLowerCase();
          const hit = tags.some((t) =>
            t.toLowerCase() === needle ||
            (tagLookup.get(t) ?? "").toLowerCase() === needle
          );
          if (!hit) return false;
        }
        return true;
      })
      .map((row) =>
        mapRecipeSummary(row, {
          cuisineLookup,
          categoryLookup,
          tagLookup,
          ownerEmail: profiles.get(String(row.user_id))?.email ?? "",
        })
      );
    return json(mapped, 200, publicCorsHeaders, ctx);
  }

  const { data: row, error } = await db.from("recipes").select("*").eq("id", id)
    .maybeSingle();
  if (error) throw new AppError("internal_error", error.message, 500);
  if (!row) throw new AppError("not_found", "Recipe not found", 404);

  if (method === "GET") {
    const profiles = await loadProfileMap(db, [String(row.user_id)]);
    return json(
      mapRecipeDetail(row, {
        cuisineLookup,
        categoryLookup,
        tagLookup,
        ownerEmail: profiles.get(String(row.user_id))?.email ?? "",
      }),
      200,
      publicCorsHeaders,
      ctx,
    );
  }

  if (method === "PATCH") {
    const body = await readJson(req);
    const cols = recipePayloadToColumns(body);
    if (!Object.keys(cols).length) {
      throw new AppError("validation_error", "No updatable fields", 400);
    }
    const { data: updated, error: upErr } = await db
      .from("recipes")
      .update(cols)
      .eq("id", id)
      .select("*")
      .maybeSingle();
    if (upErr) throw new AppError("internal_error", upErr.message, 500);
    if (!updated) throw new AppError("not_found", "Recipe not found", 404);
    await writeAdminAudit({
      actor,
      action: "recipe.update",
      objectType: "recipe",
      objectId: id,
      before: { title: row.title },
      after: { title: updated.title },
      ctx,
      req,
    });
    const profiles = await loadProfileMap(db, [String(updated.user_id)]);
    return json(
      mapRecipeDetail(updated, {
        cuisineLookup,
        categoryLookup,
        tagLookup,
        ownerEmail: profiles.get(String(updated.user_id))?.email ?? "",
      }),
      200,
      publicCorsHeaders,
      ctx,
    );
  }

  if (method === "DELETE") {
    const { error: delErr } = await db.from("recipes").delete().eq("id", id);
    if (delErr) throw new AppError("internal_error", delErr.message, 500);
    await writeAdminAudit({
      actor,
      action: "recipe.delete",
      objectType: "recipe",
      objectId: id,
      before: { title: row.title, user_id: row.user_id },
      ctx,
      req,
    });
    return json({ ok: true }, 200, publicCorsHeaders, ctx);
  }

  throw new AppError("method_not_allowed", "GET, PATCH, or DELETE", 405);
}

async function handleCollections(db: Db, ctx: ReturnType<typeof resolveRequestContext>) {
  const { data, error } = await db
    .from("collections")
    .select("id, user_id, name, cover, created_at")
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) throw new AppError("internal_error", error.message, 500);
  const rows = data ?? [];
  const ids = rows.map((r) => String(r.id));
  const countMap = new Map<string, number>();
  if (ids.length) {
    const { data: memberships, error: mErr } = await db
      .from("collection_recipes")
      .select("collection_id")
      .in("collection_id", ids);
    if (mErr) throw new AppError("internal_error", mErr.message, 500);
    for (const m of memberships ?? []) {
      const cid = String(m.collection_id);
      countMap.set(cid, (countMap.get(cid) ?? 0) + 1);
    }
  }
  const profiles = await loadProfileMap(
    db,
    rows.map((r) => String(r.user_id)),
  );
  const mapped = rows.map((row) => {
    const profile = profiles.get(String(row.user_id));
    return mapCollection(row, {
      recipeCount: countMap.get(String(row.id)) ?? 0,
      owner: {
        id: String(row.user_id),
        displayName: profile?.displayName ?? "Unknown",
        avatarUrl: profile?.avatarUrl ?? null,
      },
    });
  });
  return json(mapped, 200, publicCorsHeaders, ctx);
}

async function handleIngredients(
  req: Request,
  method: string,
  parts: string[],
  db: Db,
  actor: { adminId: string; username: string },
  ctx: ReturnType<typeof resolveRequestContext>,
) {
  const id = parts[0];
  if (!id && method === "GET") {
    const { data, error } = await db
      .from("ingredients")
      .select("id, name, category, unit, alternative_name")
      .order("name", { ascending: true })
      .limit(1000);
    if (error) throw new AppError("internal_error", error.message, 500);
    return json((data ?? []).map(mapIngredientRow), 200, publicCorsHeaders, ctx);
  }

  if (!id && method === "POST") {
    const body = await readJson(req);
    const name = String(body.name ?? "").trim();
    const category = String(body.category ?? "").trim();
    const unit = String(body.unit ?? "").trim();
    const alternativeName =
      body.alternativeName == null || body.alternativeName === ""
        ? null
        : String(body.alternativeName).trim();
    if (!name || !category || !unit) {
      throw new AppError("validation_error", "name, category, and unit are required", 400);
    }
    const { data, error } = await db
      .from("ingredients")
      .insert({
        name,
        category,
        unit,
        alternative_name: alternativeName,
        is_system: true,
        user_id: null,
      })
      .select("id, name, category, unit, alternative_name")
      .single();
    if (error) throw new AppError("internal_error", error.message, 500);
    await writeAdminAudit({
      actor,
      action: "ingredient.create",
      objectType: "ingredient",
      objectId: String(data.id),
      after: { name, category, unit },
      ctx,
      req,
    });
    return json(mapIngredientRow(data), 201, publicCorsHeaders, ctx);
  }

  if (!id) throw new AppError("method_not_allowed", "GET or POST", 405);

  if (method === "PATCH") {
    const body = await readJson(req);
    const name = String(body.name ?? "").trim();
    const category = String(body.category ?? "").trim();
    const unit = String(body.unit ?? "").trim();
    const alternativeName =
      body.alternativeName == null || body.alternativeName === ""
        ? null
        : String(body.alternativeName).trim();
    if (!name || !category || !unit) {
      throw new AppError("validation_error", "name, category, and unit are required", 400);
    }
    const { data, error } = await db
      .from("ingredients")
      .update({ name, category, unit, alternative_name: alternativeName })
      .eq("id", id)
      .select("id, name, category, unit, alternative_name")
      .maybeSingle();
    if (error) throw new AppError("internal_error", error.message, 500);
    if (!data) throw new AppError("not_found", "Ingredient not found", 404);
    await writeAdminAudit({
      actor,
      action: "ingredient.update",
      objectType: "ingredient",
      objectId: id,
      after: { name, category, unit },
      ctx,
      req,
    });
    return json(mapIngredientRow(data), 200, publicCorsHeaders, ctx);
  }

  if (method === "DELETE") {
    const { error } = await db.from("ingredients").delete().eq("id", id);
    if (error) throw new AppError("internal_error", error.message, 500);
    await writeAdminAudit({
      actor,
      action: "ingredient.delete",
      objectType: "ingredient",
      objectId: id,
      ctx,
      req,
    });
    return json({ ok: true }, 200, publicCorsHeaders, ctx);
  }

  throw new AppError("method_not_allowed", "GET, POST, PATCH, or DELETE", 405);
}

async function handleGrocery(
  parts: string[],
  db: Db,
  ctx: ReturnType<typeof resolveRequestContext>,
) {
  if (parts[0] === "users" && parts[1] && parts[2] === "items") {
    const userId = parts[1];
    const { data: lists, error: lErr } = await db
      .from("grocery_lists")
      .select("id")
      .eq("user_id", userId);
    if (lErr) throw new AppError("internal_error", lErr.message, 500);
    const listIds = (lists ?? []).map((l) => String(l.id));
    if (!listIds.length) return json([], 200, publicCorsHeaders, ctx);
    const { data: items, error: iErr } = await db
      .from("grocery_items")
      .select("id, ingredient, quantity, category, completed, sort_order")
      .in("list_id", listIds)
      .order("sort_order", { ascending: true });
    if (iErr) throw new AppError("internal_error", iErr.message, 500);
    return json(
      (items ?? []).map((row) => mapGroceryItem(row, userId)),
      200,
      publicCorsHeaders,
      ctx,
    );
  }

  if (parts.length === 0 || (parts[0] === "users" && !parts[1])) {
    const { data: lists, error } = await db.from("grocery_lists").select("id, user_id");
    if (error) throw new AppError("internal_error", error.message, 500);
    const listToUser = new Map<string, string>();
    const userIds: string[] = [];
    for (const list of lists ?? []) {
      listToUser.set(String(list.id), String(list.user_id));
      userIds.push(String(list.user_id));
    }
    const listIds = [...listToUser.keys()];
    const itemCount = new Map<string, { itemCount: number; completedCount: number }>();
    if (listIds.length) {
      const { data: items, error: iErr } = await db
        .from("grocery_items")
        .select("list_id, completed")
        .in("list_id", listIds);
      if (iErr) throw new AppError("internal_error", iErr.message, 500);
      for (const item of items ?? []) {
        const uid = listToUser.get(String(item.list_id));
        if (!uid) continue;
        const cur = itemCount.get(uid) ?? { itemCount: 0, completedCount: 0 };
        cur.itemCount += 1;
        if (item.completed) cur.completedCount += 1;
        itemCount.set(uid, cur);
      }
    }
    const profiles = await loadProfileMap(db, userIds);
    const users = [...new Set(userIds)].map((id) => {
      const profile = profiles.get(id);
      const counts = itemCount.get(id) ?? { itemCount: 0, completedCount: 0 };
      return {
        id,
        displayName: profile?.displayName ?? "Unknown",
        email: profile?.email ?? "",
        itemCount: counts.itemCount,
        completedCount: counts.completedCount,
      };
    });
    return json(users, 200, publicCorsHeaders, ctx);
  }

  throw new AppError("not_found", "Unknown grocery route", 404);
}

async function handleMealPlans(db: Db, ctx: ReturnType<typeof resolveRequestContext>) {
  const { data, error } = await db
    .from("meal_plans")
    .select("plan_date, meal_type, recipe_id, recipes(title)")
    .order("plan_date", { ascending: true })
    .limit(2000);
  if (error) throw new AppError("internal_error", error.message, 500);
  const rows = (data ?? []).map((row) => {
    const recipe = row.recipes as { title?: string } | { title?: string }[] | null;
    const title = Array.isArray(recipe)
      ? String(recipe[0]?.title ?? "")
      : String(recipe?.title ?? "");
    return {
      plan_date: String(row.plan_date),
      meal_type: String(row.meal_type),
      title,
    };
  });
  return json(foldMealPlans(rows), 200, publicCorsHeaders, ctx);
}

async function handlePantry(db: Db, ctx: ReturnType<typeof resolveRequestContext>) {
  const { data, error } = await db
    .from("pantry_items")
    .select("id, ingredient, quantity, unit, expiration_date")
    .order("expiration_date", { ascending: true })
    .limit(1000);
  if (error) throw new AppError("internal_error", error.message, 500);
  const now = Date.now();
  return json(
    (data ?? []).map((row) => mapPantryItem(row, now)),
    200,
    publicCorsHeaders,
    ctx,
  );
}

async function handleTaxonomy(
  req: Request,
  method: string,
  parts: string[],
  db: Db,
  actor: { adminId: string; username: string },
  ctx: ReturnType<typeof resolveRequestContext>,
) {
  const kind = parts[0];
  if (!kind) throw new AppError("validation_error", "taxonomy kind required", 400);
  const table = taxonomyTable(kind);
  const itemId = parts[1];

  if (!itemId && method === "GET") {
    const { data, error } = await db.from(table).select("id, name, sort_order").order(
      "sort_order",
    );
    if (error) throw new AppError("internal_error", error.message, 500);
    const col = usageColumn(table);
    const usage = new Map<string, number>();
    const { data: recipes, error: rErr } = await db
      .from("recipes")
      .select("cuisine, category, tags");
    if (rErr) throw new AppError("internal_error", rErr.message, 500);
    for (const recipe of recipes ?? []) {
      if (col === "tags") {
        const tags = Array.isArray(recipe.tags) ? recipe.tags : [];
        for (const tag of tags) {
          const key = String(tag);
          usage.set(key, (usage.get(key) ?? 0) + 1);
        }
      } else {
        const key = col === "cuisine" ? recipe.cuisine : recipe.category;
        if (key) usage.set(String(key), (usage.get(String(key)) ?? 0) + 1);
      }
    }
    const items = (data ?? []).map((row) => ({
      id: String(row.id),
      name: String(row.name),
      slug: String(row.id),
      usageCount: usage.get(String(row.id)) ?? 0,
    }));
    return json(items, 200, publicCorsHeaders, ctx);
  }

  if (!itemId && method === "POST") {
    const body = await readJson(req);
    const name = String(body.name ?? "").trim();
    if (!name) throw new AppError("validation_error", "name is required", 400);
    const id = slugify(name);
    if (!id) throw new AppError("validation_error", "name produced empty slug", 400);
    const { data: existing } = await db.from(table).select("sort_order").order(
      "sort_order",
      { ascending: false },
    ).limit(1);
    const sortOrder = Number(existing?.[0]?.sort_order ?? 0) + 1;
    const { data, error } = await db
      .from(table)
      .insert({ id, name, sort_order: sortOrder })
      .select("id, name")
      .single();
    if (error) throw new AppError("conflict", error.message, 409);
    await writeAdminAudit({
      actor,
      action: "taxonomy.create",
      objectType: table,
      objectId: id,
      after: { name },
      ctx,
      req,
    });
    return json(
      { id: data.id, name: data.name, slug: data.id, usageCount: 0 },
      201,
      publicCorsHeaders,
      ctx,
    );
  }

  if (itemId && method === "PATCH") {
    const body = await readJson(req);
    const name = String(body.name ?? "").trim();
    if (!name) throw new AppError("validation_error", "name is required", 400);
    const { data, error } = await db
      .from(table)
      .update({ name })
      .eq("id", itemId)
      .select("id, name")
      .maybeSingle();
    if (error) throw new AppError("internal_error", error.message, 500);
    if (!data) throw new AppError("not_found", "Taxonomy item not found", 404);
    await writeAdminAudit({
      actor,
      action: "taxonomy.update",
      objectType: table,
      objectId: itemId,
      after: { name },
      ctx,
      req,
    });
    return json(
      { id: data.id, name: data.name, slug: data.id, usageCount: 0 },
      200,
      publicCorsHeaders,
      ctx,
    );
  }

  if (itemId && method === "DELETE") {
    const { error } = await db.from(table).delete().eq("id", itemId);
    if (error) throw new AppError("internal_error", error.message, 500);
    await writeAdminAudit({
      actor,
      action: "taxonomy.delete",
      objectType: table,
      objectId: itemId,
      ctx,
      req,
    });
    return json({ ok: true }, 200, publicCorsHeaders, ctx);
  }

  throw new AppError("method_not_allowed", "Unsupported taxonomy method", 405);
}

async function handleSettings(
  req: Request,
  method: string,
  db: Db,
  actor: { adminId: string; username: string },
  ctx: ReturnType<typeof resolveRequestContext>,
) {
  const system = {
    mockMode: false,
    apiBaseUrl: Deno.env.get("SUPABASE_URL") ?? "",
    logLevel: "info" as const,
  };

  if (method === "GET") {
    const { data, error } = await db
      .from("runtime_config")
      .select("value")
      .eq("key", SETTINGS_KEY)
      .maybeSingle();
    if (error) throw new AppError("internal_error", error.message, 500);
    return json(mergePersistedSettings(data?.value, system), 200, publicCorsHeaders, ctx);
  }

  if (method === "PATCH" || method === "PUT") {
    const body = await readJson(req);
    const value = persistableSettings(body);
    const { error } = await db.from("runtime_config").upsert({
      key: SETTINGS_KEY,
      value,
      description: "Admin Settings general/units/categories (Issue #92). No secrets.",
    });
    if (error) throw new AppError("internal_error", error.message, 500);
    await writeAdminAudit({
      actor,
      action: "settings.update",
      objectType: "runtime_config",
      objectId: SETTINGS_KEY,
      after: value,
      ctx,
      req,
    });
    return json(mergePersistedSettings(value, system), 200, publicCorsHeaders, ctx);
  }

  throw new AppError("method_not_allowed", "GET or PATCH", 405);
}
