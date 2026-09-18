/** DuplicateDetector — exact URL, canonical/source id, content fingerprint. */

import type { DuplicateResult, StructuredRecipe } from "./types.ts";

export interface DuplicateLookup {
  findByCanonicalUrl(
    canonicalUrl: string,
    excludeJobId?: string,
  ): Promise<{ job_id: string; recipe_id: string | null } | null>;
  findBySourceExternalId?(
    sourceType: string,
    externalId: string,
    excludeJobId?: string,
  ): Promise<{ job_id: string; recipe_id: string | null } | null>;
  findByFingerprint?(
    fingerprint: string,
    excludeJobId?: string,
  ): Promise<{ job_id: string; recipe_id: string | null; exact: boolean } | null>;
}

export function recipeContentFingerprint(recipe: StructuredRecipe): string {
  const title = (recipe.title ?? "").trim().toLowerCase();
  const ings = recipe.ingredients
    .map((i) => (i.ingredient ?? i.raw_text ?? "").trim().toLowerCase())
    .filter(Boolean)
    .sort()
    .join("|");
  const steps = recipe.instructions
    .map((s) => (s.text ?? "").trim().toLowerCase())
    .filter(Boolean)
    .join("|");
  return `${title}::${ings}::${steps}`;
}

export async function detectDuplicate(input: {
  canonical_url: string | null;
  source_type: string;
  source_external_id: string | null;
  recipe: StructuredRecipe;
  exclude_job_id?: string;
  lookup: DuplicateLookup;
}): Promise<DuplicateResult> {
  if (input.canonical_url) {
    const hit = await input.lookup.findByCanonicalUrl(
      input.canonical_url,
      input.exclude_job_id,
    );
    if (hit) {
      return {
        status: "exact",
        match_job_id: hit.job_id,
        match_recipe_id: hit.recipe_id,
        reason: "exact_source_url",
      };
    }
  }

  if (
    input.source_external_id &&
    input.lookup.findBySourceExternalId
  ) {
    const hit = await input.lookup.findBySourceExternalId(
      input.source_type,
      input.source_external_id,
      input.exclude_job_id,
    );
    if (hit) {
      return {
        status: "exact",
        match_job_id: hit.job_id,
        match_recipe_id: hit.recipe_id,
        reason: "exact_source_external_id",
      };
    }
  }

  if (input.lookup.findByFingerprint) {
    const fp = recipeContentFingerprint(input.recipe);
    if (fp.replace(/[:|]/g, "").length > 8) {
      const hit = await input.lookup.findByFingerprint(fp, input.exclude_job_id);
      if (hit) {
        return {
          status: hit.exact ? "exact" : "similar",
          match_job_id: hit.job_id,
          match_recipe_id: hit.recipe_id,
          reason: hit.exact ? "content_fingerprint_exact" : "content_fingerprint_similar",
        };
      }
    }
  }

  return { status: "none" };
}

/** In-memory lookup for unit tests. */
export class MemoryDuplicateLookup implements DuplicateLookup {
  constructor(
    private readonly rows: Array<{
      job_id: string;
      recipe_id: string | null;
      canonical_url?: string | null;
      fingerprint?: string | null;
    }>,
  ) {}

  async findByCanonicalUrl(
    canonicalUrl: string,
    excludeJobId?: string,
  ) {
    const hit = this.rows.find(
      (r) => r.canonical_url === canonicalUrl && r.job_id !== excludeJobId,
    );
    return hit
      ? { job_id: hit.job_id, recipe_id: hit.recipe_id }
      : null;
  }

  async findByFingerprint(fingerprint: string, excludeJobId?: string) {
    const hit = this.rows.find(
      (r) => r.fingerprint === fingerprint && r.job_id !== excludeJobId,
    );
    return hit
      ? { job_id: hit.job_id, recipe_id: hit.recipe_id, exact: true }
      : null;
  }
}
