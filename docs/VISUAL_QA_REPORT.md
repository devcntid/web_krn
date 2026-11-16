# VISUAL_QA_REPORT

Perbandingan visual WordPress vs Next.js (`npm run visual:compare`, daftar URL: `docs/visual-urls.txt`).

## Hasil otomatis

<!-- visual:auto:start -->
_Dijalankan 2026-11-16 04:46 UTC · WordPress: https://relawannusantara.org · Next.js: http://localhost:3111_

### Ringkasan (persen piksel berbeda — makin kecil makin mirip)

| URL | 1440px | 1280px | 768px | 390px | 360px |
|---|---:|---:|---:|---:|---:|
| `/` | 34.3% | 45.1% | 67.2% | 58.1% | 57.2% |
| `/profil-relawan-nusantara/` | 30.9% | 32.5% | 36.8% | 32.3% | 33.3% |
| `/audit-keuangan/` | 59.2% | 58.0% | 44.8% | 18.5% | 19.4% |
| `/asas-legalitas/` | 42.6% | 45.1% | 43.9% | 34.8% | 34.3% |
| `/aksi-kemanusiaan/` | 52.3% | 49.4% | 68.0% | 62.5% | 59.9% |
| `/lingkungan/` | 56.1% | 55.6% | 78.5% | 59.2% | 54.2% |
| `/pr0gram-kami/` | 41.8% | 41.8% | 68.1% | 46.8% | 44.0% |
| `/kemitraan/` | 44.1% | 43.1% | 41.3% | 48.4% | 46.1% |
| `/e-report/` | 72.2% | 75.6% | 64.1% | 66.3% | 64.4% |
| `/berita/` | 39.7% | 38.9% | 48.2% | 52.7% | 51.0% |
| `/artikel/` | 39.9% | 38.4% | 47.8% | 53.1% | 51.8% |
| `/bantuan-makanan-pasien-terdampak-konflik-sudan/` | 34.0% | 38.5% | 51.9% | 34.6% | 33.6% |
| `/category/sudan/` | 71.7% | 72.2% | 71.7% | 44.4% | 40.9% |
| `/?s=sudan` | 66.0% | 67.2% | 57.0% | 57.2% | 53.5% |
| `/fidyah/` | 58.8% | 58.7% | 73.7% | 62.1% | 63.7% |
| `/halaman-yang-tidak-ada/` | 85.7% | 83.6% | 86.0% | 78.4% | 78.5% |

### Rincian

| URL | Viewport | Skor beda | Tinggi WP → Next | Catatan | Screenshot |
|---|---:|---:|---|---|---|
| `/` | 1440 | 34.3% | 5361 → 5161px | tinggi Next -4% (5361→5161px) | `qa/screenshots/beranda-1440.jpg` |
| `/` | 1280 | 45.1% | 5288 → 5059px | tinggi Next -4% (5288→5059px) | `qa/screenshots/beranda-1280.jpg` |
| `/` | 768 | 67.2% | 6104 → 4979px | tinggi Next -18% (6104→4979px) | `qa/screenshots/beranda-768.jpg` |
| `/` | 390 | 58.1% | 6076 → 5110px | tinggi Next -16% (6076→5110px) | `qa/screenshots/beranda-390.jpg` |
| `/` | 360 | 57.2% | 6178 → 5154px | tinggi Next -17% (6178→5154px) | `qa/screenshots/beranda-360.jpg` |
| `/profil-relawan-nusantara/` | 1440 | 30.9% | 2669 → 2686px | – | `qa/screenshots/profil-relawan-nusantara-1440.jpg` |
| `/profil-relawan-nusantara/` | 1280 | 32.5% | 2660 → 2699px | – | `qa/screenshots/profil-relawan-nusantara-1280.jpg` |
| `/profil-relawan-nusantara/` | 768 | 36.8% | 3397 → 3739px | tinggi Next +10% (3397→3739px) | `qa/screenshots/profil-relawan-nusantara-768.jpg` |
| `/profil-relawan-nusantara/` | 390 | 32.3% | 3594 → 4180px | tinggi Next +16% (3594→4180px) | `qa/screenshots/profil-relawan-nusantara-390.jpg` |
| `/profil-relawan-nusantara/` | 360 | 33.3% | 3738 → 4414px | tinggi Next +18% (3738→4414px) | `qa/screenshots/profil-relawan-nusantara-360.jpg` |
| `/audit-keuangan/` | 1440 | 59.2% | 3631 → 2211px | tinggi Next -39% (3631→2211px) | `qa/screenshots/audit-keuangan-1440.jpg` |
| `/audit-keuangan/` | 1280 | 58.0% | 3604 → 2245px | tinggi Next -38% (3604→2245px) | `qa/screenshots/audit-keuangan-1280.jpg` |
| `/audit-keuangan/` | 768 | 44.8% | 3528 → 2820px | tinggi Next -20% (3528→2820px) | `qa/screenshots/audit-keuangan-768.jpg` |
| `/audit-keuangan/` | 390 | 18.5% | 3217 → 3236px | – | `qa/screenshots/audit-keuangan-390.jpg` |
| `/audit-keuangan/` | 360 | 19.4% | 3272 → 3317px | – | `qa/screenshots/audit-keuangan-360.jpg` |
| `/asas-legalitas/` | 1440 | 42.6% | 2079 → 2320px | tinggi Next +12% (2079→2320px) | `qa/screenshots/asas-legalitas-1440.jpg` |
| `/asas-legalitas/` | 1280 | 45.1% | 2079 → 2450px | tinggi Next +18% (2079→2450px) | `qa/screenshots/asas-legalitas-1280.jpg` |
| `/asas-legalitas/` | 768 | 43.9% | 2655 → 3227px | tinggi Next +22% (2655→3227px) | `qa/screenshots/asas-legalitas-768.jpg` |
| `/asas-legalitas/` | 390 | 34.8% | 3367 → 4278px | tinggi Next +27% (3367→4278px) | `qa/screenshots/asas-legalitas-390.jpg` |
| `/asas-legalitas/` | 360 | 34.3% | 3526 → 4452px | tinggi Next +26% (3526→4452px) | `qa/screenshots/asas-legalitas-360.jpg` |
| `/aksi-kemanusiaan/` | 1440 | 52.3% | 3784 → 3191px | tinggi Next -16% (3784→3191px) | `qa/screenshots/aksi-kemanusiaan-1440.jpg` |
| `/aksi-kemanusiaan/` | 1280 | 49.4% | 3767 → 3301px | tinggi Next -12% (3767→3301px) | `qa/screenshots/aksi-kemanusiaan-1280.jpg` |
| `/aksi-kemanusiaan/` | 768 | 68.0% | 5683 → 3794px | tinggi Next -33% (5683→3794px) | `qa/screenshots/aksi-kemanusiaan-768.jpg` |
| `/aksi-kemanusiaan/` | 390 | 62.5% | 6354 → 4399px | tinggi Next -31% (6354→4399px) | `qa/screenshots/aksi-kemanusiaan-390.jpg` |
| `/aksi-kemanusiaan/` | 360 | 59.9% | 6276 → 4613px | tinggi Next -26% (6276→4613px) | `qa/screenshots/aksi-kemanusiaan-360.jpg` |
| `/lingkungan/` | 1440 | 56.1% | 3753 → 3189px | tinggi Next -15% (3753→3189px) | `qa/screenshots/lingkungan-1440.jpg` |
| `/lingkungan/` | 1280 | 55.6% | 3697 → 3233px | tinggi Next -13% (3697→3233px) | `qa/screenshots/lingkungan-1280.jpg` |
| `/lingkungan/` | 768 | 78.5% | 6138 → 3534px | tinggi Next -42% (6138→3534px) | `qa/screenshots/lingkungan-768.jpg` |
| `/lingkungan/` | 390 | 59.2% | 5391 → 4152px | tinggi Next -23% (5391→4152px) | `qa/screenshots/lingkungan-390.jpg` |
| `/lingkungan/` | 360 | 54.2% | 5381 → 4341px | tinggi Next -19% (5381→4341px) | `qa/screenshots/lingkungan-360.jpg` |
| `/pr0gram-kami/` | 1440 | 41.8% | 5553 → 5286px | tinggi Next -5% (5553→5286px) | `qa/screenshots/pr0gram-kami-1440.jpg` |
| `/pr0gram-kami/` | 1280 | 41.8% | 5424 → 5262px | – | `qa/screenshots/pr0gram-kami-1280.jpg` |
| `/pr0gram-kami/` | 768 | 68.1% | 9285 → 5451px | tinggi Next -41% (9285→5451px); dipotong di 8000px | `qa/screenshots/pr0gram-kami-768.jpg` |
| `/pr0gram-kami/` | 390 | 46.8% | 7407 → 7607px | – | `qa/screenshots/pr0gram-kami-390.jpg` |
| `/pr0gram-kami/` | 360 | 44.0% | 7353 → 7672px | tinggi Next +4% (7353→7672px) | `qa/screenshots/pr0gram-kami-360.jpg` |
| `/kemitraan/` | 1440 | 44.1% | 5374 → 5108px | tinggi Next -5% (5374→5108px) | `qa/screenshots/kemitraan-1440.jpg` |
| `/kemitraan/` | 1280 | 43.1% | 5303 → 5110px | tinggi Next -4% (5303→5110px) | `qa/screenshots/kemitraan-1280.jpg` |
| `/kemitraan/` | 768 | 41.3% | 6695 → 6452px | tinggi Next -4% (6695→6452px) | `qa/screenshots/kemitraan-768.jpg` |
| `/kemitraan/` | 390 | 48.4% | 6774 → 7991px | tinggi Next +18% (6774→7991px) | `qa/screenshots/kemitraan-390.jpg` |
| `/kemitraan/` | 360 | 46.1% | 6998 → 8131px | tinggi Next +16% (6998→8131px); dipotong di 8000px | `qa/screenshots/kemitraan-360.jpg` |
| `/e-report/` | 1440 | 72.2% | 4665 → 8718px | tinggi Next +87% (4665→8718px); dipotong di 8000px | `qa/screenshots/e-report-1440.jpg` |
| `/e-report/` | 1280 | 75.6% | 4470 → 8507px | tinggi Next +90% (4470→8507px); dipotong di 8000px | `qa/screenshots/e-report-1280.jpg` |
| `/e-report/` | 768 | 64.1% | 8997 → 12016px | tinggi Next +34% (8997→12016px); dipotong di 8000px | `qa/screenshots/e-report-768.jpg` |
| `/e-report/` | 390 | 66.3% | 16625 → 9228px | tinggi Next -44% (16625→9228px); dipotong di 8000px | `qa/screenshots/e-report-390.jpg` |
| `/e-report/` | 360 | 64.4% | 15647 → 9119px | tinggi Next -42% (15647→9119px); dipotong di 8000px | `qa/screenshots/e-report-360.jpg` |
| `/berita/` | 1440 | 39.7% | 3426 → 3258px | tinggi Next -5% (3426→3258px) | `qa/screenshots/berita-1440.jpg` |
| `/berita/` | 1280 | 38.9% | 3382 → 3275px | tinggi Next -3% (3382→3275px) | `qa/screenshots/berita-1280.jpg` |
| `/berita/` | 768 | 48.2% | 4861 → 4469px | tinggi Next -8% (4861→4469px) | `qa/screenshots/berita-768.jpg` |
| `/berita/` | 390 | 52.7% | 7056 → 6212px | tinggi Next -12% (7056→6212px) | `qa/screenshots/berita-390.jpg` |
| `/berita/` | 360 | 51.0% | 7039 → 6132px | tinggi Next -13% (7039→6132px) | `qa/screenshots/berita-360.jpg` |
| `/artikel/` | 1440 | 39.9% | 3401 → 3234px | tinggi Next -5% (3401→3234px) | `qa/screenshots/artikel-1440.jpg` |
| `/artikel/` | 1280 | 38.4% | 3407 → 3299px | tinggi Next -3% (3407→3299px) | `qa/screenshots/artikel-1280.jpg` |
| `/artikel/` | 768 | 47.8% | 4837 → 4421px | tinggi Next -9% (4837→4421px) | `qa/screenshots/artikel-768.jpg` |
| `/artikel/` | 390 | 53.1% | 7007 → 6139px | tinggi Next -12% (7007→6139px) | `qa/screenshots/artikel-390.jpg` |
| `/artikel/` | 360 | 51.8% | 6893 → 6084px | tinggi Next -12% (6893→6084px) | `qa/screenshots/artikel-360.jpg` |
| `/bantuan-makanan-pasien-terdampak-konflik-sudan/` | 1440 | 34.0% | 3624 → 3792px | tinggi Next +5% (3624→3792px) | `qa/screenshots/bantuan-makanan-pasien-terdampak-konflik-sudan-1440.jpg` |
| `/bantuan-makanan-pasien-terdampak-konflik-sudan/` | 1280 | 38.5% | 3622 → 3826px | tinggi Next +6% (3622→3826px) | `qa/screenshots/bantuan-makanan-pasien-terdampak-konflik-sudan-1280.jpg` |
| `/bantuan-makanan-pasien-terdampak-konflik-sudan/` | 768 | 51.9% | 6439 → 5990px | tinggi Next -7% (6439→5990px) | `qa/screenshots/bantuan-makanan-pasien-terdampak-konflik-sudan-768.jpg` |
| `/bantuan-makanan-pasien-terdampak-konflik-sudan/` | 390 | 34.6% | 6542 → 6477px | – | `qa/screenshots/bantuan-makanan-pasien-terdampak-konflik-sudan-390.jpg` |
| `/bantuan-makanan-pasien-terdampak-konflik-sudan/` | 360 | 33.6% | 6707 → 6593px | – | `qa/screenshots/bantuan-makanan-pasien-terdampak-konflik-sudan-360.jpg` |
| `/category/sudan/` | 1440 | 71.7% | 5305 → 2549px | tinggi Next -52% (5305→2549px) | `qa/screenshots/category-sudan-1440.jpg` |
| `/category/sudan/` | 1280 | 72.2% | 5185 → 2565px | tinggi Next -51% (5185→2565px) | `qa/screenshots/category-sudan-1280.jpg` |
| `/category/sudan/` | 768 | 71.7% | 5591 → 3354px | tinggi Next -40% (5591→3354px) | `qa/screenshots/category-sudan-768.jpg` |
| `/category/sudan/` | 390 | 44.4% | 5650 → 5337px | tinggi Next -6% (5650→5337px) | `qa/screenshots/category-sudan-390.jpg` |
| `/category/sudan/` | 360 | 40.9% | 5774 → 5322px | tinggi Next -8% (5774→5322px) | `qa/screenshots/category-sudan-360.jpg` |
| `/?s=sudan` | 1440 | 66.0% | 4414 → 2689px | tinggi Next -39% (4414→2689px) | `qa/screenshots/s-sudan-1440.jpg` |
| `/?s=sudan` | 1280 | 67.2% | 4325 → 2681px | tinggi Next -38% (4325→2681px) | `qa/screenshots/s-sudan-1280.jpg` |
| `/?s=sudan` | 768 | 57.0% | 4830 → 4031px | tinggi Next -17% (4830→4031px) | `qa/screenshots/s-sudan-768.jpg` |
| `/?s=sudan` | 390 | 57.2% | 5021 → 6472px | tinggi Next +29% (5021→6472px) | `qa/screenshots/s-sudan-390.jpg` |
| `/?s=sudan` | 360 | 53.5% | 5163 → 6453px | tinggi Next +25% (5163→6453px) | `qa/screenshots/s-sudan-360.jpg` |
| `/fidyah/` | 1440 | 58.8% | 4353 → 3150px | tinggi Next -28% (4353→3150px) | `qa/screenshots/fidyah-1440.jpg` |
| `/fidyah/` | 1280 | 58.7% | 4077 → 3184px | tinggi Next -22% (4077→3184px) | `qa/screenshots/fidyah-1280.jpg` |
| `/fidyah/` | 768 | 73.7% | 6130 → 3325px | tinggi Next -46% (6130→3325px) | `qa/screenshots/fidyah-768.jpg` |
| `/fidyah/` | 390 | 62.1% | 5018 → 4915px | – | `qa/screenshots/fidyah-390.jpg` |
| `/fidyah/` | 360 | 63.7% | 4965 → 4892px | – | `qa/screenshots/fidyah-360.jpg` |
| `/halaman-yang-tidak-ada/` | 1440 | 85.7% | 5361 → 1248px | tinggi Next -77% (5361→1248px) | `qa/screenshots/halaman-yang-tidak-ada-1440.jpg` |
| `/halaman-yang-tidak-ada/` | 1280 | 83.6% | 5288 → 1282px | tinggi Next -76% (5288→1282px) | `qa/screenshots/halaman-yang-tidak-ada-1280.jpg` |
| `/halaman-yang-tidak-ada/` | 768 | 86.0% | 6104 → 1504px | tinggi Next -75% (6104→1504px) | `qa/screenshots/halaman-yang-tidak-ada-768.jpg` |
| `/halaman-yang-tidak-ada/` | 390 | 78.4% | 6076 → 2017px | tinggi Next -67% (6076→2017px) | `qa/screenshots/halaman-yang-tidak-ada-390.jpg` |
| `/halaman-yang-tidak-ada/` | 360 | 78.5% | 6178 → 2153px | tinggi Next -65% (6178→2153px) | `qa/screenshots/halaman-yang-tidak-ada-360.jpg` |
<!-- visual:auto:end -->

## Cara membaca skor

Skor adalah persen piksel yang berbeda pada tangkapan halaman penuh, **bukan** ukuran kualitas.
Skor tinggi di hampir semua halaman memang diharapkan, karena:

- Sebagian besar halaman sengaja dirancang ulang mengikuti kanvas desain (`design/`), bukan
  disalin piksel-per-piksel dari WordPress — tata letak, tinggi hero, dan susunan bagian berbeda.
- Pergeseran vertikal beberapa piksel saja membuat seluruh bagian di bawahnya terhitung berbeda.
- Konten WordPress terus berubah (slide hero, publikasi terbaru) dan carousel berhenti di slide
  yang berbeda.

Karena itu skor dipakai untuk menemukan halaman yang perlu dilihat, lalu perbedaannya dinilai
dari gambar berdampingan di `qa/screenshots/`. **Tidak ada halaman yang dinyatakan identik.**

## Temuan dan perbaikan (16 Nov 2026)

Dua kali jalan penuh: 16 URL × 5 viewport = 80 perbandingan. Rata-rata skor beda 52,7% pada jalan
pertama dan 52,7% pada jalan kedua — perbaikan di bawah nyata secara visual tetapi hampir tidak
menggerakkan skor piksel, karena alasan di atas.

Perbedaan yang seharusnya tidak ada dan sudah diperbaiki di antara dua jalan:

| Temuan (dari gambar berdampingan) | Perbaikan |
|---|---|
| Lencana opini WTP di footer hilang di semua halaman | Ditambahkan di `Footer.tsx` |
| Angka "Jejak Sebaran Kebaikan" beranda tidak sama — situs asli diperbarui 16 Nov menjadi 450.702 / 5.455 "Relawan Terlibat" / 60+ / 109 | `src/content/home.ts` disamakan |
| 13 post tampil tanpa gambar utama (termasuk post terbaru di beranda, `/berita/`, dan "Kisah Lainnya"), padahal di WordPress ada | Gambar dipulihkan dari `og:image`; logika cadangan yang sama ditambahkan ke `scripts/export-wp.ts` |
| Halaman post: judul hero, kolom artikel, dan CTA lebih lebar daripada WordPress (90% penuh, seharusnya 90% dengan maksimum 1080px) | `PostTemplate`, `DonationCta`, `PageHero` (`width="narrow"`) |
| `/berita/` dan `/artikel/`: judul hero tidak sejajar dengan kontainer konten | `PublicationListing` memakai `width="container"` |

Perbedaan yang dibiarkan (keputusan desain atau di luar kendali kode):

- Halaman khusus (Profil, Audit, Legalitas, Pilar, Program Kami, Kemitraan, e-Report), arsip,
  pencarian, 404, dan menu mobile mengikuti kanvas desain, bukan tampilan WordPress.
- Hero halaman WordPress setinggi layar (100vh); di Next.js tingginya tetap sesuai artboard.
- Jarak atas bagian intro beranda ±120px lebih rapat daripada WordPress (mengikuti artboard 01).
- Footer WordPress punya ruang bawah lebih besar.
- Slide hero dan urutan carousel berbeda saat tangkapan diambil.
- Kontras: beberapa warna teks sengaja digelapkan (footer, tombol "Mari Berdonasi").

## Peringatan: isi artikel di situs WordPress

Pada tangkapan `/bantuan-makanan-pasien-terdampak-konflik-sudan/`, WordPress menampilkan judul
artikel Sudan tetapi **isi artikel lain** ("Api di Dalam Gambut, Tantangan Pemadaman Karhutla").
Pemeriksaan HTML situs asli (16 Nov 2026) mengonfirmasi: teks artikel Sudan tidak ada di halaman
itu, dan isi karhutla berada di modul teks templat post Divi (`et_pb_text_0_tb_body`). Versi
Next.js menampilkan isi yang benar dari ekspor 13 Nov.

Dua post lain yang diperiksa (`taman-zakat-bantuan-karhutla-palangka-raya` dan
`sekolah-lapang-gempa-bumi-sesar-lembang`) menampilkan isi karhutla yang sama, jadi masalahnya ada
di templat post dan kemungkinan mengenai semua post. Sampai templat WordPress diperbaiki, **jangan
menjalankan ulang `npm run export`** — skrip mengambil isi artikel dari HTML publik, sehingga isi
yang salah bisa menimpa konten yang sudah benar.
