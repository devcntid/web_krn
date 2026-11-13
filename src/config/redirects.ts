/** statusCode 301 (bukan 308 bawaan `permanent`) agar identik dengan redirect WordPress. */
type Redirect = { source: string; destination: string; statusCode: 301 | 308 };

/**
 * Redirect 301 dari URL WordPress lama.
 * Keputusan 13 Nov 2026: halaman test/duplikat dialihkan ke halaman padanannya
 * (bukan semua ke beranda); halaman lain dipertahankan.
 */
const testPages: Record<string, string> = {
  // Variasi/percobaan beranda
  "/beranda": "/",
  "/home-lagi": "/",
  "/home-deui": "/",
  "/beranda-testing": "/",
  "/uji-coba-beranda-2025": "/",
  "/251711-2": "/", // "Halaman Utama Awal"
  "/254256-2": "/", // "Nyoba"
  "/254290-2": "/", // tanpa judul
  "/253267-2": "/", // tanpa judul
  "/testing": "/",
  "/testing-page": "/",
  "/testing-card": "/",
  // Percobaan halaman tertentu → halaman resminya
  "/uji-coba-halaman-csr": "/kemitraan/",
  "/253272-2": "/audit-keuangan/", // duplikat "Audit Keuangan"
  "/page-program": "/pr0gram-kami/",
  "/berita-testing": "/berita/",
};

export const legacyRedirects: Redirect[] = [
  ...Object.entries(testPages).map(([source, destination]) => ({
    source: `${source}/`,
    destination,
    statusCode: 301 as const,
  })),

  // Kartu pilar di beranda WordPress menaut ke /pr0gram-kami/<pilar>/ yang
  // di-redirect WP ke halaman level atas — dipertahankan sebagai 301.
  {
    source: "/pr0gram-kami/:pilar(aksi-kemanusiaan|lingkungan|pendidikan|ekonomi)/",
    destination: "/:pilar/",
    statusCode: 301 as const,
  },

  // Sitemap Rank Math → sitemap Next.js
  { source: "/sitemap_index.xml", destination: "/sitemap.xml", statusCode: 301 as const },
  { source: "/:name(post|page|category)-sitemap:n(\\d*).xml", destination: "/sitemap.xml", statusCode: 301 as const },

  // Feed WordPress lama tidak lagi tersedia
  { source: "/feed/", destination: "/berita/", statusCode: 301 as const },
  { source: "/:slug/feed/", destination: "/:slug/", statusCode: 301 as const },
];
