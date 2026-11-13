import type { NextConfig } from "next";

import { legacyRedirects } from "./src/config/redirects";

/** Host media eksternal opsional (lihat src/lib/media.ts). */
const MEDIA_BASE_URL = (process.env.NEXT_PUBLIC_MEDIA_BASE_URL ?? "").replace(/\/$/, "");
const mediaHost = MEDIA_BASE_URL ? new URL(MEDIA_BASE_URL) : null;

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
    remotePatterns: [
      { protocol: "https", hostname: "i.ytimg.com" },
      // Gambar baru (setelah migrasi) disimpan di Vercel Blob
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
      ...(mediaHost
        ? [{ protocol: mediaHost.protocol.replace(":", "") as "https" | "http", hostname: mediaHost.hostname, pathname: "/wp-content/uploads/**" }]
        : []),
    ],
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
      // URL gambar lama (backlink, Google Images) tetap hidup bila media dipindah ke host lain.
      fallback: MEDIA_BASE_URL
        ? [{ source: "/wp-content/uploads/:path*", destination: `${MEDIA_BASE_URL}/wp-content/uploads/:path*` }]
        : [],
    };
  },
};

export default nextConfig;
