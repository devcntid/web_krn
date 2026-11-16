import { site } from "@/config/site";

/** Batas panjang yang dipakai panel SEO admin. */
export const SEO_TITLE_MAX = 60;
export const SEO_DESCRIPTION_MAX = 160;

export type SeoLevel = "baik" | "perlu" | "kurang";
export type SeoCheck = { ok: boolean; label: string };

export type SeoInput = {
  title: string;
  slug: string;
  seoTitle: string | null;
  seoDescription: string | null;
  canonical: string | null;
  /** Ada <img> tanpa teks alt di isi. */
  missingAlt: boolean;
  /** Ada <h1> di isi (judul halaman sudah menjadi H1). */
  hasH1InContent?: boolean;
};

export const SEO_LEVEL_LABEL: Record<SeoLevel, string> = { baik: "Baik", perlu: "Perlu", kurang: "Kurang" };

/** Judul yang tampil di <title> bila judul SEO kosong (lihat metadataFromSeo). */
export function effectiveSeoTitle(title: string, seoTitle: string | null): string {
  return seoTitle?.trim() || `${title} - ${site.name}`;
}

function canonicalIsSelf(canonical: string | null, slug: string): boolean {
  const c = canonical?.trim();
  if (!c) return true;
  const path = c.replace(/^https?:\/\/[^/]+/i, "").replace(/\/+$/, "");
  return path === `/${slug}`;
}

/**
 * Checklist SEO + tingkatnya. "Kurang" = meta description kosong; "Perlu" = ada gambar tanpa alt,
 * deskripsi terlalu panjang, atau canonical menunjuk URL lain; judul >60 hanya peringatan.
 */
export function evaluateSeo(input: SeoInput): { level: SeoLevel; checks: SeoCheck[] } {
  const titleLength = effectiveSeoTitle(input.title, input.seoTitle).length;
  const description = input.seoDescription?.trim() ?? "";
  const selfCanonical = canonicalIsSelf(input.canonical, input.slug);

  const checks: SeoCheck[] = [
    input.hasH1InContent ? { ok: false, label: "Isi memuat H1 lain selain judul" } : { ok: true, label: "Satu H1 (judul)" },
    input.missingAlt ? { ok: false, label: "Ada gambar tanpa teks alt" } : { ok: true, label: "Semua gambar punya teks alt" },
    titleLength > SEO_TITLE_MAX
      ? { ok: false, label: `Judul SEO lebih dari ${SEO_TITLE_MAX} karakter` }
      : { ok: true, label: `Judul SEO ≤ ${SEO_TITLE_MAX} karakter` },
    !description
      ? { ok: false, label: "Meta description kosong" }
      : description.length > SEO_DESCRIPTION_MAX
        ? { ok: false, label: `Meta description lebih dari ${SEO_DESCRIPTION_MAX} karakter` }
        : { ok: true, label: "Meta description terisi" },
    selfCanonical ? { ok: true, label: "Canonical: URL sendiri" } : { ok: false, label: "Canonical menunjuk URL lain" },
  ];

  const level: SeoLevel = !description
    ? "kurang"
    : input.missingAlt || input.hasH1InContent || description.length > SEO_DESCRIPTION_MAX || !selfCanonical
      ? "perlu"
      : "baik";
  return { level, checks };
}

/** Benar bila HTML memuat <img> tanpa atribut alt yang terisi. */
export function htmlHasImageWithoutAlt(html: string): boolean {
  return /<img\b(?![^>]*\salt="[^"]+")[^>]*>/i.test(html);
}
