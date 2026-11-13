/**
 * Unggah SEMUA media hasil ekspor WordPress (public/wp-content/uploads) ke Vercel Blob,
 * dengan pathname yang SAMA: wp-content/uploads/2026/05/logo-rn.png.
 *
 *   BLOB_READ_WRITE_TOKEN=... npm run media:migrate
 *   MEDIA_CONCURRENCY=2 npm run media:migrate      # bila sering rate-limit
 *
 * Karena path dipertahankan, konten tidak perlu diubah: cukup set
 *   NEXT_PUBLIC_MEDIA_BASE_URL=https://<store-id>.public.blob.vercel-storage.com
 * (nilai ini dicetak di akhir proses).
 *
 * Bisa dilanjutkan bila terputus: progres disimpan di content/blob-migrated.json.
 */

import fs from "node:fs/promises";
import path from "node:path";

import { put } from "@vercel/blob";

const ROOT = process.cwd();
const UPLOADS_DIR = path.join(ROOT, "public", "wp-content", "uploads");
const PROGRESS_FILE = path.join(ROOT, "content", "blob-migrated.json");
const CONCURRENCY = Number(process.env.MEDIA_CONCURRENCY ?? 4);
const RETRIES = 5;

const TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".pdf": "application/pdf",
  ".mp4": "video/mp4",
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function walk(dir: string): Promise<string[]> {
  const out: string[] = [];
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(full)));
    else if (!entry.name.endsWith(".part") && !entry.name.startsWith(".")) out.push(full);
  }
  return out;
}

async function main() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error("BLOB_READ_WRITE_TOKEN belum di-set (Vercel → Storage → Blob, atau `vercel env pull .env.local`).");
    process.exit(1);
  }

  const files = await walk(UPLOADS_DIR).catch(() => {
    console.error("public/wp-content/uploads tidak ditemukan — jalankan `npm run export` dulu.");
    process.exit(1);
  });

  let done: Record<string, string> = {};
  try {
    done = JSON.parse(await fs.readFile(PROGRESS_FILE, "utf8"));
  } catch {
    /* mulai baru */
  }

  const todo = files.filter((f) => !done[path.relative(path.join(ROOT, "public"), f).split(path.sep).join("/")]);
  console.log(`${files.length} file · sudah di Blob ${files.length - todo.length} · akan diunggah ${todo.length} (paralel ${CONCURRENCY})`);

  const failed: string[] = [];
  let next = 0;
  let count = 0;
  let baseUrl = Object.values(done)[0]?.split("/wp-content/")[0] ?? "";
  let lastSave = Date.now();

  const save = async () => fs.writeFile(PROGRESS_FILE, JSON.stringify(done, null, 0));

  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, todo.length) }, async () => {
      while (next < todo.length) {
        const file = todo[next++];
        const pathname = path.relative(path.join(ROOT, "public"), file).split(path.sep).join("/");
        const contentType = TYPES[path.extname(file).toLowerCase()] ?? "application/octet-stream";
        let ok = false;
        for (let i = 1; i <= RETRIES && !ok; i++) {
          try {
            const body = await fs.readFile(file);
            const blob = await put(pathname, body, {
              access: "public",
              contentType,
              addRandomSuffix: false, // path harus sama persis dengan WordPress
              allowOverwrite: true,
              multipart: body.length > 20 * 1024 * 1024,
              cacheControlMaxAge: 60 * 60 * 24 * 365,
            });
            done[pathname] = blob.url;
            baseUrl ||= blob.url.split("/wp-content/")[0];
            ok = true;
          } catch (err) {
            if (i === RETRIES) failed.push(`${pathname} — ${(err as Error).message}`);
            else await sleep(1000 * 2 ** (i - 1));
          }
        }
        process.stdout.write(`\r  blob: ${++count}/${todo.length} (gagal ${failed.length})`);
        if (Date.now() - lastSave > 5000) {
          lastSave = Date.now();
          await save();
        }
      }
    }),
  );
  await save();
  process.stdout.write("\n");

  if (failed.length) {
    await fs.writeFile(path.join(ROOT, "content", "blob-failed.json"), JSON.stringify(failed, null, 2));
    console.log(`${failed.length} file gagal — lihat content/blob-failed.json, lalu jalankan ulang perintah ini.`);
  }
  if (baseUrl) {
    console.log(`\nSelesai. Set environment variable (Vercel & .env.local):\n  NEXT_PUBLIC_MEDIA_BASE_URL=${baseUrl}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
