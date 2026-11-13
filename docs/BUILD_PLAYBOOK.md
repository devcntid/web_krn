# BUILD PLAYBOOK — Relawan Nusantara (Next.js)

Panduan membangun **frontend** (situs publik) dan **backend** (Admin CMS) sesuai desain UI/UX di kanvas Claude Design **“Relawan Nusantara — UI/UX Website & Admin CMS”**, lengkap dengan **prompt step-by-step** yang bisa langsung ditempel ke Claude (Claude Code / Cowork) satu per satu.

- Project: `/Project/krn`
- Kanvas desain: halaman **Website (Frontend)** (artboard `01`–`11`, `M1`–`M4`) dan **Admin CMS (Backend)** (artboard `A0`–`A12`).
- Dokumen pendukung: `docs/WEBSITE_AUDIT.md`, `docs/DESIGN_SYSTEM.md`, `docs/TECHNICAL_ARCHITECTURE.md`, `docs/MEDIA.md`.

---

## 0. Status saat ini (sudah selesai)

| Area | Status |
|---|---|
| Audit WordPress (Phase 1) | ✅ `docs/WEBSITE_AUDIT.md` |
| Next.js 16.4 + TS + Tailwind 4, font self-host, design tokens | ✅ |
| Header (dropdown, search, mobile menu), Footer, “Tanya Saffa” | ✅ |
| Beranda (slider, intro, video, peta+statistik, pilar, publikasi, testimoni, CTA e-Report) | ✅ draf |
| Route: post `/[slug]`, halaman anak, kategori, tag, pencarian `/?s=`, Artikel/Berita (tab+cari+pagination) | ✅ |
| SEO: metadata Rank Math, satu H1, sitemap, robots, redirect 301 halaman test | ✅ |
| Ekspor WordPress (`npm run export`): 672 post, 54 halaman, 5.116 media | ✅ |
| Media lama → `media.relawannusantara.org`, media baru → Vercel Blob | ✅ konfigurasi (infra menunggu DNS) |
| Path milik aplikasi donasi (`/campaign`, `/donasi`, `/prog…`) dikecualikan | ✅ |

**Belum:** rekonstruksi halaman khusus (Profil, Audit, Legalitas, Pilar, Program Kami, Kemitraan, e-Report), penyempurnaan mobile, QA visual, dan **seluruh backend/Admin CMS**.

---

## 1. Arsitektur target

```
                ┌────────────────────────── Vercel ──────────────────────────┐
 Pengunjung ──► │  Next.js 16 (App Router)                                    │
                │   ├─ (site)/…        situs publik  ── baca ──► Postgres     │
                │   ├─ /admin/…        Admin CMS     ── tulis ─► Postgres     │
                │   ├─ /api/…          upload, cron, revalidate               │
                │   └─ proxy.ts        redirect dinamis (Edge Config)         │
                └──────────────┬──────────────────────┬───────────────────────┘
                               │                      │
          media.relawannusantara.org            Vercel Blob
          (gambar lama /wp-content/uploads)     (gambar baru)

 nginx (tetap): /campaign…, /donasi…, /prog…  → aplikasi donasi (tidak disentuh)
```

### Stack yang dipakai
| Lapisan | Pilihan | Alasan |
|---|---|---|
| Framework | Next.js 16.4 App Router, React 19, TypeScript strict | sudah berjalan |
| Styling | Tailwind CSS 4 + token di `globals.css` | sudah berjalan |
| Database | **Postgres (Neon via Vercel Marketplace)** | serverless, integrasi Vercel |
| ORM & migrasi | **Drizzle ORM + drizzle-kit** | type-safe, ringan, SQL-first |
| Auth | **Auth.js (NextAuth v5)**: Google Workspace + email/password, **2FA TOTP** | sesuai artboard A0 |
| Validasi | **Zod** (form & server action) | |
| Editor konten | **Tiptap** (blok: paragraf, H2/H3, list, kutipan, gambar, tombol, video, accordion) → simpan JSON + HTML tersanitasi | sesuai artboard A3 |
| Upload | **Vercel Blob client upload** (`@vercel/blob/client`) | keputusan media |
| Redirect dinamis | **Vercel Edge Config** (sinkron dari tabel `redirects`) dibaca `proxy.ts` | cepat, tanpa query DB per request |
| Cache | API cache Next 16 (`cacheComponents`, `"use cache"`, `cacheTag`) + `revalidateTag`/`updateTag` saat terbit | konten statis-cepat, update instan |
| Jadwal terbit | **Vercel Cron** → `/api/cron/publish` | status “Terjadwal” |
| Analytics dashboard | GA4 Data API (opsional, tahap akhir) | kartu “Pengunjung 30 hari” |

> Prinsip: **satu aplikasi Next.js** untuk situs + admin (route group terpisah), **frontend tidak berubah tampilan** saat sumber data pindah dari JSON ke database — hanya `src/lib/content.ts` yang diganti implementasinya.

### Struktur folder target
```
src/
├─ app/
│  ├─ (site)/                 # semua route publik saat ini dipindah ke sini
│  │  ├─ layout.tsx           # Header + Footer + FloatingContact
│  │  ├─ page.tsx  [slug]/  artikel/  berita/  category/  tag/  search/
│  │  ├─ profil-relawan-nusantara/  audit-keuangan/  asas-legalitas/
│  │  ├─ aksi-kemanusiaan/ lingkungan/ pendidikan/ ekonomi/   (template Pilar)
│  │  ├─ pr0gram-kami/  kemitraan/  e-report/
│  ├─ admin/
│  │  ├─ login/  (auth)
│  │  ├─ layout.tsx           # AdminShell: sidebar + topbar, wajib login
│  │  ├─ page.tsx             # Dashboard
│  │  ├─ publikasi/ [id]/ baru/
│  │  ├─ halaman/  beranda/  media/  taksonomi/  laporan/
│  │  ├─ seo/  pengguna/  pengaturan/  log/
│  ├─ api/ auth/[...nextauth]/  media/upload/  cron/publish/  revalidate/
├─ server/                    # HANYA server: db, repo, actions, auth, audit-log
│  ├─ db/ schema.ts  index.ts  migrations/
│  ├─ repos/ posts.ts pages.ts media.ts …
│  ├─ actions/ posts.ts pages.ts …   ("use server")
│  ├─ auth.ts  permissions.ts  activity.ts  revalidate.ts
├─ components/ site/…  admin/… (AdminSidebar, DataTable, StatusBadge, SeoPanel, MediaPicker, SectionEditor …)
├─ lib/ content.ts (fasad data publik)  media.ts  seo.ts  format.ts
scripts/ export-wp.ts  upload-media.ts  seed-from-export.ts  sync-redirects.ts
```

### Model data (ringkas)
| Tabel | Kolom penting |
|---|---|
| `users` | id, name, email (unik), role (`super_admin`/`editor`/`penulis`/`kontributor`/`viewer`), password_hash?, totp_secret?, last_active_at |
| `accounts`, `sessions` | standar Auth.js |
| `posts` | id, slug (unik), title, excerpt, content_json, content_html, status (`draft`/`review`/`scheduled`/`published`/`trashed`), published_at, author_id, reviewer_id, featured_media_id, seo_title, seo_description, og_image, canonical, robots, legacy_jsonld, created_at, updated_at |
| `post_revisions` | id, post_id, snapshot (jsonb), author_id, created_at |
| `categories` / `tags` | id, slug, path, name, description, parent_id |
| `post_categories` / `post_tags` | relasi many-to-many |
| `pages` | id, path (unik), title, template (`generic`/`pilar`/`profil`/…), sections (jsonb, berurutan), status, seo_* |
| `media` | id, url, source (`legacy`/`blob`), pathname, mime, size, width, height, alt, caption, uploaded_by, created_at |
| `reports` | id, title, theme, url (Heyzine/PDF), cover_media_id, visible, sort |
| `audits` | id, year, opinion, pdf_media_id |
| `legal_docs` | id, kind, text, sort |
| `redirects` | id, source (unik), destination, status_code, note, hits |
| `not_found_log` | path, hits, last_seen |
| `settings` | key (PK), value (jsonb) — identitas, kontak, sosial, menu, integrasi, beranda |
| `activity_log` | id, user_id, action, entity, entity_id, summary, diff (jsonb), created_at |

### Peran & hak akses (artboard A10)
| Kemampuan | Super Admin | Editor | Penulis | Kontributor | Viewer |
|---|:-:|:-:|:-:|:-:|:-:|
| Menulis draf | ✓ | ✓ | ✓ | ✓ | — |
| Menerbitkan | ✓ | ✓ | ✓ | — | — |
| Meninjau & menyetujui | ✓ | ✓ | — | — | — |
| Halaman & beranda | ✓ | ✓ | — | — | — |
| Unggah & hapus media | ✓ | ✓ | ✓ | — | — |
| e-Report, audit, legalitas | ✓ | ✓ | — | — | — |
| SEO & redirect | ✓ | ✓ | — | — | — |
| Pengguna & pengaturan | ✓ | — | — | — | — |

Alur status: **Draf → Review → Terjadwal → Terbit** (+ Sampah). Setiap perubahan tercatat di `activity_log`.

---

## 2. Cara memakai prompt di bawah

1. Jalankan **berurutan**; tiap prompt berdiri sendiri (konteks lengkap) tapi mengandalkan hasil prompt sebelumnya.
2. Buka sesi dengan folder `/Project/krn` terhubung, lalu tempel **Prompt Pembuka** sekali di awal setiap sesi baru.
3. Lampirkan/buka kanvas desain bila prompt menyebut artboard (mis. `A3 · Editor Publikasi + SEO`).
4. Setelah tiap prompt: jalankan `npm run typecheck && npm run lint && npm run build`, commit dengan pesan yang disarankan, baru lanjut.
5. Jangan menggabungkan beberapa prompt sekaligus — perubahan kecil lebih mudah direview.

### Prompt Pembuka (tempel di awal setiap sesi)
```text
Kamu bekerja di project Next.js /Project/krn — rekonstruksi situs WordPress relawannusantara.org.
Baca dulu: AGENTS.md (Next.js 16 punya breaking changes; cek node_modules/next/dist/docs sebelum
menulis kode), docs/BUILD_PLAYBOOK.md, docs/DESIGN_SYSTEM.md, docs/TECHNICAL_ARCHITECTURE.md,
docs/MEDIA.md. Acuan visual: kanvas Claude Design "Relawan Nusantara — UI/UX Website & Admin CMS".
Aturan:
- Pertahankan identitas visual, konten asli (jangan menulis ulang), URL, dan SEO.
- Server Components default; Client Component hanya untuk interaksi.
- TypeScript strict, tanpa `any`. Token warna/font dari globals.css, jangan hex acak.
- Satu H1 per halaman, semantic HTML, kontras ≥4.5:1, target sentuh ≥44px.
- Jangan sentuh path milik aplikasi donasi (/campaign, /donasi, /prog…).
- Gambar lama lewat mediaUrl() (media.relawannusantara.org); gambar baru di Vercel Blob.
- Setelah selesai: jalankan typecheck, lint, build; laporkan file yang berubah dan cara mengujinya.
Jangan commit/push kecuali saya minta.
```

---

## 3. FRONTEND — prompt step by step

### F1 · Verifikasi hasil ekspor & beranda dengan aset asli
```text
Konten hasil `npm run export` sudah ada di content/ dan media di public/wp-content/uploads.
1) Jalankan dev server dengan NEXT_PUBLIC_MEDIA_BASE_URL kosong (media lokal).
2) Periksa beranda vs relawannusantara.org di 1440px dan 390px: urutan slide, gambar kartu pilar
   (Clean-Water, Eco-Hope, Health-For-All, Eco-Hope-1 — pastikan pemetaan judul↔gambar benar),
   ikon statistik (Ellipse-278x), foto testimoni, background CTA e-Report.
3) Perbaiki pemetaan di src/content/home.ts bila keliru, dan sesuaikan ukuran/spacing agar
   mendekati artboard "01 · Beranda" dan "M1 · Beranda (mobile)".
4) Buat skrip `scripts/check-content.ts` (npm run check:content) yang melaporkan: post tanpa
   featured image, gambar tanpa alt, HTML kosong, link internal ke URL yang tidak ada di content/.
Kriteria selesai: beranda tampil dengan aset asli tanpa error konsol; laporan check:content tersimpan
di content/check-report.json.
```
Commit: `feat(home): aset asli & pemeriksa konten`

### F2 · Pindahkan route publik ke route group `(site)`
```text
Pindahkan semua route publik di src/app ke route group src/app/(site)/ dengan layout sendiri
(Header, Footer, FloatingContact, Analytics). Root layout hanya berisi <html>, font, metadata dasar.
Tujuannya agar /admin nanti punya layout terpisah tanpa header/footer situs. URL publik tidak boleh
berubah — verifikasi dengan curl untuk /, /artikel/, /berita/?kategori=kemitraan, satu post, satu
kategori, /?s=sudan, redirect /beranda/ (301), dan 404.
```
Commit: `refactor: route group (site)`

### F3 · Profil Relawan Nusantara
```text
Rekonstruksi /profil-relawan-nusantara/ sebagai route khusus (src/app/(site)/profil-relawan-nusantara)
mengikuti artboard "05 · Profil": hero, "Apa itu Relawan Nusantara?" (teks + foto), Visi (kartu hijau),
Misi (daftar bernomor), dan kartu tautan Audit/Legalitas/e-Report.
Ambil teks VERBATIM dari content/pages/profil-relawan-nusantara.json (jangan menulis ulang); gambar
dari HTML halaman itu. Tambahkan "profil-relawan-nusantara" ke STATIC_ROUTES di src/config/routes.ts.
Metadata dari SEO Rank Math halaman tersebut. Responsif 1440/1280/768/390/360.
```
Commit: `feat(page): profil`

### F4 · Audit Keuangan (accordion)
```text
Rekonstruksi /audit-keuangan/ sesuai artboard "06 · Audit Keuangan": teks komitmen transparansi,
badge "Opini WTP · 2021–2025", dan accordion per tahun (2025→2021) berisi sampul + tombol "Lihat PDF".
Gunakan <details>/<summary> atau komponen accordion yang aksesibel (aria-expanded, keyboard).
Ambil judul tahun dan tautan PDF dari content/pages/audit-keuangan.json. Data disimpan sebagai array
terketik di src/content/audit.ts (nanti pindah ke DB di B11).
```
Commit: `feat(page): audit keuangan`

### F5 · Asas Legalitas
```text
Rekonstruksi /asas-legalitas/ sesuai artboard "07 · Asas Legalitas": paragraf pembuka dan grid kartu
dokumen (jenis + teks). Teks dokumen VERBATIM dari content/pages/asas-legalitas.json (perbaiki hanya
salah ketik jelas seperti "Mel" → "Mei", catat di laporan). Data di src/content/legal.ts.
```
Commit: `feat(page): legalitas`

### F6 · Template Pilar Program (4 halaman)
```text
Buat satu template PillarPage dan pakai untuk /aksi-kemanusiaan/, /lingkungan/, /pendidikan/,
/ekonomi/ sesuai artboard "04 · Pilar Program": hero, tagline + paragraf, "Program Pilihan" (kartu
program), "Cerita Berdampak" (carousel publikasi dari kategori terkait), CTA donasi (/donasi/programs).
Ekstrak judul, tagline, deskripsi, dan daftar program dari content/pages/<pilar>.json ke
src/content/pillars.ts (verbatim). Pemetaan kategori cerita: tentukan dari kategori WordPress yang
paling relevan dan tuliskan di file yang sama agar mudah diubah.
```
Commit: `feat(page): template pilar program`

### F7 · Program Kami + Kerelawanan + Kebencanaan
```text
Rekonstruksi /pr0gram-kami/ (slug dengan angka nol TETAP), /pr0gram-kami/kerelawanan/, dan
/pr0gram-kami/kebencanaan/ memakai komponen yang sudah ada (PageHero, kartu program, grid publikasi).
Bandingkan dengan halaman asli dan content/pages/*.json; konten verbatim.
```
Commit: `feat(page): program kami`

### F8 · Kemitraan
```text
Rekonstruksi /kemitraan/ sesuai artboard "08 · Kemitraan": 4 langkah (Assessment, Planning,
Implementation, Amplification), "Mengapa Berkolaborasi dengan Kami?", testimoni (carousel + dots),
"Cerita Berdampak" (kategori kemitraan, carousel dengan panah kanan-bawah), logo mitra (marquee/carousel,
gambar asli dari halaman), dan CTA "Mari Berkolaborasi". Lengkapi judul poin yang di desain masih
[placeholder] dengan teks asli dari content/pages/kemitraan.json. Perbaiki H1 ganda halaman asli.
```
Commit: `feat(page): kemitraan`

### F9 · e-Report
```text
Rekonstruksi /e-report/ sesuai artboard "09 · e-Report": grid kartu laporan (sampul, judul, tombol
"Baca Laporan ↗" ke Heyzine, target _blank rel=noopener) dan filter tema (Semua, Palestina,
Kurban & Zakat, Penyaluran Bulanan) yang bekerja via URL ?tema=. Ambil judul, sampul, dan tautan dari
content/pages/e-report.json ke src/content/reports.ts. Tambahkan meta description (halaman asli kosong).
```
Commit: `feat(page): e-report`

### F10 · Arsip, pencarian, 404, dan template generik
```text
Samakan ArchiveTemplate, /search, dan not-found dengan artboard "10 · Kategori / Pencarian" dan
"11 · 404": breadcrumb, form cari di halaman, chip kategori terkait, label kategori di kartu.
Lalu perbaiki GenericPageTemplate untuk halaman sisa (ramadhan, kurban, fidyah, company-profile, dll.):
tata letak rapi untuk HTML hasil ekspor (gambar, tombol, accordion <details>). Jalankan semua halaman
di content/pages/index.json dan laporkan yang masih tampak rusak.
```
Commit: `feat: arsip, pencarian, 404, template generik`

### F11 · Mobile
```text
Sesuaikan tampilan mobile dengan artboard M1–M4:
- Menu mobile: accordion per grup (bukan semua submenu terbuka), kotak cari di atas, tautan
  "Tanya Saffa" di bawah; tutup otomatis saat pindah halaman; fokus terkunci saat terbuka; Esc menutup.
- Detail post mobile: bar bawah lengket "Tanya Saffa" + "Donasi Sekarang" (sembunyikan tombol
  melayang Saffa di halaman post agar tidak bertumpuk).
- Publikasi mobile: tab dapat digeser horizontal, tombol "Muat lebih banyak" (fallback pagination).
Uji di 390 dan 360px: tanpa overflow horizontal, target sentuh ≥44px.
```
Commit: `feat(mobile): menu accordion, sticky donate bar`

### F12 · Visual regression WordPress vs Next.js
```text
Buat scripts/visual-compare.ts (Playwright): untuk daftar URL di docs/visual-urls.txt, ambil screenshot
WordPress (https://relawannusantara.org) dan Next.js (http://localhost:3000) pada 1440, 1280, 768, 390,
360 px, simpan berdampingan di qa/screenshots/, hitung persentase beda piksel (pixelmatch), dan tulis
docs/VISUAL_QA_REPORT.md berisi tabel URL × viewport × skor × catatan. Perbaiki perbedaan terbesar
(layout, tipografi, gambar, spacing) lalu jalankan ulang. Jangan menyatakan identik tanpa screenshot.
```
Commit: `qa: visual regression`

### F13 · Performa, aksesibilitas, SEO
```text
Jalankan Lighthouse (desktop & mobile) untuk /, satu post, /berita/, /kemitraan/. Target: Performance
≥90, Accessibility ≥95, Best Practices ≥95, SEO ≥95, CLS <0.1, LCP <2.5s. Perbaiki: ukuran gambar &
`sizes`, prioritas LCP, font preload, JS client yang tidak perlu, kontras, label. Validasi JSON-LD
(Organization, WebSite+SearchAction, BlogPosting, BreadcrumbList), canonical, sitemap, robots, dan
broken link (crawl semua URL di sitemap). Tulis hasil di docs/FINAL_REPORT.md bagian Frontend.
```
Commit: `perf/a11y/seo: QA frontend`

---

## 4. BACKEND (Admin CMS) — prompt step by step

### B1 · Database & skema
```text
Siapkan database Postgres (Neon dari Vercel Marketplace; DATABASE_URL di .env.local) dengan
Drizzle ORM + drizzle-kit. Buat src/server/db/schema.ts sesuai "Model data" di docs/BUILD_PLAYBOOK.md
(users, accounts, sessions, posts, post_revisions, categories, tags, post_categories, post_tags, pages,
media, reports, audits, legal_docs, redirects, not_found_log, settings, activity_log) dengan enum
status & role, indeks pada slug/path/status/published_at, dan foreign key. Tambahkan skrip npm:
db:generate, db:migrate, db:studio. Semua kode DB di src/server/ dengan `import "server-only"`.
Tulis docs/DATABASE.md (ERD ringkas + penjelasan tiap tabel).
```
Commit: `feat(db): skema drizzle`

### B2 · Migrasi konten JSON → database & ganti lapisan data
```text
Buat scripts/seed-from-export.ts (npm run db:seed) yang mengimpor content/ ke database: kategori &
tag (dengan parent), post (status published, published_at = date WP, SEO Rank Math, legacy_jsonld),
relasi kategori/tag, halaman (template "generic" + HTML sebagai satu section "richtext"), media lama
(source=legacy, pathname /wp-content/uploads/…), redirect dari src/config/redirects.ts, settings
(identitas, kontak, sosial, menu dari src/config/site.ts, beranda dari src/content/home.ts).
Idempoten (upsert berdasarkan slug/path).
Lalu ganti implementasi src/lib/content.ts agar membaca dari database lewat src/server/repos/*
dengan cache Next 16 ("use cache" + cacheTag per entitas: posts, post:<slug>, pages, page:<path>,
settings, taxonomy). Baca node_modules/next/dist/docs tentang cacheComponents/cacheTag/updateTag
sebelum mengubah next.config. Tanda tangan fungsi publik TIDAK berubah sehingga semua halaman tetap
jalan. Verifikasi: build sukses, jumlah URL di sitemap sama dengan sebelum migrasi.
```
Commit: `feat(data): konten dari database`

### B3 · Autentikasi & otorisasi
```text
Pasang Auth.js v5: provider Google (batasi domain email organisasi lewat env ALLOWED_EMAIL_DOMAIN)
dan Credentials (email + password hash argon2/bcrypt), session database, plus 2FA TOTP (otplib) wajib
untuk Super Admin & Editor. Buat src/server/permissions.ts dengan matriks peran dari playbook
(fungsi can(user, ability)) dan helper requireUser()/requireAbility() untuk server action & route.
Lindungi /admin/** (kecuali /admin/login) — redirect ke login bila belum masuk. Rate-limit login.
Buat skrip npm run admin:create untuk membuat Super Admin pertama.
```
Commit: `feat(auth): login, 2FA, peran`

### B4 · Admin shell + halaman Login
```text
Bangun layout /admin sesuai artboard "Komponen · Sidebar Admin" dan "A0 · Login":
sidebar hijau tua (#0F2E2A) dengan grup Ringkasan/Konten/Sistem, item aktif hijau primer, badge
jumlah review, profil pengguna + keluar di bawah; konten fluid dengan topbar. Font Manrope.
Sidebar menyembunyikan menu yang tidak diizinkan peran pengguna. Responsif: di <1024px sidebar jadi
drawer. Komponen bersama di src/components/admin/: PageHeader, Card, StatusBadge, DataTable
(sorting, pilih baris, aksi massal, pagination), EmptyState, ConfirmDialog, Toast.
```
Commit: `feat(admin): shell & login`

### B5 · Dashboard
```text
Bangun /admin (artboard "A1 · Dashboard"): sapaan + tanggal, tombol "+ Tulis Publikasi" dan
"Lihat Situs", 4 kartu ringkasan (jumlah publikasi per kategori, halaman, media, kategori/tag — dari DB),
panel "Menunggu tindakan" (publikasi status review, post tanpa meta description, media tanpa alt,
URL 404 tanpa redirect — masing-masing dengan tautan), tabel 5 publikasi terbaru. Kartu "Pengunjung 30 hari"
tampilkan placeholder dulu (GA4 di B17).
```
Commit: `feat(admin): dashboard`

### B6 · Publikasi: daftar, editor, alur kerja, SEO
```text
Bangun /admin/publikasi (artboard "A2") dan /admin/publikasi/[id] + /baru (artboard "A3"):
- Daftar: tab status (Semua/Terbit/Review/Terjadwal/Draf/Sampah) dengan jumlah, cari judul/slug,
  filter kategori/penulis/bulan, indikator SEO (Baik/Perlu/Kurang), aksi massal, pagination via URL.
- Editor Tiptap: judul, permalink (slug unik, cegah bentrok dengan path aplikasi donasi & route
  khusus), blok paragraf/H2/H3/list/kutipan/gambar (MediaPicker, alt wajib)/tombol/video YouTube/accordion.
  Simpan content_json + content_html tersanitasi (whitelist sama dengan scripts/export-wp.ts).
  Autosave draf, riwayat revisi (post_revisions) dengan pulihkan.
- Panel kanan: status & jadwal, penulis/reviewer, gambar unggulan, kategori & tag, panel SEO
  (judul ≤60, deskripsi ≤160 dengan penghitung, pratinjau Google, checklist: satu H1, alt lengkap,
  canonical).
- Alur: Kontributor hanya kirim ke Review; Editor/Penulis bisa terbit; Terjadwal butuh tanggal.
- Saat terbit/ubah/hapus: revalidate tag post:<slug>, posts, kategori terkait, sitemap; catat
  activity_log. Pratinjau draf via Draft Mode.
```
Commit: `feat(admin): publikasi & editor`

### B7 · Halaman & section builder
```text
Bangun /admin/halaman (artboard "A4 · Halaman & Section"): daftar halaman (hierarki, status),
editor halaman berbasis section yang bisa diurutkan (drag & drop dengan dnd-kit, keyboard accessible),
tampil/sembunyi, dan form per tipe section: Hero, Teks 2 kolom, Kartu program, Grid publikasi
(sumber: kategori), Testimoni, Accordion, Logo mitra, CTA, Richtext. Definisikan tipe section dengan
Zod di src/server/sections.ts dan renderer publik di src/components/site/sections/*. Pindahkan
halaman yang sudah direkonstruksi (Profil, Audit, Legalitas, Pilar, Program, Kemitraan, e-Report) ke
data section sehingga bisa diedit tanpa kode, tanpa mengubah tampilan publik.
```
Commit: `feat(admin): halaman & section`

### B8 · Kelola Beranda
```text
Bangun /admin/beranda (artboard "A5"): slider kampanye terpisah Desktop/Mobile (gambar, judul/alt,
tautan, urutan drag, jadwal tayang mulai/selesai), panel "Jejak Sebaran Kebaikan" (judul + 4 angka),
URL video YouTube, daftar testimoni (tambah/ubah/urut/tampilkan). Simpan di settings.home; beranda
publik membaca dari situ (hapus ketergantungan src/content/home.ts). Tombol "Pratinjau" (Draft Mode)
dan "Terbitkan Perubahan" (revalidate tag settings + "/").
```
Commit: `feat(admin): kelola beranda`

### B9 · Pustaka Media (Vercel Blob)
```text
Bangun /admin/media (artboard "A6"): grid media (lama dari media.relawannusantara.org + baru dari
Blob), cari nama/alt, filter jenis/bulan, filter "Tanpa teks alt", panel detail (pratinjau, ukuran,
dipakai di mana, alt wajib, keterangan, salin URL, hapus). Unggah via drag & drop memakai
@vercel/blob/client (route /api/media/upload dengan handleUpload; cek sesi & ability di
onBeforeGenerateToken; batasi tipe & ukuran; path media/YYYY/MM/). Setelah unggah, baca dimensi dan
simpan ke tabel media. Media lama tidak bisa dihapus dari server (hanya disembunyikan). Komponen
MediaPicker (modal) dipakai ulang di editor dan beranda.
```
Commit: `feat(admin): pustaka media`

### B10 · Kategori & Tag
```text
Bangun /admin/taksonomi (artboard "A7"): form tambah (nama, slug otomatis, induk, deskripsi untuk meta
arsip), tabel kategori & tag dengan jumlah post, edit inline, dan "Gabungkan" (pindahkan semua post
ke istilah tujuan, buat redirect 301 dari arsip lama, hapus istilah lama). Revalidate arsip terkait.
```
Commit: `feat(admin): taksonomi`

### B11 · e-Report, Audit, Legalitas
```text
Bangun /admin/laporan (artboard "A8"): CRUD laporan penyaluran (judul, tema, URL Heyzine/PDF, sampul,
tampil, urutan), daftar audit per tahun (opini, unggah/ganti PDF ke Blob), dan dokumen legalitas
(jenis, teks, urutan). Halaman publik /e-report/, /audit-keuangan/, /asas-legalitas/ membaca dari DB.
```
Commit: `feat(admin): laporan & transparansi`

### B12 · SEO & Redirect
```text
Bangun /admin/seo (artboard "A9"): kartu kesehatan SEO (post tanpa meta description, H1 ganda,
media tanpa alt, status sitemap), CRUD redirect (301/302/410, validasi loop & tujuan), dan log 404
(path, hits, terakhir) dengan tombol "Buat redirect". Simpan redirect di DB lalu sinkronkan ke Vercel
Edge Config (src/server/redirects-sync.ts); src/proxy.ts membaca Edge Config untuk redirect dinamis
(redirect statis di next.config tetap). Catat 404 lewat not-found.tsx (server action ringan, abaikan bot).
```
Commit: `feat(admin): seo & redirect`

### B13 · Pengguna & Peran
```text
Bangun /admin/pengguna (artboard "A10"): tabel pengguna (peran, status 2FA, terakhir aktif), undang
pengguna via email (tautan undangan berlaku 72 jam), ubah peran, nonaktifkan, reset 2FA, dan tampilan
matriks hak akses (read-only, dari src/server/permissions.ts). Hanya Super Admin. Cegah menghapus
Super Admin terakhir.
```
Commit: `feat(admin): pengguna & peran`

### B14 · Pengaturan Situs
```text
Bangun /admin/pengaturan (artboard "A11"): identitas (nama, tagline, logo, favicon), kontak (WA,
email, alamat), tautan sosial, editor menu navigasi (urut & bersarang, drag), integrasi (GA4 ID,
Meta Pixel ID, tautan tombol Donasi — default /campaign), toggle tombol "Tanya Saffa" dan mode
perawatan. Header/Footer/Analytics publik membaca dari settings (hapus nilai statis di
src/config/site.ts kecuali fallback). Revalidate tag settings.
```
Commit: `feat(admin): pengaturan situs`

### B15 · Log Aktivitas
```text
Bangun /admin/log (artboard "A12"): timeline aktivitas (waktu, jenis TERBIT/EDIT/HAPUS/LOGIN/SETUP,
pengguna, ringkasan, tombol "Lihat" untuk diff sebelum/sesudah), filter pengguna/aksi/rentang, ekspor
CSV. Pastikan semua server action (B6–B14) memanggil logActivity() dari src/server/activity.ts.
```
Commit: `feat(admin): log aktivitas`

### B16 · Jadwal terbit, cache, & keamanan
```text
1) Vercel Cron (vercel.json) tiap 10 menit → /api/cron/publish (dilindungi CRON_SECRET) untuk
   menerbitkan post Terjadwal yang sudah waktunya + revalidate.
2) Audit semua server action: requireAbility(), validasi Zod, sanitasi HTML, CSRF bawaan Next,
   header keamanan (CSP, X-Frame-Options untuk /admin, Referrer-Policy), rate limit login & upload.
3) Uji cache: ubah post di admin → halaman publik terbarui tanpa redeploy (< beberapa detik).
4) Tulis tes: unit (permissions, slug, sanitizer, sections Zod) dengan Vitest; e2e (Playwright):
   login → tulis draf → review → terbit → tampil di /berita/ → buat redirect → cek 301.
```
Commit: `feat: cron publish, hardening, tests`

### B17 · Analytics dashboard (opsional)
```text
Hubungkan kartu "Pengunjung 30 hari" di Dashboard ke GA4 Data API (service account, env
GA4_PROPERTY_ID + kredensial): grafik sesi harian, total sesi, event klik Donasi & klik WhatsApp
(tambahkan event gtag pada DonateButton dan FloatingContact). Cache 1 jam.
```
Commit: `feat(admin): ga4 di dashboard`

---

## 5. Deploy & cut-over

### D1 · Staging di Vercel
```text
Siapkan deployment Vercel: environment variables (lihat .env.example + DATABASE_URL, AUTH_SECRET,
AUTH_GOOGLE_ID/SECRET, ALLOWED_EMAIL_DOMAIN, BLOB_READ_WRITE_TOKEN, EDGE_CONFIG, CRON_SECRET),
Neon branch untuk preview, db:migrate saat build, Blob store, Edge Config. Pastikan preview
ber-robots Disallow. Tulis docs/DEPLOYMENT.md: instalasi lokal, env, build, migrasi, deploy, rollback
(promote deployment sebelumnya; DNS kembali ke WordPress), dan checklist cut-over.
```

### D2 · Checklist cut-over (dikerjakan manual, bukan oleh Claude)
- [ ] `media.relawannusantara.org` aktif + SSL, semua file ter-rsync (cek acak 20 URL).
- [ ] Ekspor ulang konten terakhir dari WordPress → `npm run db:seed` (delta).
- [ ] Freeze penulisan di WordPress.
- [ ] Uji staging: semua URL di sitemap lama → 200/301 (tidak ada 404), form cari, redirect.
- [ ] nginx: `/campaign`, `/donasi`, `/prog*` tetap ke aplikasi donasi; sisanya ke Vercel (atau DNS ke Vercel bila aplikasi donasi dipindah ke subdomain).
- [ ] Google Search Console: kirim sitemap baru, pantau Coverage 2 minggu.
- [ ] WordPress tetap hidup (read-only) minimal 30 hari sebagai cadangan.

### D3 · Laporan akhir
```text
Lengkapi docs/FINAL_REPORT.md: fitur & halaman selesai, hasil tes (unit, e2e, visual, Lighthouse),
status SEO (URL dipertahankan, redirect, sitemap), performa, risiko tersisa, dan kesiapan deploy.
```

---

## 6. Ringkasan urutan

| # | Prompt | Hasil |
|---|---|---|
| 1 | F1–F2 | Aset asli, route group |
| 2 | F3–F9 | Semua halaman khusus direkonstruksi |
| 3 | F10–F11 | Arsip/404/generik, mobile |
| 4 | F12–F13 | QA visual, performa, SEO |
| 5 | B1–B3 | Database, migrasi konten, auth |
| 6 | B4–B6 | Admin shell, dashboard, publikasi |
| 7 | B7–B11 | Halaman, beranda, media, taksonomi, laporan |
| 8 | B12–B15 | SEO/redirect, pengguna, pengaturan, log |
| 9 | B16–B17 | Cron, keamanan, tes, analytics |
| 10 | D1–D3 | Staging, cut-over, laporan akhir |
