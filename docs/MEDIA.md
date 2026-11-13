# MEDIA — penyimpanan gambar

Keputusan (13 Nov 2026):

| Jenis | Lokasi | URL di situs |
|---|---|---|
| **Gambar lama** (hasil migrasi WordPress, ±1,67 GB, 5.116 file) | Subdomain **media.relawannusantara.org** | `https://media.relawannusantara.org/wp-content/uploads/…` |
| **Gambar baru** (konten setelah migrasi) | **Vercel Blob** | `https://<store>.public.blob.vercel-storage.com/media/YYYY/MM/…` |

Media **tidak** disimpan di repo/deployment (batas unggah Vercel 100 MB Hobby / 1 GB Pro). Folder `public/wp-content/` di-ignore oleh git.

## 1. Gambar lama → media.relawannusantara.org

Path asli WordPress dipertahankan, jadi konten tidak perlu diubah: aplikasi menambahkan host media saat render (`src/lib/media.ts`).

1. **DNS**: buat record `media.relawannusantara.org` → server statis (server nginx yang ada, atau bucket R2/S3 dengan custom domain).
2. **Salin file** (dari folder project hasil `npm run export`), struktur path harus sama:
   ```bash
   rsync -avz --progress public/wp-content/uploads/ user@server:/var/www/media/wp-content/uploads/
   ```
3. **nginx** (contoh):
   ```nginx
   server {
     server_name media.relawannusantara.org;
     root /var/www/media;
     location /wp-content/uploads/ {
       add_header Cache-Control "public, max-age=31536000, immutable";
       add_header Access-Control-Allow-Origin "*";
       try_files $uri =404;
     }
     location / { return 404; }
     # + sertifikat SSL (certbot)
   }
   ```
4. **Environment** di Vercel (dan `.env.local` saat development):
   ```
   NEXT_PUBLIC_MEDIA_BASE_URL=https://media.relawannusantara.org
   ```
5. Cek: `https://media.relawannusantara.org/wp-content/uploads/2026/05/logo-rn.png` harus tampil.

URL lama `https://relawannusantara.org/wp-content/uploads/...` (backlink, Google Images) tetap berfungsi setelah cut-over karena di-*rewrite* ke host media (`next.config.ts`).

> Development tanpa subdomain: kosongkan `NEXT_PUBLIC_MEDIA_BASE_URL`, file dibaca dari `public/wp-content/uploads` lokal.

## 2. Gambar baru → Vercel Blob

1. Vercel Dashboard → **Storage → Create → Blob** → hubungkan ke project (otomatis menambah `BLOB_READ_WRITE_TOKEN`).
2. Lokal: `vercel env pull .env.local` (atau salin token).
3. Unggah:
   ```bash
   npm run media:upload -- ~/Downloads/foto-kegiatan.jpg
   # ✓ ~/Downloads/foto-kegiatan.jpg
   #   https://xxxx.public.blob.vercel-storage.com/media/2026/11/foto-kegiatan-AbC123.jpg
   ```
4. Pakai URL itu di konten (field `featuredImage.src` atau `<img src="…">` di HTML post). `next/image` sudah diizinkan untuk host `*.public.blob.vercel-storage.com`.

Saat Admin CMS dibangun, tombol **Unggah File** di Pustaka Media akan memakai Vercel Blob yang sama (client upload), sehingga alur ini tidak berubah.
