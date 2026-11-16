import { getLocale } from "@/i18n/request";
import type { Metadata } from "next";

import { SITE_URL, site } from "@/config/site";
import type { SeoMeta } from "@/types/content";
import { mediaUrl } from "@/lib/media";

const BRAND_SUFFIX = ` - ${site.name}`;

export function absoluteUrl(p: string): string {
  if (/^https?:\/\//.test(p)) return p;
  return `${SITE_URL}${p.startsWith("/") ? p : `/${p}`}`;
}

/** Ubah SeoMeta hasil ekspor Rank Math menjadi Metadata Next.js. */
type SeoFallback = {
  title: string;
  path: string;
  description?: string;
  /**
   * Judul & deskripsi bahasa Inggris. Bila diisi, halaman dianggap SUDAH diterjemahkan:
   * versi /en/ diindeks dan kedua bahasa saling menaut lewat hreflang. Bila kosong,
   * versi /en/ diberi noindex dan canonical-nya menunjuk ke URL Indonesia.
   */
  en?: { title: string; description?: string };
};

/** Tag hreflang untuk halaman yang tersedia dalam dua bahasa. */
export function languageAlternates(path: string) {
  return { id: absoluteUrl(path), en: absoluteUrl(`/en${path}`), "x-default": absoluteUrl(path) };
}

export function metadataFromSeo(seo: SeoMeta | undefined, fallback: SeoFallback): Metadata {
  const locale = getLocale();
  const english = locale === "en";
  const translated = Boolean(fallback.en);
  const useEnglish = english && fallback.en;
  const title = useEnglish ? `${fallback.en?.title}${BRAND_SUFFIX}` : seo?.title || `${fallback.title}${BRAND_SUFFIX}`;
  const description = (useEnglish ? fallback.en?.description : undefined) || seo?.description || fallback.description || site.description;
  const canonical = absoluteUrl(useEnglish ? `/en${fallback.path}` : fallback.path);
  const ogImage = seo?.ogImage ? absoluteUrl(mediaUrl(seo.ogImage)) : undefined;
  const noindex = /noindex/i.test(seo?.robots ?? "") || (english && !translated);

  return {
    title: { absolute: title },
    description,
    alternates: { canonical, languages: translated ? languageAlternates(fallback.path) : undefined },
    robots: noindex ? { index: false, follow: true } : undefined,
    openGraph: {
      type: seo?.ogType === "article" ? "article" : "website",
      locale: useEnglish ? "en_US" : site.locale,
      siteName: site.name,
      url: canonical,
      title: useEnglish ? title : seo?.ogTitle || title,
      description: useEnglish ? description : seo?.ogDescription || description,
      images: ogImage ? [{ url: ogImage }] : undefined,
      publishedTime: seo?.publishedTime,
      modifiedTime: seo?.modifiedTime,
    },
    twitter: {
      card: ogImage ? "summary_large_image" : "summary",
      title: useEnglish ? title : seo?.ogTitle || title,
      description: useEnglish ? description : seo?.ogDescription || description,
      images: ogImage ? [ogImage] : undefined,
    },
  };
}

export function pageTitle(title: string): string {
  return `${title}${BRAND_SUFFIX}`;
}

/* ---------- JSON-LD ---------- */

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "NGO",
    "@id": `${SITE_URL}/#organization`,
    name: site.name,
    url: SITE_URL,
    logo: absoluteUrl(mediaUrl(site.logo.src)),
    description: site.description,
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: absoluteUrl(it.path),
    })),
  };
}
