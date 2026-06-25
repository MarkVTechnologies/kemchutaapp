// ─────────────────────────────────────────────────────────────────────────────
// Estate normalization helpers — adapt to actual KHL backend shape
// ─────────────────────────────────────────────────────────────────────────────
import type { Estate } from "@/types";

// Backend price comes as a string like "30,000,000". Parse to number for formatting.
export function parsePrice(p: unknown): number {
  if (typeof p === "number" && !isNaN(p)) return p;
  if (typeof p === "string") {
    const cleaned = p.replace(/[,\s₦]/g, "");
    const n = parseInt(cleaned, 10);
    return isNaN(n) ? 0 : n;
  }
  return 0;
}

export function formatNaira(p: unknown): string {
  const n = parsePrice(p);
  if (n === 0) return "Price on request";
  return "₦" + n.toLocaleString("en-NG", { maximumFractionDigits: 0 });
}

// Backend gallery items are objects { url, publicId, caption } — extract URLs only
export function getGalleryUrls(estate: any): string[] {
  if (!estate) return [];
  const gallery = estate.gallery;
  if (!Array.isArray(gallery)) return [];
  return gallery
    .map((g) => (typeof g === "string" ? g : g?.url))
    .filter((s): s is string => typeof s === "string" && s.length > 0);
}

// All images: featured image first, then gallery URLs, deduplicated
export function getAllImages(estate: any): string[] {
  const featured = estate?.img || estate?.featuredImage;
  const all: string[] = [];
  if (typeof featured === "string" && featured.length > 0) all.push(featured);
  for (const url of getGalleryUrls(estate)) {
    if (!all.includes(url)) all.push(url);
  }
  return all;
}

export function getFeaturedImage(estate: any): string | null {
  const v = estate?.img || estate?.featuredImage;
  return typeof v === "string" && v.length > 0 ? v : null;
}

export function getEstateName(estate: any): string {
  return (
    estate?.estate ||
    estate?.name ||
    estate?.slug ||
    "Estate"
  ).toString();
}

export function getEstateDescription(estate: any): string {
  return (estate?.desc || estate?.description || "").toString();
}

// Amenities/neighborhood come as [{name: "x, y, z"}] or [{name:"x"},{name:"y"}] — flatten both
export function flattenNamed(arr: unknown): string[] {
  if (!Array.isArray(arr)) return [];
  const out: string[] = [];
  for (const item of arr as Array<{ name?: string } | string>) {
    const name = typeof item === "string" ? item : item?.name;
    if (typeof name !== "string") continue;
    for (const part of name.split(",")) {
      const trimmed = part.trim();
      if (trimmed) out.push(trimmed);
    }
  }
  return Array.from(new Set(out));
}
