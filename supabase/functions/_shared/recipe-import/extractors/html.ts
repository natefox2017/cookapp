/** Shared HTML extract helpers used by generic web + social adapters. */

export function stripTags(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function extractTitle(html: string): string | null {
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (!m) return null;
  return stripTags(m[1]).trim() || null;
}

export function extractMeta(html: string, property: string): string | null {
  const escaped = property.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(
    `<meta[^>]+(?:property|name)=["']${escaped}["'][^>]+content=["']([^"']+)["']`,
    "i",
  );
  const alt = new RegExp(
    `<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${escaped}["']`,
    "i",
  );
  return re.exec(html)?.[1] ?? alt.exec(html)?.[1] ?? null;
}

/** Parse <script type="application/ld+json"> blocks and collect Recipe nodes. */
export function extractJsonLdRecipes(html: string): unknown[] {
  const recipes: unknown[] = [];
  const re =
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(html)) !== null) {
    const raw = match[1].trim();
    if (!raw) continue;
    try {
      const parsed = JSON.parse(raw);
      collectRecipes(parsed, recipes);
    } catch {
      // ignore invalid JSON-LD blocks
    }
  }
  return recipes;
}

function collectRecipes(node: unknown, out: unknown[]): void {
  if (node == null) return;
  if (Array.isArray(node)) {
    for (const item of node) collectRecipes(item, out);
    return;
  }
  if (typeof node !== "object") return;
  const obj = node as Record<string, unknown>;
  if (Array.isArray(obj["@graph"])) {
    collectRecipes(obj["@graph"], out);
  }
  const typeVal = obj["@type"];
  const types = Array.isArray(typeVal)
    ? typeVal.map(String)
    : typeVal != null
    ? [String(typeVal)]
    : [];
  if (types.some((t) => t.toLowerCase() === "recipe" || t.endsWith("/recipe"))) {
    out.push(obj);
  }
}

export function extractImageCandidates(
  html: string,
): Array<{ url: string; alt?: string | null }> {
  const out: Array<{ url: string; alt?: string | null }> = [];
  const og = html.match(
    /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
  );
  if (og?.[1]) out.push({ url: og[1], alt: "og:image" });
  const imgRe = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
  let m: RegExpExecArray | null;
  let count = 0;
  while ((m = imgRe.exec(html)) !== null && count < 8) {
    out.push({ url: m[1], alt: null });
    count += 1;
  }
  return out;
}
