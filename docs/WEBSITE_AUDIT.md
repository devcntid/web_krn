# WEBSITE_AUDIT — relawannusantara.org (Phase 1)

Tanggal audit: 13 November 2026 · Sumber: browser inspection (desktop 1193px & mobile 300–390px), sitemap Rank Math, WordPress REST API publik, DOM/CSS computed styles.
Status: **ANALISIS SAJA** — belum ada project, file, atau dependency yang dibuat/diubah.

---

## 1. Gambaran Umum

| Item | Temuan |
|---|---|
| Brand | **Relawan Nusantara** (lembaga kemanusiaan, Bandung). Tagline: "Berawal dari Kepedulian, Bergerak Menjadi Jembatan Kebaikan" |
| CMS | WordPress, REST API terbuka (`/wp-json/wp/v2`) |
| Theme | **Divi** + child theme `divi-child` v1.0.0, memakai **Divi Theme Builder** (template header, body post, footer global) |
| Page builder | Divi untuk ~95% konten (posts & pages). Hanya sebagian kecil post terbaru yang Gutenberg |
| SEO plugin | **Rank Math** (meta, OG, JSON-LD, sitemap index) |
| Plugin terdeteksi | Supreme Modules for Divi, Addons for Divi (wdc), Wow Carousel for Divi Lite, Divi Torque Lite, Smart Slider 3, Real Testimonials (testimonial-free), Mobile Bottom Menu for WP, Google Site Kit, Code Snippets, Wordfence, Akismet, 404 to 301 (abj404) |
| Analytics/pixel | Google Analytics/GTM (Site Kit), Facebook Pixel (connect.facebook.net) |
| Font | **Poppins** (utama) & **Manrope** dari Google Fonts; FontAwesome + ETmodules (ikon Divi) |
| Donasi | Tombol "Donasi" → **`/campaign`**, yang ternyata **aplikasi Next.js terpisah** (Pages Router, route `/[prefix]`) dengan data program dari backend Odoo (field `write_date`, `total_funded`, `target`). Di-serve via nginx pada domain yang sama |

### Volume konten (REST API)
| Tipe | Jumlah |
|---|---|
| Posts | **672** (sitemap: 200+200+200+72) |
| Pages | **54** (±25 di antaranya halaman test/draft yang ter-publish) |
| Categories | 37 |
| Tags | 1.857 |
| Media | 2.954 file |
| Custom post type `project` (Divi) | 0 |
| Comments | 0 |

---

## 2. Navigasi

### Header desktop (sticky, kartu putih melayang ber-radius & border tipis, lebar ~1080px)
```
Beranda                 → /
Tentang Kami ▾          → (#)
  Profil Relawan Nusantara → /profil-relawan-nusantara/
  Audit Keuangan           → /audit-keuangan/
  Legalitas                → /asas-legalitas/
Program Kami ▾          → (#)
  Aksi Kemanusiaan → /aksi-kemanusiaan/
  Lingkungan       → /lingkungan/
  Pendidikan       → /pendidikan/
  Ekonomi          → /ekonomi/
Publikasi ▾             → (#)
  Artikel   → /artikel/
  Berita    → /berita/
  e-Report  → /e-report/
Kemitraan               → /kemitraan/
[ikon Search]           → overlay search Divi → /?s=
[Donasi]                → /campaign  (oranye #F4A62A; di template post berwarna hijau #006659)
```

### Mobile
Logo kiri · tombol Donasi · hamburger. Menu dibuka sebagai daftar penuh (submenu langsung tampil, teks center, tanpa accordion). Search tidak tampil di mobile.

### Footer (bg krem #F8F7F0, bar bawah hijau #006659)
- Kolom 1: logo + kotak pernyataan asal dana (border oranye putus-putus) + catatan opini **WTP 2021–2025**.
- **Eksplor**: Beranda, Tentang Kami (→/profil-relawan-nusantara/), Program (→**/pr0gram-kami/**), Kemitraan, Whistleblower (Google Form eksternal).
- **Publikasi**: 2 post terbaru (judul + tanggal).
- **Hubungi Kami**: +62 853-5341-5664 (WA Only), admin@relawannusantara.org, Ruko Magna Commercial Blok MB 50-52, Summarecon Bandung 40295.
- Sosial: Instagram, Facebook, YouTube, Threads, LinkedIn.
- Bar bawah: Terms of Use | Privacy Policy.

### Floating element
- Widget bulat kanan-bawah "**Tanya Saffa**" (ilustrasi CS) → link WhatsApp (`api.whatsapp.com/send`). Tampil di semua halaman.
- Plugin Mobile Bottom Menu terpasang, tetapi tidak terlihat aktif di viewport mobile yang diuji.

---

## 3. Inventaris Halaman

### 3.1 Halaman publik aktif (terhubung dari menu/footer)
| URL | Judul | Komponen utama |
|---|---|---|
| `/` | New Beranda | Smart Slider (hero, versi desktop & mobile berbeda), intro 2 kolom, video YouTube, peta sebaran + counter "Jejak Sebaran Kebaikan 2026", grid 4 pilar program, carousel publikasi, carousel testimoni, CTA e-Report |
| `/profil-relawan-nusantara/` | Profil Relawan Nusantara | Fullwidth header, blurb, code module |
| `/audit-keuangan/` | Audit Keuangan | Fullwidth header, **accordion/toggle** per tahun |
| `/asas-legalitas/` | Asas Legalitas | Fullwidth header, daftar dokumen legal |
| `/aksi-kemanusiaan/` · `/lingkungan/` · `/pendidikan/` · `/ekonomi/` | Pilar program | Template seragam: fullwidth header, blurb, code module (list post) |
| `/pr0gram-kami/` (+ `/kerelawanan/`, `/kebencanaan/` sebagai child) | Program Kami | Fullwidth header, blurb. **Slug memakai angka nol** — dipakai di footer |
| `/artikel/` · `/berita/` | Artikel / Berita | Fullwidth header + **custom post grid `pkp-post-grid`** (Code Snippets): tab Artikel/Berita/Kemitraan, search, pagination AJAX (admin-ajax + nonce), 9 kartu/halaman |
| `/kemitraan/` (judul "Jaringan Kebaikan") | Kemitraan | 4 langkah (Assessment–Amplification), "Mengapa Berkolaborasi", testimoni (Real Testimonials, dots), carousel "Cerita Berdampak", logo mitra (Wow Carousel) |
| `/e-report/` | e-Reporting | Grid laporan yang membuka **flipbook Heyzine** eksternal |
| `/campaign` | — | **Aplikasi Next.js terpisah** (donasi) |

### 3.2 Halaman lain yang terindeks (sitemap) — perlu keputusan
`/company-profile/`, `/companyprofile/`, `/tentang-kami/`, `/mitra-kami/`, `/program/`, `/program-2/`, `/relawan-nusantara/`, `/gabung-relawan/`, `/ramadhan/`, `/kurban/`, `/fidyah/`, `/global-sumud-flotilla/`, `/sedekah-daging-3/4/5/`, `/perantara-ramadhan-3/`, `/peduli-ekonomi/`, `/peduli-kesehatan/`, `/peduli-lingkungan/`, `/peduli-pendidikan/`, `/aksi-kemanusiaan-dan-sosial/`, `/berita-3/`

### 3.3 Halaman test/duplikat yang ter-publish & terindeks (kandidat dihapus + redirect/410)
`/beranda/`, `/home-lagi/`, `/home-deui/`, `/beranda-testing/`, `/uji-coba-beranda-2025/`, `/uji-coba-halaman-csr/`, `/testing/`, `/testing-page/`, `/testing-card/`, `/berita-testing/`, `/page-program/`, `/251711-2/`, `/253267-2/`, `/253272-2/`, `/254256-2/`, `/254290-2/`

### 3.4 Arsip
| Pola | Catatan |
|---|---|
| `/<slug>/` | **Post di root** (permalink `/%postname%/`) — 672 URL harus dipertahankan persis |
| `/category/<slug>/` & `/category/<parent>/<child>/` | 37 kategori; layout arsip Divi standar (tanpa H1) |
| `/tag/<slug>/` | 1.857 tag, tidak ada di sitemap |
| `/?s=<q>` | Search WP default |
| 404 | Status 404 benar, tapi `<title>` ikut "New Beranda" |

Kategori besar: blog (620), berita (403), bencana (142), artikel (135), yatim-dhuafa-lansia (87), palestina (74), sekolah-madrasah (64), kemanusiaan (60), kemitraan (59), pangan (49), kurban (47), ramadhan (40).

---

## 4. Analisis Halaman Kunci

### 4.1 Homepage (tinggi ±5.130px di 1193px)
1. **Hero slider** (Smart Slider 3, full-bleed ±807px): slide "Respon 72 Jam", "Respon Darurat Karhutla", "Bantuan Kemanusiaan Sudan", "Musim Dingin Palestina". Arrow kiri/kanan. Banner berisi teks dalam gambar + tombol CTA. Mobile memakai slider/banner berbeda (mis. banner HUT RI 81).
2. **Intro** 2 kolom: heading "Berawal dari Kepedulian," (h3) + "Bergerak Menjadi Jembatan Kebaikan" (h2 italic 800, 45px) | paragraf. Label vertikal "Scroll Untuk Eksplorasi".
3. **Video** YouTube dengan overlay thumbnail + tombol play (radius besar).
4. **Peta sebaran** (gambar peta: Palestina, Sudan, Malaysia, Indonesia) + panel hijau "Jejak Sebaran Kebaikan 2026": 287.507 Penerima Manfaat · 3.012 Relawan · 50 Mitra · 109 Jangkauan Wilayah (ikon outline dalam lingkaran).
5. **"Dari Niat Yang Sama, Lahir Berbagai Aksi Kebaikan."** + tombol outline "Yuk, Kenali Lebih Dekat" + grid 2×2 kartu foto (Aksi Kemanusiaan, Ekonomi, Pendidikan, Lingkungan) dengan overlay gelap & judul putih.
6. **Publikasi** + tombol outline "Ikuti Kisahnya Lebih Lanjut" → carousel 3 kartu (gambar, judul, excerpt, tanggal "November 11th, 2026"), arrow bulat.
7. **"Bersama Menebar Dampak"** — carousel testimoni (kutipan italic di kotak abu, foto bulat, nama, peran hijau).
8. **CTA Laporan Penyaluran** (bg foto + kartu semi-transparan) → tombol oranye pill "Buka E-Report".
9. Footer.

### 4.2 Detail post (Theme Builder body template)
- Hero: judul post (H1, putih, ±40px) di atas gambar/overlay gelap.
- 2 kolom: konten (±63%) + sidebar "post terkait" (kartu gambar, judul, excerpt, tanggal, tombol hijau "Selengkapnya").
- Konten Divi: paragraf justify, heading H1/H2, gambar full-width ber-radius.
- Share/sosial: Facebook, LinkedIn, WhatsApp.
- Ada **dua section konten duplikat** (versi desktop & mobile disembunyikan bergantian).

### 4.3 Listing Artikel/Berita
Hero foto + judul; heading "Kilas Perjuangan dari Nusantara"; toolbar tab pill (aktif: hijau solid, lainnya outline) + input search abu; grid 3 kolom kartu putih (gambar 4:3 ber-radius, judul bold, excerpt abu, ikon kalender + tanggal "21 Oct, 2026", tombol hijau "Selengkapnya"); pagination angka dengan ellipsis.

---

## 5. Design System (ekstraksi computed styles)

### Warna
| Token | Nilai | Pemakaian |
|---|---|---|
| `primary` | **#006659** | Hijau brand: tombol sekunder, footer bar, panel counter, tab aktif |
| `primary-light` | #01997F / #2CA395 | Teks peran testimoni, aksen |
| `accent` | **#F4A62A** | Tombol Donasi & CTA utama |
| `accent-soft` | #EEC044 | Tanggal di footer |
| `cream` | #F8F7F0 | Background footer |
| `surface-muted` | #D5D5D5 / #D9D9D9E0 | Kotak testimoni |
| `section-bg-alt` | ±#F2F6F8 (kebiruan muda) | Background halaman Kemitraan |
| `text` | #000000 / #1D1D18 | Heading |
| `text-body` | #444 / #333 / #666 | Paragraf |
| `text-muted` | #A5A49A | Meta/excerpt |

### Tipografi (Poppins)
| Elemen | Ukuran / line-height / weight |
|---|---|
| H2 display | 45px / 1.0 / 800 (sering italic) |
| H3 | 28px / 1.0 / 700 |
| H4 (counter) | 24px / 700 |
| Menu | 16px / 600 |
| Body | ±16px / 1.4–1.5 / 400 |
| Button | 13–16px / 700 |
| Meta | 12–14px |
Manrope dipakai di beberapa modul (perlu dipetakan per komponen di Phase 3).

### Komponen & bentuk
- Container ±1080px (Divi row 80% / max 1080), gutter Divi 3.
- Radius: tombol 5px (Donasi) · pill penuh (CTA, tab) · kartu 8–16px.
- Tombol outline hijau 2px pill; tombol solid hijau radius 6px.
- Shadow halus pada kartu & header melayang.
- Ikon: FontAwesome + ETmodules (akan diganti SVG/lucide).

---

## 6. Inventaris Fitur

| Fitur | Implementasi WP | Target Next.js | Prioritas |
|---|---|---|---|
| Sticky floating header + dropdown | Divi Theme Builder | Komponen server + client kecil untuk dropdown | High |
| Mobile menu | Divi | Client component | High |
| Search overlay | Divi | Route `/` dengan `?s=` (pertahankan) + index pencarian | Medium |
| Hero slider (desktop & mobile terpisah) | Smart Slider 3 | Carousel ringan (Embla) + `next/image` art-direction | High |
| Counter statistik | Divi | Statis/config (opsi animasi count-up) | Medium |
| Video YouTube | Divi video | Lite-YouTube (facade) | Medium |
| Carousel publikasi | Wow Carousel / Torque | Embla, data dari post terbaru | High |
| Testimoni carousel | Real Testimonials | Embla + data JSON | Medium |
| Logo mitra carousel | Wow Carousel | Marquee/Embla | Medium |
| Post grid tab + search + pagination | Code Snippet + admin-ajax | Route ber-URL (`?kategori=&page=&q=`) SSG/ISR | High |
| Accordion audit keuangan | Divi toggle | `<details>` / Radix Accordion | High |
| e-Report flipbook | Link Heyzine | Pertahankan link eksternal | High |
| Tombol Donasi → `/campaign` | App Next.js terpisah | **Jangan disentuh**; rewrite/proxy tetap | High |
| Floating "Tanya Saffa" WA | Divi footer image | Komponen floating | High |
| Share sosial | Divi | Link share native | Medium |
| Whistleblower | Google Form | Link eksternal | Low |
| SEO meta/OG/JSON-LD/sitemap | Rank Math | Metadata API + `sitemap.ts` + JSON-LD | High |
| Redirect 404→301 | abj404 | `redirects` di `next.config` / middleware | High |
| Analytics GA4 + FB Pixel | Site Kit / snippet | `@next/third-parties` + Pixel via `next/script` | Medium |
| Keamanan login | Wordfence | Tidak relevan jika headless/statis | — |

---

## 7. Audit SEO (temuan yang harus diperbaiki saat migrasi)

| Masalah | Lokasi | Dampak |
|---|---|---|
| Title homepage "**New Beranda** - Relawan Nusantara" | `/` | Title brand lemah |
| Meta description homepage "**ScrollUntukEksplorasi**" | `/` | Snippet rusak di SERP |
| **Tidak ada H1** di homepage; arsip kategori & search juga 0 H1 | `/`, `/category/*`, `/?s=` | Struktur heading |
| **Multiple H1** di post (subjudul konten pakai H1) & `/kemitraan/` (2 H1) | Post detail | Struktur heading |
| `og:locale = en_US` padahal konten Bahasa Indonesia | Global | Harus `id_ID` |
| ±16 halaman test/duplikat terindeks di sitemap | §3.3 | Konten tipis/duplikat |
| Halaman 404 memakai title homepage | 404 | Minor |
| Slug `/pr0gram-kami/` (angka nol) | Footer | Dipertahankan + canonical, atau redirect ke slug baru (butuh keputusan) |
| `e-report` tanpa meta description | `/e-report/` | Minor |
| JSON-LD sudah ada (Organization, WebSite, WebPage, BlogPosting, Person) | Global | Pertahankan & rapikan |

---

## 8. Asset & Konten

- Logo: `/wp-content/uploads/2026/05/logo-rn.png` (PNG — sebaiknya minta versi SVG).
- 2.954 media di `/wp-content/uploads/YYYY/MM/`. Featured image tiap post via `featured_media`.
- Konten post = HTML hasil render Divi (`et_pb_*` wrapper). Perlu **sanitasi**: buang wrapper Divi, pertahankan heading, paragraf, gambar, link, bold — tanpa rewrite.
- Konten halaman statis (beranda, pilar, kemitraan, profil, audit, legalitas) akan direkonstruksi sebagai komponen; teks diambil verbatim.

---

## 9. Rekomendasi Stack & Arsitektur (draft, menunggu persetujuan)

- **Next.js (App Router) + TypeScript + Tailwind CSS**, Server Components default.
- **Strategi konten — dua opsi:**
  - **A. Headless WordPress (direkomendasikan)**: WP tetap jadi CMS di subdomain (mis. `cms.relawannusantara.org`), Next.js membaca REST API dengan ISR/revalidate. Tim redaksi tetap menulis di WP; tidak perlu migrasi ulang setiap ada post baru.
  - **B. Snapshot statis**: ekspor 672 post ke MDX/JSON + media ke storage. Lebih cepat & sederhana, tapi tim kehilangan editor WP.
- Route: `app/[slug]` (post & halaman di root, `generateStaticParams`), `category/[...slug]`, `tag/[slug]`, `artikel`, `berita`, pilar program, `e-report`, `sitemap.ts`, `robots.ts`.
- `/campaign` tetap dilayani app donasi existing (nginx route atau `rewrites`).
- Gambar: `next/image` dengan `remotePatterns` ke host media.

---

## 10. Estimasi Tahapan

| Tahap | Isi | Estimasi |
|---|---|---|
| 1 | Ekstraksi lengkap (URL, konten, media, SEO meta per URL) via script REST API | 1–2 hari |
| 2 | Init project, design tokens, layout (header/footer/floating) | 2 hari |
| 3 | Homepage + pilar program + profil/audit/legalitas/kemitraan/e-report | 4–5 hari |
| 4 | Post detail, listing artikel/berita, kategori, tag, search | 3–4 hari |
| 5 | SEO (metadata, JSON-LD, sitemap, redirect map), analytics | 2 hari |
| 6 | Visual regression (desktop+mobile), QA fungsional, Lighthouse | 3 hari |
| 7 | Deployment staging + dokumentasi | 1–2 hari |

---

## 11. Risiko & Mitigasi

| Risiko | Mitigasi |
|---|---|
| Konten Divi (HTML berat, layout per-post, section duplikat desktop/mobile) | Parser sanitasi + daftar post yang perlu review manual |
| Kehilangan ranking jika URL berubah | Pertahankan 100% slug post & halaman; redirect map 301 untuk halaman test |
| `/campaign` adalah app lain di domain yang sama | Koordinasi routing nginx; jangan ganti tanpa tim pemilik app donasi |
| Teks di dalam gambar banner (tidak terbaca SEO/aksesibilitas) | Pertahankan gambar asli, tambah alt text deskriptif |
| Tim redaksi butuh CMS | Pilih opsi headless WP |
| Akses ekstraksi: sandbox cloud saya **diblokir** ke domain ini; ekstraksi hanya berjalan via browser Anda | Untuk Stage 3: allowlist domain di Settings > Capabilities, atau link-kan komputer (folder `/Project/krn`) agar script berjalan lokal |

---

## 12. Keputusan yang Dibutuhkan

1. Opsi konten: **Headless WP (A)** atau **snapshot statis (B)**?
2. Halaman §3.2 mana yang tetap dipertahankan? Halaman §3.3 boleh di-redirect/410?
3. Slug `/pr0gram-kami/`: pertahankan apa adanya atau redirect ke `/program-kami/`?
4. Perbaikan SEO di §7 (H1, title, meta) boleh diterapkan, atau replikasi persis dulu?
5. Target hosting: Vercel atau VPS existing (nginx yang juga melayani `/campaign`)?
