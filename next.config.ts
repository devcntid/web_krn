import type { NextConfig } from "next";

import { legacyRedirects } from "./src/config/redirects";

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
      fallback: [],
    };
  },
};

export default nextConfig;
