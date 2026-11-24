import type { MetadataRoute } from "next";

import { SITE_URL } from "@/config/site";
import { getAllPages, getAllPosts, getCategories } from "@/lib/content";
import { getFrontPagePath } from "@/server/site-settings";
import { legacyRedirects } from "@/config/redirects";
import { TRANSLATED_PATHS } from "@/i18n/translated";
import { absoluteUrl, languageAlternates } from "@/lib/seo";
import { mediaUrl } from "@/lib/media";

/** Pengganti sitemap Rank Math: halaman, post, dan kategori (tag tidak disertakan, sama seperti WP). */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const redirected = new Set(legacyRedirects.map((r) => r.source));

  const front = await getFrontPagePath();
  const pages = (await getAllPages())
    .filter((p) => p.path !== "new-beranda" && p.path !== front && !redirected.has(`/${p.path}/`))
    .map((p) => ({ url: `${SITE_URL}/${p.path}/`, lastModified: p.modified }));

  const posts = (await getAllPosts()).map((p) => ({
    url: `${SITE_URL}/${p.slug}/`,
    lastModified: p.modified,
    images: p.featuredImage ? [absoluteUrl(mediaUrl(p.featuredImage.src))] : undefined,
  }));

  const categories = (await getCategories())
    .filter((c) => c.count > 0)
    .map((c) => ({ url: `${SITE_URL}/category/${c.path}/` }));

  const entries: MetadataRoute.Sitemap = [{ url: `${SITE_URL}/`, priority: 1 }, ...pages, ...posts, ...categories];

  // Halaman yang sudah diterjemahkan: tambahkan hreflang dan entri versi /en/.
  const english: MetadataRoute.Sitemap = [];
  for (const entry of entries) {
    const path = entry.url.slice(SITE_URL.length);
    if (!TRANSLATED_PATHS.has(path)) continue;
    entry.alternates = { languages: languageAlternates(path) };
    english.push({ ...entry, url: `${SITE_URL}/en${path}` });
  }
  return [...entries, ...english];
}
