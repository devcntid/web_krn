# design/ — file UI/UX

Salinan file desain dari kanvas Claude Design **“Relawan Nusantara — UI/UX Website & Admin CMS”** (versi 13 Nov 2026). Dipakai sebagai acuan visual untuk prompt di `docs/BUILD_PLAYBOOK.md`.

- Kanvas (bisa dibuka, dikomentari, dan diedit): https://claude.ai/artifact/Gd3auLtksKxszYc6oBY9Em — privat; bagikan lewat menu **Share** bila tim perlu akses.
- `canvas.json` = indeks kanvas (posisi, ukuran, judul setiap artboard, catatan).
- `*.dc.html` = sumber tiap artboard (format Design Component: HTML + `{{placeholder}}`, `<sc-for>`, `<sc-if>`, `<dc-import>`). File ini **dibaca sebagai spesifikasi** (struktur, teks, warna, ukuran, spacing) — tidak dirender langsung oleh browser; untuk melihat tampilannya buka kanvas di atas.
- Gambar di desain berupa **placeholder berlabel**; aset asli ada di Vercel Blob (`docs/MEDIA.md`).
- Bila kanvas direvisi, unduh ulang file-filenya ke folder ini agar tetap sinkron.

## Website (Frontend)

| Artboard | File | Route Next.js | Prompt |
|---|---|---|---|
| 01 · Beranda | `Main.dc.html` | `/` | F1 |
| 02 · Detail Post | `Post.dc.html` | `/[slug]/` | F10 |
| 03 · Artikel / Berita *(interaktif)* | `Publikasi.dc.html` | `/artikel/`, `/berita/` | — (sudah) |
| 04 · Pilar Program | `Pilar.dc.html` | `/aksi-kemanusiaan/`, `/lingkungan/`, `/pendidikan/`, `/ekonomi/` | F6 |
| 05 · Profil | `Profil.dc.html` | `/profil-relawan-nusantara/` | F3 |
| 06 · Audit Keuangan *(interaktif)* | `Audit.dc.html` | `/audit-keuangan/` | F4 |
| 07 · Asas Legalitas | `Legalitas.dc.html` | `/asas-legalitas/` | F5 |
| 08 · Kemitraan | `Kemitraan.dc.html` | `/kemitraan/` | F8 |
| 09 · e-Report | `EReport.dc.html` | `/e-report/` | F9 |
| 10 · Kategori / Pencarian | `Arsip.dc.html` | `/category/…`, `/?s=` | F10 |
| 11 · 404 | `NotFound.dc.html` | 404 | F10 |
| M1 · Beranda (mobile) | `MobileBeranda.dc.html` | `/` @390px | F1, F11 |
| M2 · Menu (mobile) *(interaktif)* | `MobileMenu.dc.html` | menu mobile | F11 |
| M3 · Detail Post (mobile) | `MobilePost.dc.html` | `/[slug]/` @390px | F11 |
| M4 · Publikasi (mobile) | `MobilePublikasi.dc.html` | `/berita/` @390px | F11 |
| Komponen · Header | `SiteHeader.dc.html` | semua halaman | — (sudah) |
| Komponen · Footer | `SiteFooter.dc.html` | semua halaman | — (sudah) |

## Admin CMS (Backend)

| Artboard | File | Route | Prompt |
|---|---|---|---|
| A0 · Login | `AdminLogin.dc.html` | `/admin/login` | B3, B4 |
| A1 · Dashboard | `AdminDashboard.dc.html` | `/admin` | B5 |
| A2 · Publikasi (daftar) *(interaktif)* | `AdminPublikasi.dc.html` | `/admin/publikasi` | B6 |
| A3 · Editor Publikasi + SEO | `AdminEditor.dc.html` | `/admin/publikasi/[id]` | B6 |
| A4 · Halaman & Section | `AdminHalaman.dc.html` | `/admin/halaman` | B7 |
| A5 · Kelola Beranda | `AdminBeranda.dc.html` | `/admin/beranda` | B8 |
| A6 · Pustaka Media | `AdminMedia.dc.html` | `/admin/media` | B9 |
| A7 · Kategori & Tag | `AdminTaksonomi.dc.html` | `/admin/taksonomi` | B10 |
| A8 · e-Report & Audit | `AdminEReport.dc.html` | `/admin/laporan` | B11 |
| A9 · SEO & Redirect | `AdminSeo.dc.html` | `/admin/seo` | B12 |
| A10 · Pengguna & Peran | `AdminPengguna.dc.html` | `/admin/pengguna` | B13 |
| A11 · Pengaturan Situs | `AdminPengaturan.dc.html` | `/admin/pengaturan` | B14 |
| A12 · Log Aktivitas | `AdminLog.dc.html` | `/admin/log` | B15 |
| Komponen · Sidebar Admin | `AdminSidebar.dc.html` | layout `/admin` | B4 |

## Catatan dari kanvas
- Warna abu footer digelapkan (#A5A49A → #77756B) agar kontras teks ≥4.5:1.
- Tiap halaman punya tepat satu H1.
- Teks dalam `[kurung siku]` = belum diketahui dari situs asli; isi dengan konten asli saat implementasi, jangan dikarang.
- Usulan baru (boleh ditolak): menu mobile accordion, bar “Donasi Sekarang” lengket di post mobile, filter tema e-Report, tag & bagikan di post, login Google Workspace.
