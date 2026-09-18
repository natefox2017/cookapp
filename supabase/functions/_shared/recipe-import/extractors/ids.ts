/** Parse first-class import source IDs from canonical URLs. */

export function youtubeVideoId(rawUrl: string): string | null {
  try {
    const url = new URL(rawUrl);
    const host = url.hostname.replace(/^www\./, "").toLowerCase();
    if (host === "youtu.be") {
      const id = url.pathname.split("/").filter(Boolean)[0] ?? "";
      return isYoutubeId(id) ? id : null;
    }
    const v = url.searchParams.get("v");
    if (v && isYoutubeId(v)) return v;
    const parts = url.pathname.split("/").filter(Boolean);
    if (
      parts[0] &&
      ["shorts", "embed", "live", "v"].includes(parts[0]) &&
      parts[1] &&
      isYoutubeId(parts[1])
    ) {
      return parts[1];
    }
    return null;
  } catch {
    return null;
  }
}

function isYoutubeId(value: string): boolean {
  return /^[A-Za-z0-9_-]{11}$/.test(value);
}

export function tiktokVideoId(rawUrl: string): string | null {
  try {
    const url = new URL(rawUrl);
    const match = url.pathname.match(/\/video\/(\d+)/);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}

export function instagramShortcode(rawUrl: string): string | null {
  try {
    const url = new URL(rawUrl);
    const parts = url.pathname.split("/").filter(Boolean);
    const kind = parts[0];
    if (kind && ["p", "reel", "reels", "tv"].includes(kind) && parts[1]) {
      return parts[1].replace(/[^A-Za-z0-9_-]/g, "") || null;
    }
    return null;
  } catch {
    return null;
  }
}
