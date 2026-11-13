# TECHNICAL_ARCHITECTURE

## Stack
Next.js 16.4 (App Router, Turbopack) · React 19.3 · TypeScript (strict) · Tailwind CSS 4.3 · Embla Carousel · lucide-react + simple-icons · cheerio + sanitize-html (hanya untuk script ekspor). Target deploy: **Vercel**.

## Strategi konten (keputusan: snapshot statis)
WordPress diekspor **sekali** (bisa diulang) oleh `scripts/export-wp.ts`:

```
content/
  posts/index.json           ringkasan semua post (terbaru dulu)
  posts/<slug>.json          post + HTML tersanitasi + SEO Rank Math
  pages/index.json, pages/<path>.json   (path "a/b" → "a__b.json")
  categories.json, tags.json
  site.json                  ikon situs
  media-manifest.json        semua path media yang dirujuk
  export-report.json         jumlah, ukuran media, peringatan
public/wp-content/uploads/…  media dengan path ASLI WordPress
```
- REST API hanya memberi shortcode Divi mentah, jadi konten diambil dari **HTML publik yang sudah dirender** (`.rk-post-content` di template post; `.et-l--post` di halaman), lalu disanitasi: whitelist tag, H1 konten → H2, accordion Divi → `<details>`, tombol Divi → `a[data-button]`, URL absolut → relatif.
- Path media dipertahankan → URL gambar lama tetap valid (SEO gambar) dan konten tidak perlu di-rewrite.
- Data dibaca lewat `src/lib/content.ts` (server-only, fs + cache).

## Routing
| URL | Route | Render |
|---|---|---|
| `/` | `app/page.tsx` (rekonstruksi komponen, data `src/content/home.ts`) | Static |
| `/<slug>/` (post & halaman level atas) | `app/[slug]` | SSG, `dynamicParams=false` |
| `/<parent>/<child>/` | `app/[slug]/[child]` | SSG |
| `/artikel/`, `/berita/` | route khusus, `?kategori=&q=&hal=` | Dinamis |
| `/category/<path>/(page/<n>/)` | `app/category/[...path]` | SSG |
| `/tag/<slug>/(page/<n>/)` | `app/tag/[...path]` | ISR saat diakses, `noindex` |
| `/?s=…` | rewrite → `app/search` | Dinamis, `noindex` |
| `/campaign*`, `/donasi/*` | — (hanya tautan) | Aplikasi donasi existing, tidak disentuh |
| `/sitemap.xml`, `/robots.txt` | metadata routes | Static |

Halaman yang mendapat route khusus didaftarkan di `src/config/routes.ts` (`STATIC_ROUTES`) agar tidak dirender ganda oleh `[slug]`.

## SEO
- Meta per URL dari Rank Math (title, description, robots, OG, JSON-LD) → `metadataFromSeo()`; canonical selalu dibangun dari path Next.
- Perbaikan: title/description beranda, satu H1 per halaman, `og:locale=id_ID`, 404 sungguhan, preview Vercel `Disallow`.
- Redirect 301 di `src/config/redirects.ts` (halaman test, `/pr0gram-kami/<pilar>/`, sitemap Rank Math, feed).

## Folder
```
scripts/export-wp.ts
src/app/            routes, layout, sitemap, robots, fonts
src/components/     layout/ home/ sections/ cards/ navigation/ templates/ content/ seo/ ui/
src/config/         site.ts (brand, menu, kontak), routes.ts, redirects.ts
src/content/        home.ts (konten beranda yang dikelola di kode)
src/lib/            content.ts, seo.ts, format.ts, site-icons.ts
src/types/          content.ts
```

## Aplikasi donasi
Tombol Donasi, slider beranda, dan CTA post hanya menautkan ke `/campaign` dan `/donasi/programs` (aplikasi terpisah, tidak disentuh). Saat cut-over DNS, pastikan path tersebut tetap dilayani server existing.

## Media
Semua media (lama hasil migrasi & baru) disimpan di **Vercel Blob**; path WordPress dipertahankan (`wp-content/uploads/...`). Detail: `docs/MEDIA.md`.
