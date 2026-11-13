import type { NextConfig } from "next";

import { legacyRedirects } from "./src/config/redirects";

/**
 * Aplikasi donasi existing (Next.js terpisah, data Odoo) yang saat ini
 * dilayani nginx di /campaign dan /donasi. Isi dengan origin-nya
 * (mis. https://donasi.relawannusantara.org) agar route itu di-proxy.
 */
const CAMPAIGN_ORIGIN = process.env.CAMPAIGN_ORIGIN?.replace(/\/$/, "");

const nextConfig: NextConfig = {
  // Permalink WordPress memakai trailing slash.
  trailingSlash: true,
  poweredByHeader: false,

  // Tailwind v4 via loader Turbopack (bawaan create-next-app 16).
  // Catatan: `cacheComponents` dari scaffold sengaja tidak diaktifkan — situs ini
  // memakai SSG (generateStaticParams) + `revalidate`, yang tidak kompatibel dengannya.
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },

  images: {
    // Media WordPress disimpan di public/wp-content/uploads (path asli dipertahankan).
    localPatterns: [{ pathname: "/wp-content/uploads/**" }],
    remotePatterns: [{ protocol: "https", hostname: "i.ytimg.com" }],
    formats: ["image/avif", "image/webp"],
  },

  // Konten hasil ekspor dibaca via fs pada route dinamis (search, grid, tag).
  outputFileTracingIncludes: {
    "/**": ["./content/**/*"],
  },

  async redirects() {
    return legacyRedirects;
  },

  async rewrites() {
    return {
      beforeFiles: [
        // Pencarian WordPress: /?s=kata → halaman /search
        { source: "/", has: [{ type: "query", key: "s" }], destination: "/search/" },
      ],
      afterFiles: [],
      fallback: CAMPAIGN_ORIGIN
        ? [
            { source: "/campaign", destination: `${CAMPAIGN_ORIGIN}/campaign` },
            { source: "/campaign/:path*", destination: `${CAMPAIGN_ORIGIN}/campaign/:path*` },
            { source: "/donasi/:path*", destination: `${CAMPAIGN_ORIGIN}/donasi/:path*` },
          ]
        : [],
    };
  },
};

export default nextConfig;
