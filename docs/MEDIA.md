# MEDIA — penyimpanan gambar

**Keputusan (13 Nov 2026, revisi):** SEMUA media disimpan di **Vercel Blob** — baik gambar lama hasil migrasi WordPress maupun gambar baru. Tidak memakai subdomain media.

| Jenis | Pathname di Blob | URL |
|---|---|---|
| Gambar lama (migrasi WordPress, ±1,67 GB, 5.116 file) | `wp-content/uploads/YYYY/MM/nama.jpg` (sama persis dengan WordPress) | `https://<store>.public.blob.vercel-storage.com/wp-content/uploads/…` |
| Gambar baru (konten setelah migrasi) | `media/YYYY/MM/nama-<acak>.jpg` | `https://<store>.public.blob.vercel-storage.com/media/…` |

Media **tidak** disimpan di repo/deployment (batas unggah Vercel 100 MB Hobby / 1 GB Pro). Folder `public/wp-content/` di-ignore oleh git dan hanya dipakai lokal sebagai sumber migrasi.

> Biaya: Vercel Blob ditagih per penyimpanan, operasi, dan transfer data. Cek halaman harga Vercel Blob untuk paket Anda sebelum migrasi ±1,7 GB.

## 1. Siapkan Blob store
1. Vercel Dashboard → **Storage → Create → Blob** → hubungkan ke project `krn` (otomatis menambah `BLOB_READ_WRITE_TOKEN` ke environment Vercel).
2. Lokal: `vercel env pull .env.local` (atau salin token ke `.env.local`).

## 2. Migrasikan gambar lama (sekali)
```bash
npm run export            # bila belum: mengisi public/wp-content/uploads
npm run media:migrate     # unggah semua file ke Blob dengan path yang sama
```
- Bisa dilanjutkan bila terputus (progres di `content/blob-migrated.json`); jalankan ulang perintah yang sama.
- Bila kena rate-limit: `MEDIA_CONCURRENCY=2 npm run media:migrate`.
- Di akhir proses dicetak nilai yang harus di-set:
  ```
  NEXT_PUBLIC_MEDIA_BASE_URL=https://<store-id>.public.blob.vercel-storage.com
  ```
  Set di **Vercel → Settings → Environment Variables** dan di `.env.local`.

Cara kerjanya: konten tetap menyimpan path asli `/wp-content/uploads/...`; `src/lib/media.ts` menambahkan host Blob saat render (komponen `next/image` dan HTML konten). URL lama `https://relawannusantara.org/wp-content/uploads/...` (backlink, Google Images) tetap berfungsi setelah cut-over karena di-*rewrite* ke Blob (`next.config.ts`).

Cek: buka `https://<store-id>.public.blob.vercel-storage.com/wp-content/uploads/2026/05/logo-rn.png`.

> Development sebelum migrasi: kosongkan `NEXT_PUBLIC_MEDIA_BASE_URL` → file dibaca dari `public/wp-content/uploads` lokal.

## 3. Gambar baru
**Cara utama: Pustaka Media di `/admin/media`** (atau tombol unggah di pemilih gambar editor/beranda).
- File dikirim langsung dari browser ke Blob (`@vercel/blob/client`); route `/api/media/upload` hanya menerbitkan token setelah memeriksa sesi dan hak "Unggah & hapus media".
- Tipe & batas: JPG/PNG/WebP/AVIF/GIF ≤ 15 MB, PDF ≤ 30 MB, MP4/WebM ≤ 100 MB (aturan di `src/lib/media-upload.ts`). SVG tidak diizinkan.
- Path: `media/YYYY/MM/nama-<acak>.ext`. Setelah unggah, ukuran & tipe diambil dari Blob, dimensi dibaca dari file, lalu dicatat di tabel `media`.
- Hapus dari pustaka = hapus file di Blob + baris tabel; ditolak selama file masih dipakai publikasi, halaman, atau pengaturan.
- Butuh `BLOB_READ_WRITE_TOKEN` di environment (lokal: `vercel env pull .env.local`). Tanpa token, pustaka tetap bisa dibuka tetapi unggah dan hapus ditolak dengan pesan.

Lewat terminal (tanpa pencatatan di tabel `media`):
```bash
npm run media:upload -- ~/Downloads/foto-kegiatan.jpg
# ✓ ~/Downloads/foto-kegiatan.jpg
#   https://<store-id>.public.blob.vercel-storage.com/media/2026/11/foto-kegiatan-AbC123.jpg
```
Pakai URL itu di konten (`featuredImage.src` atau `<img src="…">`). Saat Admin CMS dibangun, Pustaka Media mengunggah ke Blob store yang sama (client upload, prompt B9 di `docs/BUILD_PLAYBOOK.md`).

`next/image` sudah mengizinkan host `*.public.blob.vercel-storage.com`.
