import type { NextConfig } from "next";

import { legacyRedirects } from "./src/config/redirects";

/** Host Vercel Blob untuk media lama hasil migrasi (lihat docs/MEDIA.md). */
const MEDIA_BASE_URL = (process.env.NEXT_PUBLIC_MEDIA_BASE_URL ?? "").replace(/\/$/, "");
const mediaHost = MEDIA_BASE_URL ? new URL(MEDIA_BASE_URL) : null;

const isDev = process.env.NODE_ENV === "development";
const csp = (directives: string[]) => directives.join("; ");

/**
 * CSP /admin (B16): ketat pada asal skrip/gambar/koneksi. 'unsafe-inline' tetap diperlukan
 * karena skrip inline Next tanpa nonce (nonce memaksa semua halaman dinamis — lihat
 * node_modules/next/dist/docs/01-app/02-guides/content-security-policy.md).
 */
const ADMIN_CSP = csp([
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' blob: data: https://*.public.blob.vercel-storage.com https://i.ytimg.com https://*.googleusercontent.com",
  "font-src 'self' data:",
  // Unggah klien Vercel Blob: vercel.com/api/blob + *.blob.vercel-storage.com.
  `connect-src 'self' https://vercel.com https://*.blob.vercel-storage.com${isDev ? " ws: http://localhost:*" : ""}`,
  "frame-src https://www.youtube.com https://www.youtube-nocookie.com https://drive.google.com https://heyzine.com",
  "object-src 'none'",
  "base-uri 'self'",
  // Login Google: aksi form mengalihkan ke accounts.google.com.
  "form-action 'self' https://accounts.google.com",
  "frame-ancestors 'none'",
]);

/**
 * CSP situs publik (bertahap): allowlist untuk Next inline, GA4, Meta Pixel, YouTube/Drive/Heyzine,
 * media Blob, plus `unsafe-inline` untuk SiteCode / visual JS (hanya Super Admin yang boleh menulis JS).
 */
const SITE_CSP = csp([
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com https://connect.facebook.net",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' blob: data: https://*.public.blob.vercel-storage.com https://i.ytimg.com https://www.facebook.com https://www.google-analytics.com https://www.googletagmanager.com",
  "font-src 'self' data:",
  `connect-src 'self' https://www.google-analytics.com https://analytics.google.com https://region1.google-analytics.com https://www.googletagmanager.com https://connect.facebook.net https://www.facebook.com${mediaHost ? ` ${mediaHost.origin}` : ""}${isDev ? " ws: http://localhost:*" : ""}`,
  "frame-src https://www.youtube.com https://www.youtube-nocookie.com https://drive.google.com https://heyzine.com https://www.facebook.com",
  "media-src 'self' blob: https://*.public.blob.vercel-storage.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
  "upgrade-insecure-requests",
]);

const COMMON_HEADERS = [
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
];

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
      // Semua media (lama & baru) disimpan di Vercel Blob
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
      ...(mediaHost
        ? [{ protocol: mediaHost.protocol.replace(":", "") as "https" | "http", hostname: mediaHost.hostname, pathname: "/wp-content/uploads/**" }]
        : []),
    ],
    formats: ["image/avif", "image/webp"],
  },

  // Konten kini dibaca dari database (src/lib/content.ts); yang masih dibaca via fs
  // hanya ikon situs di content/site.json (src/lib/site-icons.ts).
  outputFileTracingIncludes: {
    "/**": ["./content/site.json"],
  },

  async headers() {
    return [
      // Situs publik (semua path kecuali /admin & /api).
      { source: "/((?!admin|api).*)", headers: [...COMMON_HEADERS, { key: "X-Frame-Options", value: "SAMEORIGIN" }, { key: "Content-Security-Policy", value: SITE_CSP }] },
      {
        source: "/admin/:path*",
        headers: [
          ...COMMON_HEADERS,
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Content-Security-Policy", value: ADMIN_CSP },
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
        ],
      },
      { source: "/api/:path*", headers: [...COMMON_HEADERS, { key: "X-Frame-Options", value: "DENY" }] },
    ];
  },

  async redirects() {
    return [
      ...legacyRedirects,
      // /id/… adalah alamat internal — pengunjung selalu diarahkan ke URL tanpa prefiks.
      { source: "/id", destination: "/", statusCode: 301 as const },
      { source: "/id/:path+", destination: "/:path+/", statusCode: 301 as const },
    ];
  },

  async rewrites() {
    return {
      beforeFiles: [
        // Pencarian WordPress: /?s=kata → halaman /search
        { source: "/", has: [{ type: "query", key: "s" }], destination: "/id/search/" },
        { source: "/en", has: [{ type: "query", key: "s" }], destination: "/en/search/" },
      ],
      // Bahasa Indonesia tanpa prefiks: /berita/ dilayani route internal /id/berita/
      // (src/app/(site)/[lang]). File statis & route non-dinamis dicocokkan lebih dulu.
      afterFiles: [
        { source: "/", destination: "/id/" },
        { source: "/:path((?!en/|en$|id/|id$|_next/|api/|admin|wp-content/).*)", destination: "/id/:path" },
      ],
      // URL gambar lama (backlink, Google Images) diteruskan ke Vercel Blob.
      fallback: MEDIA_BASE_URL
        ? [{ source: "/wp-content/uploads/:path*", destination: `${MEDIA_BASE_URL}/wp-content/uploads/:path*` }]
        : [],
    };
  },
};

export default nextConfig;
