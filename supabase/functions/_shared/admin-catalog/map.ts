/** Pure DTO mapping for Admin catalog APIs (Issue #92). */

export type NameLookup = Map<string, string>;

export function slugify(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

export function displayName(
  id: string | null | undefined,
  lookup: NameLookup,
): string {
  if (!id) return "";
  return lookup.get(id) ?? id;
}

export function matchesTaxonomyFilter(
  storedId: string | null | undefined,
  filter: string | undefined,
  lookup: NameLookup,
): boolean {
  if (!filter) return true;
  const needle = filter.trim().toLowerCase();
  if (!needle) return true;
  const id = (storedId ?? "").toLowerCase();
  if (id === needle) return true;
  const name = displayName(storedId, lookup).toLowerCase();
  return name === needle;
}

export function mapIngredientRow(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    name: String(row.name ?? ""),
    category: String(row.category ?? ""),
    unit: String(row.unit ?? ""),
    alternativeName: (row.alternative_name as string | null) ?? null,
  };
}

export function mapRecipeIngredients(raw: unknown): Array<{
  name: string;
  quantity: string;
  unit: string;
}> {
  if (!Array.isArray(raw)) return [];
  return raw.map((item) => {
    const row = (item ?? {}) as Record<string, unknown>;
    const amount = row.amount ?? row.quantity ?? "";
    return {
      name: String(row.name ?? ""),
      quantity: amount === null || amount === undefined ? "" : String(amount),
      unit: String(row.unit ?? ""),
    };
  });
}

export function mapRecipeSteps(raw: unknown): Array<{
  order: number;
  instruction: string;
}> {
  if (!Array.isArray(raw)) return [];
  return raw.map((item, index) => {
    const row = (item ?? {}) as Record<string, unknown>;
    const order = Number(row.order ?? index + 1);
    return {
      order: Number.isFinite(order) ? order : index + 1,
      instruction: String(row.description ?? row.instruction ?? ""),
    };
  });
}

export function mapRecipeNutrition(raw: unknown): {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
} {
  const row = (raw ?? {}) as Record<string, unknown>;
  const num = (v: unknown) => {
    const n = Number(v ?? 0);
    return Number.isFinite(n) ? n : 0;
  };
  return {
    calories: num(row.calories),
    proteinG: num(row.protein ?? row.proteinG),
    carbsG: num(row.carbohydrates ?? row.carbsG ?? row.carbs),
    fatG: num(row.fat ?? row.fatG),
  };
}

export function recipePayloadToColumns(payload: Record<string, unknown>) {
  const cols: Record<string, unknown> = {};
  if (typeof payload.title === "string") cols.title = payload.title.trim();
  if (typeof payload.notes === "string") cols.description = payload.notes;
  if (typeof payload.coverUrl === "string") cols.cover_image = payload.coverUrl || null;
  if (typeof payload.servings === "number") cols.servings = payload.servings;
  if (Array.isArray(payload.tags)) cols.tags = payload.tags.map((t) => String(t));
  if (Array.isArray(payload.ingredients)) {
    cols.ingredients = payload.ingredients.map((item) => {
      const row = (item ?? {}) as Record<string, unknown>;
      return {
        name: String(row.name ?? ""),
        amount: row.quantity ?? row.amount ?? null,
        unit: String(row.unit ?? ""),
        note: row.note ?? null,
      };
    });
  }
  if (Array.isArray(payload.steps)) {
    cols.steps = payload.steps.map((item) => {
      const row = (item ?? {}) as Record<string, unknown>;
      return {
        order: Number(row.order ?? 0),
        description: String(row.instruction ?? row.description ?? ""),
        image: row.image ?? null,
        timer: row.timer ?? null,
      };
    });
  }
  if (payload.nutrition && typeof payload.nutrition === "object") {
    const n = payload.nutrition as Record<string, unknown>;
    cols.nutrition = {
      calories: Number(n.calories ?? 0),
      protein: Number(n.proteinG ?? n.protein ?? 0),
      fat: Number(n.fatG ?? n.fat ?? 0),
      carbohydrates: Number(n.carbsG ?? n.carbohydrates ?? 0),
    };
  }
  return cols;
}

export function mapRecipeSummary(
  row: Record<string, unknown>,
  opts: {
    cuisineLookup: NameLookup;
    categoryLookup: NameLookup;
    tagLookup: NameLookup;
    ownerEmail: string;
  },
) {
  const tags = Array.isArray(row.tags) ? row.tags.map((t) => String(t)) : [];
  return {
    id: String(row.id),
    title: String(row.title ?? ""),
    coverUrl: String(row.cover_image ?? ""),
    cuisine: displayName(row.cuisine as string | null, opts.cuisineLookup),
    category: displayName(row.category as string | null, opts.categoryLookup),
    tags: tags.map((id) => displayName(id, opts.tagLookup) || id),
    createdAt: String(row.created_at ?? ""),
    updatedAt: String(row.updated_at ?? row.created_at ?? ""),
    ownerEmail: opts.ownerEmail,
    libraryKind: String(row.library_kind ?? "system_recommended"),
    publishStatus: String(row.publish_status ?? "draft"),
    sourceUrl: row.source_url != null ? String(row.source_url) : null,
    sourcePlatform: row.source_platform != null ? String(row.source_platform) : null,
    publishedAt: row.published_at != null ? String(row.published_at) : null,
  };
}

export function mapRecipeDetail(
  row: Record<string, unknown>,
  opts: {
    cuisineLookup: NameLookup;
    categoryLookup: NameLookup;
    tagLookup: NameLookup;
    ownerEmail: string;
  },
) {
  return {
    ...mapRecipeSummary(row, opts),
    ingredients: mapRecipeIngredients(row.ingredients),
    steps: mapRecipeSteps(row.steps),
    nutrition: mapRecipeNutrition(row.nutrition),
    notes: String(row.description ?? ""),
    servings: Number(row.servings ?? 0) || 0,
    updatedAt: String(row.updated_at ?? row.created_at ?? ""),
  };
}

export function mapCollection(
  row: Record<string, unknown>,
  opts: {
    recipeCount: number;
    owner: { id: string; displayName: string; avatarUrl: string | null };
  },
) {
  return {
    id: String(row.id),
    name: String(row.name ?? ""),
    coverUrl: String(row.cover ?? ""),
    recipeCount: opts.recipeCount,
    owner: opts.owner,
    createdAt: String(row.created_at ?? ""),
    isPublic: false,
  };
}

export function mapGroceryItem(row: Record<string, unknown>, userId: string) {
  const qty = row.quantity;
  return {
    id: String(row.id),
    userId,
    ingredient: String(row.ingredient ?? ""),
    quantity: qty === null || qty === undefined ? "" : String(qty),
    category: String(row.category ?? ""),
    completed: Boolean(row.completed),
  };
}

export function pantryFreshnessPercent(
  expirationDate: string | null | undefined,
  nowMs: number,
  windowDays = 14,
): number {
  if (!expirationDate) return 100;
  const exp = Date.parse(`${expirationDate}T00:00:00Z`);
  if (!Number.isFinite(exp)) return 100;
  const daysLeft = (exp - nowMs) / 86_400_000;
  if (daysLeft <= 0) return 0;
  return Math.min(100, Math.round((daysLeft / windowDays) * 100));
}

export function mapPantryItem(
  row: Record<string, unknown>,
  nowMs: number,
) {
  const expiration = (row.expiration_date as string | null) ?? null;
  return {
    id: String(row.id),
    ingredient: String(row.ingredient ?? ""),
    quantity: Number(row.quantity ?? 0) || 0,
    unit: String(row.unit ?? ""),
    expirationDate: expiration ?? "",
    freshnessPercent: pantryFreshnessPercent(expiration, nowMs),
  };
}

export type MealSlot = "breakfast" | "lunch" | "dinner";

export function foldMealPlans(
  rows: Array<{
    plan_date: string;
    meal_type: string;
    title: string;
  }>,
): Array<{
  date: string;
  breakfast: string | null;
  lunch: string | null;
  dinner: string | null;
}> {
  const byDate = new Map<string, { breakfast: string[]; lunch: string[]; dinner: string[] }>();
  for (const row of rows) {
    const date = String(row.plan_date).slice(0, 10);
    if (!byDate.has(date)) {
      byDate.set(date, { breakfast: [], lunch: [], dinner: [] });
    }
    const bucket = byDate.get(date)!;
    const slot = row.meal_type as MealSlot;
    if (slot === "breakfast" || slot === "lunch" || slot === "dinner") {
      if (row.title && !bucket[slot].includes(row.title)) {
        bucket[slot].push(row.title);
      }
    }
  }
  return [...byDate.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, slots]) => ({
      date,
      breakfast: slots.breakfast.length ? slots.breakfast.join(" · ") : null,
      lunch: slots.lunch.length ? slots.lunch.join(" · ") : null,
      dinner: slots.dinner.length ? slots.dinner.join(" · ") : null,
    }));
}

export const DEFAULT_ADMIN_SETTINGS = {
  general: {
    appName: "CookApp",
    supportEmail: "",
    defaultLocale: "en-US",
    maintenanceMode: false,
  },
  units: {
    measurementSystem: "metric" as const,
    temperatureUnit: "celsius" as const,
  },
  categories: {
    allowUserTags: true,
    requireCuisine: true,
  },
};

export function mergePersistedSettings(
  stored: unknown,
  system: {
    mockMode: boolean;
    apiBaseUrl: string;
    logLevel: "debug" | "info" | "warn" | "error";
  },
) {
  const raw = (stored && typeof stored === "object" ? stored : {}) as Record<string, unknown>;
  const general = { ...DEFAULT_ADMIN_SETTINGS.general, ...(raw.general as object | undefined) };
  const units = { ...DEFAULT_ADMIN_SETTINGS.units, ...(raw.units as object | undefined) };
  const categories = {
    ...DEFAULT_ADMIN_SETTINGS.categories,
    ...(raw.categories as object | undefined),
  };
  return { general, units, categories, system };
}

export function persistableSettings(payload: Record<string, unknown>) {
  const merged = mergePersistedSettings(payload, {
    mockMode: false,
    apiBaseUrl: "",
    logLevel: "info",
  });
  return {
    general: merged.general,
    units: merged.units,
    categories: merged.categories,
  };
}
