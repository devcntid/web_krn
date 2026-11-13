# Relawan Nusantara — Next.js

Rekonstruksi situs WordPress [relawannusantara.org](https://relawannusantara.org) dengan Next.js 16 (App Router), TypeScript, dan Tailwind CSS 4. Konten WordPress diekspor menjadi file statis (`content/` + `public/wp-content/uploads/`).

## Mulai cepat

```bash
npm install
cp .env.example .env.local      # sesuaikan bila perlu
npm run export                   # ekspor konten & media dari WordPress (wajib sekali)
npm run dev                      # http://localhost:3000
```

> Tanpa `npm run export`, aplikasi tetap bisa dibangun tetapi post/halaman WordPress belum ada.

### Opsi ekspor
```bash
npm run export -- --limit=20 --skip-media   # uji cepat: 20 item per tipe, tanpa unduh media
EXPORT_CONCURRENCY=4 npm run export          # turunkan paralelisme bila server WP lambat
```
Hasil & peringatan: `content/export-report.json`. Ekspor aman dijalankan ulang (media yang sudah ada dilewati).

## Skrip
| Perintah | Fungsi |
|---|---|
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Build & jalankan produksi |
| `npm run lint` · `npm run typecheck` | ESLint · TypeScript |
| `npm run export` | Ekspor WordPress → `content/` + media |
| `npm run media:upload -- <file>` | Unggah gambar baru ke Vercel Blob |

## Environment variables
Lihat `.env.example`: `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_MEDIA_BASE_URL`, `BLOB_READ_WRITE_TOKEN`, `NEXT_PUBLIC_GA_ID`, `NEXT_PUBLIC_META_PIXEL_ID`, `WP_ORIGIN`.

## Deploy (Vercel)
1. Jalankan `npm run export`, commit `content/`. Salin `public/wp-content/uploads` ke **media.relawannusantara.org** (lihat `docs/MEDIA.md`); folder ini tidak masuk git.
2. Import repo ke Vercel (framework: Next.js), isi environment variables.
3. Verifikasi di preview URL (preview otomatis `Disallow: /` di robots.txt).
4. **Jangan pindahkan DNS** sampai QA selesai. WordPress tetap berjalan sampai cut-over.
5. Rollback: Vercel → Deployments → *Promote* deployment sebelumnya; atau kembalikan DNS ke server WordPress.

## Dokumentasi
`docs/WEBSITE_AUDIT.md` · `docs/DESIGN_SYSTEM.md` · `docs/TECHNICAL_ARCHITECTURE.md` · `docs/IMPLEMENTATION_PLAN.md` · `docs/MEDIA.md` · `docs/BUILD_PLAYBOOK.md`
