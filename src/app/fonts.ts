import localFont from "next/font/local";

/** Font di-self-host (sumber: @fontsource, lisensi OFL) — tanpa request ke Google Fonts. */
export const poppins = localFont({
  variable: "--font-poppins-src",
  display: "swap",
  src: [
    { path: "../fonts/poppins-latin-200-normal.woff2", weight: "200", style: "normal" },
    { path: "../fonts/poppins-latin-300-normal.woff2", weight: "300", style: "normal" },
    { path: "../fonts/poppins-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "../fonts/poppins-latin-500-normal.woff2", weight: "500", style: "normal" },
    { path: "../fonts/poppins-latin-600-normal.woff2", weight: "600", style: "normal" },
    { path: "../fonts/poppins-latin-700-normal.woff2", weight: "700", style: "normal" },
    { path: "../fonts/poppins-latin-700-italic.woff2", weight: "700", style: "italic" },
    { path: "../fonts/poppins-latin-800-normal.woff2", weight: "800", style: "normal" },
    { path: "../fonts/poppins-latin-800-italic.woff2", weight: "800", style: "italic" },
  ],
});

export const manrope = localFont({
  variable: "--font-manrope-src",
  display: "swap",
  src: [
    { path: "../fonts/manrope-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "../fonts/manrope-latin-500-normal.woff2", weight: "500", style: "normal" },
    { path: "../fonts/manrope-latin-600-normal.woff2", weight: "600", style: "normal" },
    { path: "../fonts/manrope-latin-700-normal.woff2", weight: "700", style: "normal" },
  ],
});
