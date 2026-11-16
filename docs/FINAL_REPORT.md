# FINAL_REPORT

Laporan akhir rekonstruksi relawannusantara.org ke Next.js. Bagian Backend, Deploy, dan ringkasan
kesiapan diisi pada prompt B16 dan D3 (`docs/BUILD_PLAYBOOK.md`).

## Frontend

Diukur 16 Nov 2026 pada build produksi lokal (`next build` + `next start`, media dari
`public/wp-content/uploads`, tanpa CDN). Angka di Vercel akan berbeda — ukur ulang di preview
sebelum cut-over.

> **Batasan pengukuran:** build uji tidak memuat `NEXT_PUBLIC_GA_ID` dan `NEXT_PUBLIC_META_PIXEL_ID`,
> jadi skrip GA4 dan Meta Pixel **tidak ikut terukur**. Di produksi keduanya aktif dan akan
> menambah JavaScript pihak ketiga; skor Performance produksi kemungkinan lebih rendah dari tabel ini.

### 1. Lighthouse (v13.6, satu kali jalan per halaman)

Target: Performance ≥90 · Accessibility ≥95 · Best Practices ≥95 · SEO ≥95 · CLS <0,1 · LCP <2,5 dtk.

**Sesudah perbaikan**

| Halaman | Mode | Perf | A11y | BP | SEO | LCP | CLS | TBT |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| `/` | mobile | 90 | 100 | 100 | 100 | **3,69 dtk** | 0,001 | 41 md |
| `/` | desktop | 99 | 100 | 100 | 100 | 0,90 dtk | 0,000 | 0 md |
| Post (`/bantuan-makanan-pasien-terdampak-konflik-sudan/`) | mobile | 94 | 100 | 100 | 100 | **3,15 dtk** | 0,000 | 43 md |
| Post | desktop | 98 | 100 | 100 | 100 | 1,12 dtk | 0,000 | 0 md |
| `/berita/` | mobile | **89** | 100 | 100 | 100 | **3,59 dtk** | 0,000 | 135 md |
| `/berita/` | desktop | 99 | 100 | 100 | 100 | 0,98 dtk | 0,000 | 0 md |
| `/kemitraan/` | mobile | 91 | 100 | 100 | 100 | **3,54 dtk** | 0,001 | 33 md |
| `/kemitraan/` | desktop | 99 | 100 | 100 | 100 | 1,03 dtk | 0,001 | 0 md |

**Sebelum perbaikan**

| Halaman | Mode | Perf | A11y | BP | SEO | LCP | CLS |
|---|---|---:|---:|---:|---:|---:|---:|
| `/` | mobile | 84 | 89 | 100 | 100 | 4,01 dtk | 0,000 |
| `/` | desktop | 99 | 89 | 100 | 100 | 0,89 dtk | 0,000 |
| Post | mobile | 90 | 96 | 100 | 100 | 3,69 dtk | 0,000 |
| Post | desktop | 98 | 96 | 100 | 100 | 1,18 dtk | 0,000 |
| `/berita/` | mobile | 88 | 96 | 100 | 100 | 3,90 dtk | 0,000 |
| `/berita/` | desktop | 98 | 96 | 100 | 100 | 1,08 dtk | 0,000 |
| `/kemitraan/` | mobile | 88 | 96 | 100 | 100 | 3,86 dtk | 0,000 |
| `/kemitraan/` | desktop | 98 | 96 | 100 | 100 | 1,14 dtk | 0,000 |

Ringkasan mentah: `qa/lighthouse/before.json`, `qa/lighthouse/after.json`.

**Status terhadap target**

- **Tercapai di semua halaman dan mode:** Accessibility, Best Practices, SEO, CLS.
- **Tercapai di desktop:** Performance dan LCP.
- **Belum tercapai di mobile:** LCP 3,2–3,7 dtk (target 2,5) di keempat halaman, dan Performance
  `/berita/` 89 (target 90; tiga halaman lain 90–94). Skor mobile Lighthouse berfluktuasi beberapa
  poin antar-jalan, jadi angka 89–91 belum bisa dianggap pasti lolos atau gagal.

Catatan LCP mobile: angka di atas adalah LCP *simulasi* (4G lambat + CPU 4× lebih lambat). Pada
pengukuran yang sama, LCP teramati tanpa pelambatan adalah 0,1–0,6 dtk dan gambar LCP hanya
16–39 KB (AVIF). Server lokal `next start` melayani HTTP/1.1 tanpa CDN; pengaruhnya terhadap angka
simulasi belum diukur, jadi LCP mobile perlu diukur ulang di preview Vercel sebelum dinyatakan
lolos atau tidak.

### 2. Perbaikan yang dilakukan

| Area | Perubahan |
|---|---|
| Font preload | Dari 14 file font di-preload menjadi 3 (Poppins 400/600/700). Bobot Poppins lain dan Manrope (footer) tetap satu family tetapi dimuat saat dipakai — `src/app/fonts.ts`. |
| Prioritas LCP | Gambar hero (`PageHero`, slide pertama beranda) diberi `preload` + `fetchPriority="high"`; slider yang tersembunyi di breakpoint lain memakai `sizes` 1px agar tidak ikut diunduh penuh. |
| Ukuran gambar | Gambar di dalam isi artikel (tag `<img>` hasil ekspor, sering 2560px) kini lewat optimizer Next dengan `srcset` + `sizes` — `optimizeContentImages()` di `src/lib/media.ts`. Di halaman post contoh, dua gambar isi turun dari ±830 KB menjadi ±48 KB. |
| Kontras | Teks footer (#A5A49A di atas krem, 2,3:1) → `muted-strong` #706E64; tanggal footer → `accent-700` #8F5D00; peran testimoni → `primary-500` #1A7368; tombol "Mari Berdonasi" di akhir post memakai teks gelap (putih di atas kuning hanya 1,7:1). |
| Struktur & label | Statistik beranda dari `<dl>` yang tidak valid menjadi daftar biasa; ikon LinkedIn menjadi SVG (nama aksesibel sebelumnya tidak cocok dengan teks "in"). |
| JS client | Tidak ada komponen client yang perlu dihapus: video YouTube sudah memakai facade (iframe baru dimuat saat diklik). Sisa "unused JavaScript" ±28 KB berasal dari satu chunk bawaan build. |

Dampak samping yang perlu diketahui: gambar isi artikel sekarang ikut memakai kuota Image
Optimization Vercel (sebelumnya hanya gambar utama dan komponen).

### 3. Validasi SEO & tautan (`npm run check:site`)

Skrip meng-crawl **semua 741 URL di sitemap** pada build produksi. Hasil akhir (`qa/site-check.json`):

| Pemeriksaan | Hasil |
|---|---|
| Status HTTP 200 | 741 / 741 |
| Tepat satu `<h1>`, title, dan meta description | 741 / 741 |
| Canonical = URL sitemap | 741 / 741 |
| Halaman `noindex` di sitemap | 0 |
| `robots.txt` (aturan + baris Sitemap) | sesuai |
| JSON-LD bisa di-parse | 741 / 741 |
| JSON-LD organisasi (`NGO`) | 741 halaman (ditambah `Organization` Rank Math di 670 post) |
| `WebSite` + `SearchAction` | beranda |
| `BlogPosting` | 670 / 670 post |
| `BreadcrumbList` | 70 / 70 halaman & arsip kategori di sitemap (termasuk `/berita/` dan `/artikel/`) |
| Tautan internal di luar sitemap | 102 diperiksa → **1 rusak** |
| Gambar | 1.790 diperiksa → **3 rusak** |
| Tautan ke aplikasi donasi (`/campaign`, `/donasi`, `/prog…`) | 3.695 — tidak diperiksa (dilayani aplikasi terpisah) |

Ditemukan crawl pertama dan sudah diperbaiki:

- Satu post 404 karena slug memuat karakter Arab ter-encode (`teladan-rasulullah-%ef%b7%ba-…`).
- `BreadcrumbList` belum ada di `/berita/` dan `/artikel/`.
- Tujuh tautan di artikel diketik dengan spasi di depan URL sehingga mengarah ke alamat yang salah.
- Tautan sisa modul blog Divi di halaman lama (arsip penulis `/author/…`, pagination `/…/page/N/`).

Masih tersisa (perlu perbaikan di konten, bukan kode):

- **1 tautan rusak** di post `relawan-nusantara-salurkan-paket-pangan-spesial-hari-guru-…`: atribut
  `href` berisi satu paragraf teks artikel, bukan URL.
- **3 gambar hilang** — file-nya sudah 404 di WordPress saat ekspor:
  `2026/03/IMG_1429_11zon-scaled.jpg`, `2025/04/ALBAWABA-The-Hajj-pilgrimage-…​.jpeg`,
  `2025/02/Anti-Islam-Movement-Has-New-Rallying-Cry-…​.jpg`.

Validasi JSON-LD di atas memeriksa keberadaan tipe dan sintaks; belum diuji dengan Rich Results
Test Google.

### 4. Perbandingan visual

Lihat `docs/VISUAL_QA_REPORT.md` (`npm run visual:compare`).

### 5. Pemeriksaan konten

`npm run check:content` → `content/check-report.json`: 8 post tanpa gambar utama (sebelumnya 21;
13 dipulihkan dari `og:image`), 1.335 gambar tanpa teks alt di 418 dokumen, 4 post dengan isi
kosong.

### 6. Cara mengulang pengukuran

```bash
npm run build && npm start                      # http://localhost:3000
npm run check:site                              # crawl sitemap, SEO, tautan, gambar
npm run check:content                           # pemeriksaan konten hasil ekspor
npm run visual:compare                          # WordPress vs Next.js
npx lighthouse http://localhost:3000/ --view    # tambah --preset=desktop untuk desktop
```
