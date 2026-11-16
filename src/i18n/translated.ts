/**
 * Path (versi Indonesia) yang SUDAH punya terjemahan Inggris. Versi /en/-nya masuk
 * sitemap dan diberi hreflang. Path lain di bawah /en/ tetap bisa dibuka, tetapi
 * isinya masih bahasa Indonesia, diberi noindex, dan tidak masuk sitemap.
 * Tambahkan path di sini bersamaan dengan `en` di metadataFromSeo halaman terkait.
 */
export const TRANSLATED_PATHS = new Set<string>([
  "/",
  "/profil-relawan-nusantara/",
  "/audit-keuangan/",
  "/asas-legalitas/",
  "/aksi-kemanusiaan/",
  "/lingkungan/",
  "/pendidikan/",
  "/ekonomi/",
  "/pr0gram-kami/",
  "/pr0gram-kami/kerelawanan/",
  "/pr0gram-kami/kebencanaan/",
  "/kemitraan/",
  "/e-report/",
]);
