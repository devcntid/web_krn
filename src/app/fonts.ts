import localFont from "next/font/local";

/**
 * Font di-self-host (sumber: @fontsource, lisensi OFL) — tanpa request ke Google Fonts.
 *
 * Poppins dibagi dua kelompok dengan nama font-family yang SAMA:
 *  - `poppins`       → bobot yang tampil di layar pertama (400, 600, 700); di-preload.
 *  - `poppinsExtra`  → bobot lain; TIDAK di-preload, dimuat browser saat dipakai.
 * Sebelumnya ke-14 file font di-preload sekaligus dan berebut bandwidth dengan
 * gambar LCP di koneksi seluler. Manrope hanya dipakai footer, jadi tidak di-preload.
 * (Opsi next/font harus literal — nama family "poppins" ditulis langsung di kedua pemanggilan.)
 */
export const poppins = localFont({
  variable: "--font-poppins-src",
  display: "swap",
  declarations: [{ prop: "font-family", value: "poppins" }],
  src: [
    { path: "../fonts/poppins-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "../fonts/poppins-latin-600-normal.woff2", weight: "600", style: "normal" },
    { path: "../fonts/poppins-latin-700-normal.woff2", weight: "700", style: "normal" },
  ],
});

/** Hanya untuk memuat @font-face bobot tambahan ke family "poppins"; variabelnya tidak dipakai. */
export const poppinsExtra = localFont({
  variable: "--font-poppins-extra-src",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
  declarations: [{ prop: "font-family", value: "poppins" }],
  src: [
    { path: "../fonts/poppins-latin-200-normal.woff2", weight: "200", style: "normal" },
    { path: "../fonts/poppins-latin-300-normal.woff2", weight: "300", style: "normal" },
    { path: "../fonts/poppins-latin-400-italic.woff2", weight: "400", style: "italic" },
    { path: "../fonts/poppins-latin-500-normal.woff2", weight: "500", style: "normal" },
    { path: "../fonts/poppins-latin-700-italic.woff2", weight: "700", style: "italic" },
    { path: "../fonts/poppins-latin-800-normal.woff2", weight: "800", style: "normal" },
    { path: "../fonts/poppins-latin-800-italic.woff2", weight: "800", style: "italic" },
  ],
});

export const manrope = localFont({
  variable: "--font-manrope-src",
  display: "swap",
  preload: false,
  src: [
    { path: "../fonts/manrope-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "../fonts/manrope-latin-500-normal.woff2", weight: "500", style: "normal" },
    { path: "../fonts/manrope-latin-600-normal.woff2", weight: "600", style: "normal" },
    { path: "../fonts/manrope-latin-700-normal.woff2", weight: "700", style: "normal" },
  ],
});
