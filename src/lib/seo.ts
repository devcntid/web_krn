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
export function metadataFromSeo(seo: SeoMeta | undefined, fallback: { title: string; path: string; description?: string }): Metadata {
  const title = seo?.title || `${fallback.title}${BRAND_SUFFIX}`;
  const description = seo?.description || fallback.description || site.description;
  const canonical = absoluteUrl(fallback.path);
  const ogImage = seo?.ogImage ? absoluteUrl(mediaUrl(seo.ogImage)) : undefined;
  const noindex = /noindex/i.test(seo?.robots ?? "");

  return {
    title: { absolute: title },
    description,
    alternates: { canonical },
    robots: noindex ? { index: false, follow: true } : undefined,
    openGraph: {
      type: seo?.ogType === "article" ? "article" : "website",
      locale: site.locale,
      siteName: site.name,
      url: canonical,
      title: seo?.ogTitle || title,
      description: seo?.ogDescription || description,
      images: ogImage ? [{ url: ogImage }] : undefined,
      publishedTime: seo?.publishedTime,
      modifiedTime: seo?.modifiedTime,
    },
    twitter: {
      card: ogImage ? "summary_large_image" : "summary",
      title: seo?.ogTitle || title,
      description: seo?.ogDescription || description,
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
