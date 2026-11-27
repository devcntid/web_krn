# Comprehensive Website Audit — Relawan Nusantara (`web_krn`)

**Tanggal:** 27 November 2026  
**Mode:** Audit only (tidak ada perbaikan kode aplikasi)  
**Bukti:** kode repositori + pengujian lokal non-destruktif (`tsc`, `eslint`, `vitest`, `npm audit`, header HTTP localhost)

Laporan interaktif: canvas `website-audit.canvas.tsx` di Cursor.

---

## A. Executive Summary

CMS Next.js ini punya fondasi keamanan admin yang kuat (Auth.js JWT, argon2id, rate limit, 2FA Super Admin/Editor, RBAC server-side, sanitasi HTML, unggah Blob berbatas). Risiko tertinggi: CSP publik sangat longgar, endpoint preview tanpa cek ability, dan eksekusi JavaScript kustom oleh peran yang dipercaya. Performa dan SEO teknis di atas rata-rata untuk migrasi WordPress, dengan celah LCP beranda, cakupan sitemap EN, dan `html lang`.

**Catatan ruang lingkup:** domain publik historis masih bisa dilayani WordPress. Temuan performa/SEO di bawah mengacu pada build Next lokal dan kode repo kecuali dinyatakan lain.

---

## B. Overall Scores (0–100)

| Area | Score | Dasar penilaian |
|---|---:|---|
| Security | **72** | Auth/RBAC/upload/sanitize kuat; SITE_CSP lemah; preview IDOR; custom JS |
| Performance | **74** | next/image + font strategy baik; Embla/SiteCode di publik; home revalidate 600 |
| Technical SEO | **78** | robots/sitemap/hreflang/JSON-LD solid; lang & sitemap EN gap |
| Code Quality | **73** | tsc pass; 1 eslint error; 1 unit test stale |
| Production Readiness | **75** | Siap staging; selesaikan HIGH sebelum cut-over penuh |

Tidak ada temuan **CRITICAL** (bypass auth, SQLi mentah, atau RCE unauthenticated) pada jalur yang diperiksa.

---

## Phase 1 — Architecture Map

| Lapisan | Teknologi |
|---|---|
| App | Next.js 16.4.6 App Router, React 19.3, TypeScript, Tailwind 4 |
| Data | Neon Postgres, Drizzle ORM |
| Auth | Auth.js v5 JWT, Credentials + Google, TOTP, argon2 (`@node-rs/argon2`) |
| Media | Vercel Blob (`media/YYYY/MM/`), rewrite `/wp-content/uploads` |
| Cache / edge | `unstable_cache` + tags, Edge Config redirects, `revalidate` |
| Deploy | Vercel, cron `/api/cron/publish/` |
| Publik | `(site)/[lang]/…`, SiteShell, ISR |
| Admin | `/admin/**`, ability matrix, Visual Builder, settings |
| API | `/api/auth`, `/api/media/upload`, `/api/preview`, `/api/cron/publish` |

---

## C. Critical & High Findings

### HIGH-1 — Preview tanpa ability check
- **Lokasi:** `src/app/api/preview/route.ts:14-40`
- **Bukti:** Hanya `getCurrentUser()`; Viewer/Kontributor yang lolos MFA bisa `draftMode.enable()` dan mempratinjau post/halaman by ID.
- **Dampak:** Kebocoran draf/konten belum terbit.
- **Perbaikan:** `requireAbility` sesuai jenis; batasi status yang boleh dilihat.

### HIGH-2 — SITE_CSP publik minimal
- **Lokasi:** `next.config.ts:33-34,83` (terverifikasi di localhost)
- **Bukti:** Header hanya `object-src 'none'; base-uri 'self'; frame-ancestors 'self'; upgrade-insecure-requests`.
- **Dampak:** XSS tersimpan (jika ada) mudah mengeksekusi skrip/koneksi arbitrer.
- **Perbaikan:** Perketat bertahap (script-src nonce/hash, batasi frame/img/connect).

### HIGH-3 — Custom JS di situs publik (fitur admin)
- **Lokasi:** visual `code` nodes; `SiteCode.tsx`; settings `codes`
- **Bukti:** JavaScript disimpan dan dijalankan di publik; HTML visual disanitasi saat save (`pages-service.ts`), tetapi elemen `code` tidak.
- **Dampak:** Akun Editor/Super Admin yang disusupi = XSS situs-wide.
- **Perbaikan:** Batasi ke `system.manage`, audit log, review sebelum publish, CSP.

---

## D. Detailed Findings Table

| No | Category | Finding | Risk | File Location | Recommendation |
|---|---|---|---|---|---|
| 1 | Security | Preview draft mode tanpa ability | HIGH | `api/preview/route.ts` | Gate ability + status |
| 2 | Security | SITE_CSP hampir kosong | HIGH | `next.config.ts` | CSP bertahap |
| 3 | Security | Kode kustom / SiteCode JS mentah | HIGH | visual-page, SiteCode, settings | Privilege + audit + CSP |
| 4 | Security | npm audit zod DoS via `@vercel/blob` | MEDIUM | lockfile | Pin/patch setelah uji |
| 5 | Security | Admin CSP `unsafe-inline` (+ eval di dev) | MEDIUM | `next.config.ts` | Rencana nonce |
| 6 | Security | robots tidak Disallow `/admin/` | LOW | `robots.ts` | Opsional Disallow |
| 7 | Performance | Embla client tanpa dynamic import | MEDIUM | HeroSlider, Carousel | `next/dynamic` |
| 8 | Performance | Logo + hero preload vs LCP | MEDIUM | Header, HeroSlider | Satu prioritas LCP |
| 9 | Performance | SiteCode + GA di setiap halaman | MEDIUM | SiteShell, Analytics | Tunda / kosongkan |
| 10 | SEO | `html lang="id"` selalu | MEDIUM | `layout.tsx` | Lang per locale |
| 11 | SEO | Sitemap EN terbatas TRANSLATED_PATHS | MEDIUM | `sitemap.ts` | Sertakan post EN |
| 12 | SEO | Meta/org description hardcoded | LOW | page.tsx, seo.ts | Dari settings |
| 13 | SEO | Tidak ada FAQ schema; no rel prev/next | INFO | Pagination | Opsional |
| 14 | Code Quality | Ref assign saat render Dialog | MEDIUM | `Dialog.tsx:35` | Sync di useEffect |
| 15 | Code Quality | Test expect 25 section types (aktual 26) | LOW | `sections.test.ts` | Update expect |
| 16 | Infrastructure | Edge Config redirect bisa belum aktif | MEDIUM | proxy, SEO UI | Konfigurasi prod |

---

## E. Performance Optimization Plan

1. Ukur LCP mobile beranda (hero vs logo).
2. Code-split Embla/carousel publik.
3. Tunda SiteCode; pastikan snippet produksi kosong kecuali perlu.
4. Pertahankan AVIF/WebP; hindari raw `<img>` di path publik baru.
5. Jangan menambah preload font berat (strategi saat ini sudah sadar LCP).

---

## F. SEO Improvement Plan

1. `html lang` dinamis.
2. Perluas sitemap `/en/` untuk post ber-hreflang.
3. Meta description beranda & Organization description dari settings.
4. Opsional `Disallow: /admin/` / `/api/`; pastikan Edge Config aktif.
5. FAQ schema hanya jika ada halaman FAQ.

---

## G. Prioritized Roadmap

| Priority | Fokus | Complexity |
|---|---|---|
| **P1** | Preview gate · rencana CSP · batasi/audit custom JS | MEDIUM |
| **P2** | LCP beranda · dynamic Embla · skrip pihak ketiga | MEDIUM |
| **P3** | html lang · sitemap EN · meta settings · robots | LOW–MEDIUM |
| **P4** | Dialog lint · sections.test · unused var PageEditor | LOW |
| **P5** | npm audit zod · FAQ · Edge Config verify | LOW |

---

## H. Files to Modify (setelah persetujuan)

- `src/app/api/preview/route.ts` — ability + status  
- `next.config.ts` — SITE_CSP bertahap  
- `src/app/robots.ts` — Disallow opsional  
- `src/app/layout.tsx` / site layout — `lang`  
- `src/app/sitemap.ts` — EN posts  
- `src/app/(site)/[lang]/page.tsx`, `src/lib/seo.ts` — meta dari settings  
- `src/components/admin/Dialog.tsx` — lint refs  
- `tests/unit/sections.test.ts` — expect 26  
- HeroSlider / Carousel consumers — LCP / dynamic  

---

## Phase 6 — Automated Checks

| Check | Result |
|---|---|
| `tsc --noEmit` | PASS |
| `vitest` | 54/55 (sections count) |
| `eslint` | 1 error (`Dialog.tsx`) |
| `npm audit --omit=dev` | 4 high (zod transitive) |
| Headers localhost `/` | SITE_CSP lemah terkonfirmasi |
| Headers `/admin/` | ADMIN_CSP + `X-Robots-Tag: noindex, nofollow` + HSTS |

**Tidak dijalankan:** pentest agresif, load test production, ekspansi secret env.

---

## Kontrol yang sudah baik (bukti)

- Password argon2id + burn timing (`password.ts`, `auth/index.ts`)
- Rate limit email/IP/TOTP/upload (`rate-limit.ts`)
- 2FA wajib Super Admin/Editor; MFA flag tidak di-set hanya karena peran longgar
- `requireAbility` di server actions admin
- `sanitizeContentHtml` + whitelist (termasuk node visual `html` saat save)
- Upload: session, `media.manage`, mime/size/path folder
- Cron: `timingSafeEqual` Bearer secret
- Preview: tujuan redirect dari DB (bukan open redirect query)

---

## Next step

Audit selesai. **Tidak ada perubahan kode perbaikan.**  
Pilih prioritas (disarankan mulai **P1**), lalu perbaikan bertahap + regression test per perubahan.
