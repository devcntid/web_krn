# Laporan migrasi WordPress → Next.js

Bagian B (SEO), C (GEO), dan D (pixel dan iklan).

Disusun 24 November 2026 dari kode repositori `web_krn`, crawl lokal 16 November 2026 (`qa/site-check.json`, `docs/FINAL_REPORT.md` §3), dan pemeriksaan HTML publik `https://relawannusantara.org/` pada 24 November 2026.

**Keadaan domain.** Pada 24 November 2026 `relawannusantara.org` masih dilayani WordPress (nginx, cookie `pll_language`, `wp-json`, `sitemap_index.xml`). Build Next.js belum menjadi situs yang dilihat pengunjung. Temuan “di build baru” di bawah adalah kode dan uji lokal, bukan pengukuran domain produksi.

Status tiap butir: **Terpenuhi**, **Sebagian**, **Belum**, atau **Tidak bisa diverifikasi**.

---

## B. SEO

### B1. Baseline Search Console dan halaman teratas WordPress

**Belum. Tidak bisa diverifikasi dari sini.**

Tidak ada ekspor Search Console, daftar kueri, atau daftar halaman teratas di repositori. Audit 13 November (`docs/WEBSITE_AUDIT.md`) dan laporan 16 November tidak memuat angka klik, tayangan, atau URL teratas.

Karena domain masih WordPress, baseline masih bisa diambil sebelum cut-over. Yang perlu diekspor dari properti Search Console (16 bulan terakhir, dan 28 hari terakhir):

- halaman dengan klik terbanyak
- kueri dengan tayangan terbanyak
- cakupan indeks dan sitemap yang sedang dikirim
- peningkatan / tautan balik yang penting

### B2. Redirect 301 URL lama, dan peta di PM-22314

**Sebagian. Tiket PM-22314 tidak bisa dibuka dari sini.**

Permalink posting WordPress (`/%postname%/`) dipertahankan 1:1, termasuk garis miring di akhir. Arsip kategori (`/category/.../`) dan tag (`/tag/.../`, plus `/page/N/`) juga memakai pola yang sama. URL yang slug-nya tidak berubah tidak membutuhkan redirect.

Yang ada sebagai redirect 301 di kode (`src/config/redirects.ts`, ikut `next.config.ts`):

- 16 halaman uji/duplikat WordPress ke halaman resminya (misalnya `/beranda/` → `/`, `/uji-coba-halaman-csr/` → `/kemitraan/`)
- `/pr0gram-kami/{aksi-kemanusiaan|lingkungan|pendidikan|ekonomi}/` → halaman pilar
- sitemap Rank Math (`/sitemap_index.xml`, `post-sitemap.xml`, dan seterusnya) → `/sitemap.xml`
- `/feed/` → `/berita/`, dan `/{slug}/feed/` → `/{slug}/`
- `/id/...` → URL tanpa prefiks bahasa

Diuji lokal 24 November 2026: `/feed/?utm_source=ig&fbclid=abc&gclid=g1&ttclid=t1` menjawab `301` ke `/berita/` dengan parameter yang sama. `/beranda/?gclid=g1` menjawab `301` ke `/?gclid=g1`.

Redirect yang dibuat belakangan di admin (ubah permalink, gabung kategori/tag) masuk tabel `redirects` dan dijalankan proxy. Peta plugin “404 to 301” (abj404) dari WordPress tidak ikut diekspor ke file ini. Isi tiket PM-22314 tidak ada di repositori, jadi belum bisa dicocokkan.

### B3. hreflang Indonesia–Inggris, dan `/en/` yang belum diterjemahkan tetap noindex

**Terpenuhi di kode, dan diuji lokal untuk sampel.**

Beranda mengirim:

- `hreflang="id"` → `https://relawannusantara.org/`
- `hreflang="en"` → `https://relawannusantara.org/en/`
- `hreflang="x-default"` → URL Indonesia

Halaman yang masuk daftar terjemahan (`src/i18n/translated.ts`) ikut di sitemap beserta versi `/en/`: beranda, profil, audit, legalitas, empat pilar, program (termasuk kerelawanan dan kebencanaan), kemitraan, e-report.

Diuji lokal: `/en/bantuan-makanan-pasien-terdampak-konflik-sudan/` berisi `noindex, follow` dan canonical ke URL Indonesia, tanpa hreflang. Arsip kategori versi `/en/` juga `noindex`. Arsip tag `noindex` di kedua bahasa (sama seperti WordPress: tag tidak masuk sitemap). Pencarian `noindex`.

Posting hanya dianggap “sudah diterjemahkan” bila status terjemahannya `reviewed`. Sebelum itu, `/en/{slug}/` tetap `noindex`.

### B4. Satu tautan rusak dan tiga gambar hilang (FINAL_REPORT §3)

**Belum ditangani, dan belum ada keputusan.**

Crawl 16 November 2026 (`qa/site-check.json`, 754 URL sitemap, diukur di `localhost`, bukan domain publik) masih mencatat empat sisa ini. File konten hasil ekspor juga masih memuatnya. Tidak ada catatan bahwa tautan atau gambar itu sudah diperbaiki atau sengaja dibiarkan.

| Jenis | Lokasi | Keadaan |
|---|---|---|
| Tautan | `/relawan-nusantara-salurkan-paket-pangan-spesial-hari-guru-untuk-pahlawan-tanpa-tanda-jasa-di-lombok-timur/` | `href` berisi satu paragraf teks, bukan URL. Mengarah ke 404. |
| Gambar | `/sedekah-buka-puasa-di-sukasari-bandung-relawan-nusantara-salurkan-paket-untuk-warga/` | `2026/03/IMG_1429_11zon-scaled.jpg` sudah 404 di WordPress saat ekspor |
| Gambar | `/dam-karena-melanggar-larangan-ihram-pengertian-jenis-dan-ketentuannya/` | `2025/04/ALBAWABA-The-Hajj-pilgrimage-….jpeg` sudah 404 saat ekspor |
| Gambar | `/menyambut-ramadan-dengan-hati-dan-persiapan-terbaik/` | `2025/02/Anti-Islam-Movement-Has-New-Rallying-Cry-….jpg` sudah 404 saat ekspor |

Dokumen GS-24639 tidak ada sebagai berkas terpisah di repositori. Butir ini merujuk §3 `docs/FINAL_REPORT.md`.

---

## C. GEO (terbaca mesin AI)

### C1. robots.txt dan hosting tidak memblokir GPTBot, ClaudeBot, PerplexityBot, Google-Extended

**Sebagian. Aturan firewall hosting Next.js tidak bisa diperiksa.**

`src/app/robots.ts` untuk produksi: `User-Agent: *` boleh membaca `/`, kecuali `/search/`, plus baris sitemap. Tidak ada larangan khusus untuk GPTBot, ClaudeBot, PerplexityBot, atau Google-Extended. `User-Agent: *` mencakup keempatnya selama tidak ada berkas robots lain.

Di domain yang masih WordPress (24 November 2026), `robots.txt` hanya menutup `/wp-admin/` dan mengizinkan `admin-ajax.php`. Permintaan beranda dengan user-agent `GPTBot/1.2` mendapat HTTP 200. ClaudeBot dan PerplexityBot tidak diuji satu per satu. Pengaturan bot Nginx, Wordfence, atau firewall Vercel untuk deployment Next.js tidak terlihat dari kode.

Preview Vercel (bukan produksi) memang `Disallow: /` untuk semua bot. Itu hanya berlaku di lingkungan preview.

### C2. Profil, program, FAQ, dan kontak ada sebagai teks

**Sebagian. FAQ tidak ada.**

| Isi | Di build Next.js |
|---|---|
| Profil lembaga | Halaman `/profil-relawan-nusantara/` berupa section teks, bukan satu gambar. |
| Program | Empat pilar dan halaman program memuat judul serta deskripsi sebagai teks. |
| Kontak | Footer memuat nomor WhatsApp, email, dan alamat sebagai teks. Tombol “Tanya Saffa” adalah gambar yang menaut ke WhatsApp. |
| FAQ | Tidak ada halaman FAQ dan tidak ada data `FAQPage`. |
| Beranda | Slider adalah gambar. Di bawahnya, pengantar, angka jejak sebaran, pilar, judul publikasi, kutipan testimoni, dan ajakan laporan adalah teks. Judul halaman ada sebagai satu H1 untuk pembaca layar. |
| Data terstruktur | `NGO`, `WebSite` + `SearchAction`, `BlogPosting`, dan `BreadcrumbList`. `NGO` memuat nama, URL, logo, dan deskripsi. Alamat, telepon, dan email ada di HTML footer, belum di JSON-LD. |

---

## D. Pixel dan iklan

### D1. GA4 dan Meta Pixel aktif di produksi dan menembak PageView di setiap pindah halaman

**Sebagian. Belum terbukti di build yang dilihat pengunjung. PageView antar-halaman belum lengkap.**

Pada 16 November, build uji memang tidak memuat kedua skrip (`docs/FINAL_REPORT.md`). Di kode sekarang keduanya dipasang lewat `src/components/layout/Analytics.tsx`, dan hanya menyala bila tiga syarat terpenuhi: ID terisi, `NODE_ENV=production`, dan lingkungan Vercel adalah produksi. Lokal dan preview tidak mengirim data.

ID di `.env.example` sama dengan yang sedang berjalan di WordPress hari ini:

- GA4 `G-V2B0DLDRX6`
- Meta Pixel `362997751405076` (`fbq('init', …)` lalu `fbq('track','PageView')`)

Environment produksi Vercel tidak bisa dibaca dari sini, jadi belum terbukti ID itu benar-benar terpasang di deployment Next.js.

PageView saat ini hanya terkirim saat dokumen dimuat penuh. Pindah halaman di dalam situs (navigasi Next.js tanpa muat ulang) tidak mengirim `page_view` GA4 baru dan tidak mengirim `PageView` Meta baru. Tidak ada pemantau perubahan alamat di komponen analytics.

### D2. Google Tag Manager

**Belum terpasang di build baru. Di WordPress yang hidup hari ini juga tidak ada kontainer GTM.**

HTML beranda WordPress pada 24 November 2026 memuat `gtag` dan Meta Pixel, bukan `gtm.js` dan bukan ID `GTM-…`. Site Kit di audit 13 November memasang Analytics; pada pengukuran ini ia tidak memasang kontainer Tag Manager.

Build Next.js juga tidak memuat GTM. Tag yang ada dipasang langsung di kode (GA4 dan Meta). Akibatnya, tim iklan tidak bisa menambah tag tanpa perubahan kode.

Alasan yang bisa ditulis bila GTM memang tidak dipakai: Site Kit saat ini sudah jalan lewat gtag langsung, dan build baru mengikuti pola yang sama. Itu hanya cukup bila seluruh tag (termasuk Google Ads di D3) ikut dipasang di kode.

### D3. Event konversi dan tag lain dari tiket Iqbal

**Sebagian. Tiket Iqbal tidak bisa dibuka.**

Yang ada di build Next.js, dan hanya ke GA4:

- `donate_click` saat klik tautan yang diawali `/campaign`, `/donasi`, atau `/prog`
- `whatsapp_click` saat klik tautan `wa.me` atau `api.whatsapp.com`

Meta hanya menerima `PageView`. Tidak ada event standar Meta (`Lead`, `Donate`, dan sejenisnya). Tidak ada TikTok Pixel.

Yang ada di WordPress hari ini dan belum ada di build Next.js:

- tag Google Ads `AW-16452587600` (muncul dua kali di HTML beranda)

Daftar event di tiket Iqbal tidak ada di repositori, jadi belum bisa dicentang satu per satu.

### D4. UTM, fbclid, ttclid, dan gclid tidak hilang setelah redirect

**Sebagian. Redirect statis mempertahankan parameter. Redirect dinamis di proxy tidak.**

Diuji lokal 24 November 2026 pada redirect `next.config` (`/feed/`, `/beranda/`, `/id/berita/`): `utm_source`, `utm_medium`, `fbclid`, `gclid`, dan `ttclid` ikut di header `Location`.

Pencarian `/?s=kata&utm_source=…` tidak dialihkan; parameter tetap di URL (jawaban 200).

Redirect dinamis (tabel `redirects` / Edge Config, di `src/proxy.ts`) membuat URL tujuan baru tanpa menyalin query string. `utm_*`, `fbclid`, `ttclid`, dan `gclid` hilang pada redirect jenis ini. Redirect halaman-depan (pengaturan “halaman depan”) menyalin query string; itu jalur yang terpisah.

`Referrer-Policy: strict-origin-when-cross-origin` tidak menghapus parameter dari URL halaman ini. Parameter hilang hanya bila redirect-nya tidak menuliskannya kembali.

Belum diuji di domain publik, karena domain itu masih WordPress.

---

## Yang tidak bisa diakses

- Google Search Console (properti, halaman teratas, cakupan).
- Tiket PM-22314 (peta redirect lama).
- Dokumen GS-24639 sebagai berkas sendiri. Isinya yang dirujuk ada di `docs/FINAL_REPORT.md` §3 dan `qa/site-check.json`.
- Tiket Iqbal (daftar event dan tag iklan).
- Environment Vercel produksi (apakah `NEXT_PUBLIC_GA_ID` dan `NEXT_PUBLIC_META_PIXEL_ID` terisi).
- Firewall atau bot protection Vercel / Nginx di luar `robots.txt`.
- Database produksi (isi tabel `redirects` yang ditambah admin setelah seed).

## Yang perlu dikonfirmasi

1. Siapa yang mengekspor baseline Search Console sebelum cut-over, dan ke mana berkasnya disimpan?
2. Bolehkah peta PM-22314 dibagikan, supaya dicocokkan dengan `src/config/redirects.ts`? Redirect abj404 yang tidak ikut slug 1:1 belum ada di kode.
3. Empat sisa §3: tautan di artikel Hari Guru diperbaiki, dan tiga gambar dihapus dari artikel, atau dibiarkan karena filenya sudah hilang sejak WordPress?
4. Apakah FAQ memang tidak ada di situs lama, atau ada halaman yang terlewat?
5. GTM: pasang kontainer di build baru, atau cukup gtag langsung seperti Site Kit hari ini?
6. Apakah tag Google Ads `AW-16452587600` harus ikut ke build baru, dan event apa saja yang disebut di tiket Iqbal?
7. Apakah PageView wajib terkirim pada setiap pindah halaman tanpa muat ulang? Saat ini hanya terkirim saat halaman dimuat penuh.
8. Setelah cut-over, konfirmasi bahwa environment produksi Vercel memakai ID GA4 dan Pixel yang sama dengan WordPress, dan firewall tidak menolak GPTBot, ClaudeBot, PerplexityBot, serta Google-Extended.
