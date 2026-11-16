/**
 * Halaman WordPress yang sudah direkonstruksi sebagai route khusus (komponen
 * React), sehingga tidak dirender ulang oleh route generik [slug].
 * Tambahkan path di sini setiap kali sebuah halaman mendapat route sendiri.
 */
export const STATIC_ROUTES = new Set<string>([
  "new-beranda", // front page → "/"
  "artikel",
  "berita",
  "profil-relawan-nusantara",
  "audit-keuangan",
  "asas-legalitas",
  // Pilar program (template PillarPage)
  "aksi-kemanusiaan",
  "lingkungan",
  "pendidikan",
  "ekonomi",
  // Program Kami (slug dengan angka nol dipertahankan) + halaman anak
  "pr0gram-kami",
  "pr0gram-kami/kerelawanan",
  "pr0gram-kami/kebencanaan",
]);

/** Kategori yang dipakai tab grid Publikasi. */
export const PUBLICATION_CATEGORIES = ["artikel", "berita", "kemitraan"] as const;

/**
 * Prefix URL milik aplikasi donasi terpisah (dilayani nginx di domain yang sama:
 * /campaign…, /donasi…, /prog…). Halaman/post WordPress dengan path berawalan ini
 * di situs lama SUDAH tertutup oleh aplikasi donasi, jadi tidak dirender di sini
 * agar route-nya tidak bentrok saat cut-over.
 * Contoh: /program/, /program-2/, /program-berbagi-air-sedekah-air-bersih/.
 */
export const DONATION_APP_PREFIXES = ["campaign", "donasi", "prog"] as const;

export function isDonationAppPath(path: string): boolean {
  const p = path.replace(/^\/+/, "");
  return DONATION_APP_PREFIXES.some((prefix) => p.startsWith(prefix));
}
