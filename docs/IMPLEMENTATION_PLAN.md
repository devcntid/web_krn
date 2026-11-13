# IMPLEMENTATION_PLAN

| # | Tahap | Status |
|---|---|---|
| 1 | Audit WordPress (Phase 1) | ✅ |
| 2 | Init Next.js 16, design tokens, font self-host | ✅ |
| 3 | Layout: header + dropdown + menu mobile + search, footer, Tanya Saffa | ✅ |
| 4 | Data layer + script ekspor konten/media/SEO | ✅ (belum dijalankan — lihat Blocker) |
| 5 | Routing: post, halaman, kategori, tag, search, artikel/berita, sitemap, robots, redirect 301 | ✅ |
| 6 | Beranda (slider, intro, video, peta+statistik, pilar, publikasi, testimoni, CTA e-Report) | ✅ draf, perlu QA dengan aset asli |
| 7 | **Jalankan ekspor** & commit `content/` + media | ⏳ Blocker |
| 8 | Rekonstruksi halaman khusus: Profil, Audit Keuangan (accordion), Legalitas, 4 pilar program, Program Kami, Kemitraan, e-Report | ⏳ (sementara memakai template generik dari HTML ekspor) |
| 9 | Visual regression WordPress vs Next (1440/1280/768/390/360) | ⏳ |
| 10 | QA fungsional, Lighthouse, aksesibilitas, broken link | ⏳ |
| 11 | Deploy preview Vercel + dokumentasi deploy/rollback | ⏳ |

## Blocker
Sandbox pengembangan tidak bisa mengakses relawannusantara.org. Ekspor harus dijalankan dari mesin yang punya akses (`npm run export`) atau setelah domain di-allowlist.

## Risiko
- Ukuran media: hanya media yang dirujuk yang diunduh; cek `content/export-report.json → media.megabytes`. Bila > ±1 GB, pindahkan ke object storage (Vercel Blob/R2) dan atur `images.remotePatterns`.
- Halaman Divi kompleks yang memakai template generik akan terlihat lebih sederhana sampai direkonstruksi (tahap 8).
