/**
 * Unggah gambar BARU (konten setelah migrasi) ke Vercel Blob.
 *
 *   BLOB_READ_WRITE_TOKEN=... npm run media:upload -- foto1.jpg foto2.png
 *
 * Token: Vercel Dashboard → Storage → Blob store → .env.local (atau `vercel env pull`).
 * Hasil: URL publik https://<store>.public.blob.vercel-storage.com/media/2026/11/foto1-xxxx.jpg
 * yang bisa langsung dipakai di konten (featuredImage.src atau <img src> di HTML).
 * Gambar LAMA hasil migrasi diunggah sekali lewat `npm run media:migrate` (docs/MEDIA.md).
 */

import fs from "node:fs/promises";
import path from "node:path";

import { put } from "@vercel/blob";

const TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".pdf": "application/pdf",
};

/** Nama file aman untuk URL: huruf kecil, tanpa spasi/karakter khusus. */
function slugify(name: string) {
  const ext = path.extname(name).toLowerCase();
  const base = path
    .basename(name, path.extname(name))
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-");
  return `${base || "file"}${ext}`;
}

async function main() {
  const files = process.argv.slice(2).filter((a) => !a.startsWith("--"));
  if (!files.length) {
    console.error("Pakai: npm run media:upload -- <file> [file lain…]");
    process.exit(1);
  }
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error("BLOB_READ_WRITE_TOKEN belum di-set (ambil dari Vercel → Storage → Blob).");
    process.exit(1);
  }

  const now = new Date();
  const folder = `media/${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}`;

  for (const file of files) {
    const ext = path.extname(file).toLowerCase();
    const contentType = TYPES[ext];
    if (!contentType) {
      console.error(`✗ ${file}: tipe file tidak didukung (${ext})`);
      continue;
    }
    const body = await fs.readFile(file);
    const blob = await put(`${folder}/${slugify(file)}`, body, {
      access: "public",
      contentType,
      addRandomSuffix: true,
      cacheControlMaxAge: 60 * 60 * 24 * 365,
    });
    console.log(`✓ ${file}\n  ${blob.url}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
