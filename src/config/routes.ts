/**
 * Halaman WordPress yang sudah direkonstruksi sebagai route khusus (komponen
 * React), sehingga tidak dirender ulang oleh route generik [slug].
 * Tambahkan path di sini setiap kali sebuah halaman mendapat route sendiri.
 */
export const STATIC_ROUTES = new Set<string>([
  "new-beranda", // front page → "/"
  "artikel",
  "berita",
]);

/** Kategori yang dipakai tab grid Publikasi. */
export const PUBLICATION_CATEGORIES = ["artikel", "berita", "kemitraan"] as const;
