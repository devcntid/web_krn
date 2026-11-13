import type { MetadataRoute } from "next";

import { SITE_URL } from "@/config/site";
import { getAllPages, getAllPosts, getCategories } from "@/lib/content";
import { legacyRedirects } from "@/config/redirects";

/** Pengganti sitemap Rank Math: halaman, post, dan kategori (tag tidak disertakan, sama seperti WP). */
export default function sitemap(): MetadataRoute.Sitemap {
  const redirected = new Set(legacyRedirects.map((r) => r.source));

  const pages = getAllPages()
    .filter((p) => p.path !== "new-beranda" && !redirected.has(`/${p.path}/`))
    .map((p) => ({ url: `${SITE_URL}/${p.path}/`, lastModified: p.modified }));

  const posts = getAllPosts().map((p) => ({
    url: `${SITE_URL}/${p.slug}/`,
    lastModified: p.modified,
    images: p.featuredImage ? [`${SITE_URL}${p.featuredImage.src}`] : undefined,
  }));

  const categories = getCategories()
    .filter((c) => c.count > 0)
    .map((c) => ({ url: `${SITE_URL}/category/${c.path}/` }));

  return [{ url: `${SITE_URL}/`, priority: 1 }, ...pages, ...posts, ...categories];
}
