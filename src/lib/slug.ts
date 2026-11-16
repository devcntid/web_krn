import { legacyRedirects } from "@/config/redirects";
import { STATIC_ROUTES, isDonationAppPath } from "@/config/routes";

/** Ubah judul menjadi slug permalink: huruf kecil, angka, dan tanda hubung. */
export function slugify(input: string, maxLength = 90): string {
  const slug = input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug.length <= maxLength ? slug : slug.slice(0, maxLength).replace(/-+[^-]*$/, "") || slug.slice(0, maxLength);
}

/** Segmen URL tingkat atas milik route aplikasi, file khusus, dan sisa WordPress. */
const SYSTEM_SEGMENTS = [
  "admin", "api", "en", "id", "category", "tag", "search", "author", "page", "feed",
  "wp-content", "wp-admin", "wp-json", "wp-login", "_next", "sitemap", "robots", "favicon",
];

/** Slug yang tidak boleh dipakai post: route khusus, segmen sistem, dan sumber redirect lama. */
export const RESERVED_SLUGS: ReadonlySet<string> = new Set([
  ...SYSTEM_SEGMENTS,
  ...[...STATIC_ROUTES].map((p) => p.split("/")[0]),
  ...legacyRedirects.map((r) => r.source.replace(/^\/+|\/+$/g, "")).filter((s) => s && !s.includes("/") && !s.includes(":")),
]);

/** Pesan kesalahan bila slug tidak boleh dipakai; null bila aman (keunikan dicek di server). */
export function slugProblem(slug: string): string | null {
  if (!slug) return "Permalink wajib diisi.";
  if (slug.length > 120) return "Permalink terlalu panjang (maksimal 120 karakter).";
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return "Permalink hanya boleh berisi huruf kecil, angka, dan tanda hubung.";
  if (isDonationAppPath(slug)) return "Permalink berawalan campaign, donasi, atau prog dipakai aplikasi donasi.";
  if (RESERVED_SLUGS.has(slug)) return "Permalink ini sudah dipakai halaman atau route khusus situs.";
  return null;
}
