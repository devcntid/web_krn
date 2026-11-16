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
- Folder `content/` adalah hasil ekspor dan **sumber seed**, bukan lagi sumber data situs.

### Lapisan data (sejak B2)
```
content/*.json ──npm run db:seed──► Postgres ──src/server/repos/*──► src/lib/content.ts ──► halaman
```
- `src/lib/content.ts` adalah fasad data publik (server-only). Semua fungsinya **async** dan membaca
  database lewat `src/server/repos/{posts,pages,taxonomy}.ts`; hanya konten berstatus `published`.
- Cache: `unstable_cache` dengan tag `posts`, `post:<slug>`, `pages`, `page:<path>`, `taxonomy`
  (`CACHE_TAGS` di `content.ts`), tanpa masa berlaku. Admin menyegarkannya dengan `revalidateTag`.
  `cacheComponents`/`"use cache"` sengaja belum dipakai: mengaktifkannya mengharuskan semua route
  publik dimigrasikan (tanpa `dynamicParams`/`revalidate`, `searchParams` di dalam `<Suspense>`).
- `next build` kini membutuhkan `DATABASE_URL` (halaman statis dirender dari database).
- Konten beranda dan halaman khusus masih dari `src/content/*.ts`; pindah ke database di B7–B11.

## Dua bahasa (id / en)
- **URL**: Indonesia tanpa prefiks (tidak berubah); Inggris di bawah `/en/…`. Bahasa awal selalu Indonesia.
- **Route**: semua halaman publik ada di `src/app/(site)/[lang]/`. `next.config.ts` me-rewrite URL tanpa prefiks
  ke `/id/…` (afterFiles) dan me-redirect `/id/…` yang diketik langsung ke URL tanpa prefiks (301).
- **Bahasa saat render**: tiap layout/halaman memanggil `initLocale(params)`; komponen server memakai
  `getLocale()` (`src/i18n/request.ts`), komponen client `useLocale()` (`src/i18n/Link.tsx`).
- **Tautan**: `Link` dari `@/i18n/Link` menambahkan `/en` otomatis. Path aplikasi donasi tidak diberi prefiks.
- **Teks antarmuka**: `src/i18n/dictionaries/{id,en}.ts`. **Konten halaman**: `src/content/*.ts` (Indonesia, sumber)
  dan `src/content/en/*.ts` (Inggris), dipilih lewat `src/content/localized.ts`.
- **SEO**: halaman yang sudah diterjemahkan terdaftar di `src/i18n/translated.ts` → masuk sitemap dan diberi
  hreflang. Halaman lain di bawah `/en/` (artikel, arsip, halaman lama) menampilkan isi Indonesia dengan
  keterangan, diberi `noindex`, dan canonical-nya menunjuk ke URL Indonesia.
- **Status terjemahan**: semua teks Inggris adalah DRAF (16 Nov 2026) dan perlu ditinjau tim sebelum cut-over.
- **Artikel**: terjemahan disimpan di tabel `post_translations` (sumber: `content/translations/en/posts/*.json`,
  dimuat dengan `npm run db:seed:translations`). Artikel berterjemahan draf tampil dalam bahasa Inggris dengan
  keterangan dan tetap `noindex`; setelah berstatus `reviewed` baru diindeks dan diberi hreflang. Artikel tanpa
  terjemahan menampilkan isi Indonesia. Diterjemahkan bertahap, terbaru dulu.
- Pengalih bahasa: `LanguageToggle` (header desktop dan menu mobile).

## Routing
| URL | Route | Render |
|---|---|---|
| `/` | `app/(site)/page.tsx` (rekonstruksi komponen, data `src/content/home.ts`) | Static |
| `/<slug>/` (post & halaman level atas) | `app/(site)/[slug]` | SSG, `dynamicParams=false` |
| `/<parent>/<child>/` | `app/(site)/[slug]/[child]` | SSG |
| `/artikel/`, `/berita/` | route khusus, `?kategori=&q=&hal=` | Dinamis |
| `/category/<path>/(page/<n>/)` | `app/(site)/category/[...path]` | SSG |
| `/tag/<slug>/(page/<n>/)` | `app/(site)/tag/[...path]` | ISR saat diakses, `noindex` |
| `/?s=…` | rewrite → `app/(site)/search` | Dinamis, `noindex` |
| `/campaign*`, `/donasi/*` | — (hanya tautan) | Aplikasi donasi existing, tidak disentuh |
| `/sitemap.xml`, `/robots.txt` | metadata routes | Static |

Route publik berada di route group `(site)` (tidak mengubah URL) agar `/admin` kelak memakai layout sendiri tanpa header/footer situs; kerangkanya ada di `src/components/layout/SiteShell.tsx`.

Halaman yang mendapat route khusus didaftarkan di `src/config/routes.ts` (`STATIC_ROUTES`) agar tidak dirender ganda oleh `[slug]`.

## SEO
- Meta per URL dari Rank Math (title, description, robots, OG, JSON-LD) → `metadataFromSeo()`; canonical selalu dibangun dari path Next.
- Perbaikan: title/description beranda, satu H1 per halaman, `og:locale=id_ID`, 404 sungguhan, preview Vercel `Disallow`.
- Redirect 301 di `src/config/redirects.ts` (halaman test, `/pr0gram-kami/<pilar>/`, sitemap Rank Math, feed).

## Folder
```
scripts/export-wp.ts
src/app/            root layout (<html>, font, metadata), sitemap, robots, not-found
src/app/(site)/     semua route publik + layout situs (Header, Footer, Tanya Saffa, Analytics)
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
